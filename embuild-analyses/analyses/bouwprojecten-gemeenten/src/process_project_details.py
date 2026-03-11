"""
Process municipal investment project details from meerjarenplan projecten.csv.

This script:
1. Parses the CSV file with multi-line text blocks
2. Extracts project details (Beleidsdoelstelling, Actieplan, Actie)
3. Classifies projects into contractor-relevant categories
4. Outputs chunked JSON files for web consumption
"""

import pandas as pd
import json
import re
from pathlib import Path
from typing import Dict, List
from category_keywords import classify_project, classify_project_by_policy_domain, get_category_label, CATEGORY_DEFINITIONS, summarize_projects_by_category

# Directories
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / 'data'
PUBLIC_DATA_DIR = SCRIPT_DIR.parent.parent.parent / 'public' / 'data' / 'bouwprojecten-gemeenten'
PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

# External data repo (if available for split-repo setup)
DATA_REPO_DIR = SCRIPT_DIR.parents[4] / 'data' / 'data' / 'bouwprojecten-gemeenten'
DATA_REPO_AVAILABLE = DATA_REPO_DIR.parent.parent.exists() and DATA_REPO_DIR.parent.parent.name == 'data'
if DATA_REPO_AVAILABLE:
    DATA_REPO_DIR.mkdir(parents=True, exist_ok=True)

# Input files
INPUT_CSV = DATA_DIR / 'data-54.csv'  # Primary data source with policy categorization
PARQUET_FULL = SCRIPT_DIR.parent / 'results' / 'projects_2026_full.parquet'


def _safe_parent(path: Path, level: int):
    """Return parent at `level` if available, else None."""
    return path.parents[level] if len(path.parents) > level else None


def _try_parse_float(value):
    """Best-effort float parser for JSON values."""
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    try:
        return float(value)
    except Exception:
        try:
            return float(str(value).replace(',', '.'))
        except Exception:
            return None


def _median(values: List[float]):
    """Compute median for a non-empty numeric list."""
    sorted_values = sorted(values)
    n = len(sorted_values)
    mid = n // 2
    if n % 2 == 1:
        return sorted_values[mid]
    return (sorted_values[mid - 1] + sorted_values[mid]) / 2


def _find_investments_data_dir():
    """Find a directory containing bv_municipality_data_chunk_*.json files."""
    p4 = _safe_parent(SCRIPT_DIR, 4)
    p5 = _safe_parent(SCRIPT_DIR, 5)
    candidates = [
        SCRIPT_DIR.parent.parent.parent / 'public' / 'data' / 'gemeentelijke-investeringen',
        (p4 / 'public' / 'data' / 'gemeentelijke-investeringen') if p4 else None,
        (p5 / 'data' / 'data' / 'gemeentelijke-investeringen') if p5 else None,
        (p4 / 'data' / 'data' / 'gemeentelijke-investeringen') if p4 else None,
        Path.cwd() / 'data' / 'data' / 'gemeentelijke-investeringen',
    ]

    seen = set()
    for candidate in candidates:
        if not candidate:
            continue
        candidate = candidate.resolve()
        if candidate in seen:
            continue
        seen.add(candidate)
        if candidate.exists() and list(candidate.glob('bv_municipality_data_chunk_*.json')):
            return candidate

    return None


def load_population_lookup():
    """
    Build a NIS -> population lookup from gemeentelijke-investeringen data.

    Population is inferred as Totaal / Per_inwoner and aggregated with a median
    to reduce the impact of outliers.
    """
    investments_dir = _find_investments_data_dir()
    if not investments_dir:
        print("Warning: Could not find gemeentelijke-investeringen chunk data for per-capita calculation")
        return {}

    chunk_files = sorted(investments_dir.glob('bv_municipality_data_chunk_*.json'))
    print(f"Loading population lookup from {len(chunk_files)} municipal investment chunks in {investments_dir}")

    ratios_2026: Dict[str, List[float]] = {}
    ratios_all_years: Dict[str, List[float]] = {}
    outlier_count = 0

    for chunk_file in chunk_files:
        with open(chunk_file, 'r', encoding='utf-8') as f:
            rows = json.load(f)

        for row in rows:
            nis_raw = row.get('NIS_code')
            nis_code = str(nis_raw).strip() if nis_raw is not None else ''
            if not nis_code:
                continue

            total = _try_parse_float(row.get('Totaal'))
            per_inwoner = _try_parse_float(row.get('Per_inwoner'))
            if not total or not per_inwoner or total <= 0 or per_inwoner <= 0:
                continue

            inferred_population = total / per_inwoner
            # Drop clearly implausible ratios to avoid known parse outliers.
            if inferred_population < 1000 or inferred_population > 2_000_000:
                outlier_count += 1
                continue

            ratios_all_years.setdefault(nis_code, []).append(inferred_population)

            rapportjaar = row.get('Rapportjaar')
            if rapportjaar == 2026 or str(rapportjaar) == '2026':
                ratios_2026.setdefault(nis_code, []).append(inferred_population)

    population_lookup = {}
    nis_codes = set(ratios_all_years.keys()) | set(ratios_2026.keys())
    for nis_code in nis_codes:
        values = ratios_2026.get(nis_code) or ratios_all_years.get(nis_code, [])
        if not values:
            continue
        population_lookup[nis_code] = _median(values)

    print(
        f"Built population lookup for {len(population_lookup)} municipalities "
        f"(filtered {outlier_count} outlier rows)"
    )
    return population_lookup


def apply_per_capita(projects, population_lookup):
    """Populate per-capita values on project records using NIS-level population lookup."""
    if not projects:
        return projects

    missing_population = 0
    updated = 0

    for project in projects:
        nis_code = str(project.get('nis_code', '')).strip()
        population = population_lookup.get(nis_code)

        yearly_amounts = project.get('yearly_amounts') or {}
        yearly_per_capita = {}

        if population and population > 0:
            total_amount = _try_parse_float(project.get('total_amount')) or 0
            project['amount_per_capita'] = round(total_amount / population, 2) if total_amount > 0 else 0

            for year, amount in yearly_amounts.items():
                amount_value = _try_parse_float(amount) or 0
                yearly_per_capita[str(year)] = round(amount_value / population, 2) if amount_value > 0 else 0

            updated += 1
        else:
            missing_population += 1
            project['amount_per_capita'] = 0
            for year in yearly_amounts.keys():
                yearly_per_capita[str(year)] = 0

        # Ensure complete 2026-2031 range for UI compatibility
        for year in range(2026, 2032):
            yearly_per_capita.setdefault(str(year), 0)

        project['yearly_per_capita'] = yearly_per_capita

    print(
        f"Per-capita values updated for {updated}/{len(projects)} projects; "
        f"{missing_population} without population lookup"
    )
    return projects


def load_input_dataframe():
    """Load data from the preferred source.

    Priority:
      1) Parquet full snapshot (`results/projects_2026_full.parquet`) if present and appears to be processed
      2) CSV input (`data/meerjarenplan projecten.csv`)

    Returns:
      - If parquet contains processed project records (has 'ac_short' and 'total_amount'), returns (True, list_of_project_dicts)
      - Otherwise returns (False, pandas.DataFrame) for raw CSV to be processed
    """
    # Prefer Parquet processed snapshot
    if PARQUET_FULL.exists():
        print(f"Found parquet snapshot: {PARQUET_FULL}. Loading as processed projects...")
        try:
            df_parquet = pd.read_parquet(PARQUET_FULL)
            # If the parquet appears to be the processed projects (has expected fields), return as projects
            if 'ac_short' in df_parquet.columns and 'total_amount' in df_parquet.columns:
                projects = df_parquet.to_dict(orient='records')
                print(f"Loaded {len(projects)} processed projects from parquet.")
                return True, projects
            else:
                print("Parquet file found but doesn't contain processed project columns; falling back to CSV.")
        except Exception as e:
            print(f"Failed to read parquet snapshot ({e}); falling back to CSV")

    # Fall back to CSV
    if INPUT_CSV.exists():
        print(f"Loading CSV input: {INPUT_CSV}")
        df = pd.read_csv(INPUT_CSV, sep=';', quotechar='"', encoding='utf-8')
        print(f"Loaded {len(df)} records from CSV")
        return False, df

    raise FileNotFoundError(f"No input file found. Checked parquet: {PARQUET_FULL} and csv: {INPUT_CSV}")

# NIS code lookup for municipality names
SHARED_DATA_DIR = SCRIPT_DIR.parent.parent.parent / 'shared-data'
NIS_FILE = SHARED_DATA_DIR / 'nis' / 'refnis.csv'


def load_nis_lookups():
    """Load NIS municipality lookups (both directions)."""
    nis_df = pd.read_csv(NIS_FILE, encoding='utf-8')

    # Filter for Flemish municipalities (NIS codes starting with 1, 2, 3, 4, 7)
    municipalities = nis_df[
        (nis_df['LVL_REFNIS'] == 4) &
        (nis_df['CD_REFNIS'].astype(str).str[0].isin(['1', '2', '3', '4', '7']))
    ].copy()

    # Create lookup dictionaries
    name_to_nis = {}  # municipality name -> NIS code
    nis_to_name = {}  # NIS code -> municipality name

    for _, row in municipalities.iterrows():
        nis_code = str(row['CD_REFNIS'])
        name = row['TX_REFNIS_NL'].strip()
        if '(' in name:
            name = name.split('(')[0].strip()
        name_to_nis[name] = nis_code
        nis_to_name[nis_code] = name

    return name_to_nis, nis_to_name


def load_policy_domain_data():
    """
    Load policy domain data from data-54.csv.

    Creates a lookup mapping (municipality_name, actie_code) to policy domain.
    This allows assigning categories based on actual policy domains instead of keywords.

    Returns:
        dict mapping (municipality_name, actie_code) -> (beleidsdomein, beleidssubdomein) tuple
        or municipality_name -> list of (beleidsdomein, beleidssubdomein) tuples if no code match
    """
    policy_file = DATA_DIR / 'data-54.csv'

    if not policy_file.exists():
        print(f"Warning: Policy domain file not found at {policy_file}")
        return {}

    print(f"Loading policy domain data from {policy_file}")
    policy_df = pd.read_csv(policy_file, sep=';', encoding='utf-8')

    # Create lookup: (municipality, policy_domain) mappings
    policy_lookup = {}

    for _, row in policy_df.iterrows():
        municipality = row.get('Bestuur', '').strip()
        beleidsdomein = row.get('Beleidsdomein', '').strip()
        beleidssubdomein = row.get('Beleidssubdomein', '').strip()

        if not municipality or not beleidsdomein:
            continue

        # Store by municipality
        if municipality not in policy_lookup:
            policy_lookup[municipality] = []

        # Add unique policy domain/subdomain pair
        pair = (beleidsdomein, beleidssubdomein)
        if pair not in policy_lookup[municipality]:
            policy_lookup[municipality].append(pair)

    print(f"Loaded policy data for {len(policy_lookup)} municipalities")
    return policy_lookup


def extract_code_description(text_block):
    """
    Extract code and descriptions from a multi-line text block.

    Expected format:
    "Code: XXX
    Korte omschrijving: Short text
    Lange omschrijving: Long text
    Commentaar: Optional comment
    Evaluatie: Optional evaluation"

    Returns:
        dict with keys: code, short, long, comment, evaluation
    """
    if pd.isna(text_block) or not text_block.strip():
        return {}

    result = {}

    # Extract code (can be like AC123 or 6.1.3. or similar formats)
    code_match = re.search(r'Code:\s*([A-Z0-9.]+)', text_block)
    if code_match:
        result['code'] = code_match.group(1)

    # Extract korte omschrijving
    short_match = re.search(r'Korte omschrijving:\s*(.+?)(?:\n|$)', text_block, re.DOTALL)
    if short_match:
        short_text = short_match.group(1).strip()
        # Extract until next section or newline
        short_text = re.split(r'\n(?=Lange omschrijving:|Commentaar:|Evaluatie:)', short_text)[0].strip()
        result['short'] = short_text

    # Extract lange omschrijving
    long_match = re.search(r'Lange omschrijving:\s*(.+?)(?=\nCommentaar:|\nEvaluatie:|$)', text_block, re.DOTALL)
    if long_match:
        result['long'] = long_match.group(1).strip()

    # Extract commentaar (optional)
    comment_match = re.search(r'Commentaar:\s*(.+?)(?=\nEvaluatie:|$)', text_block, re.DOTALL)
    if comment_match:
        comment_text = comment_match.group(1).strip()
        if comment_text:
            result['comment'] = comment_text

    # Extract evaluatie (optional)
    eval_match = re.search(r'Evaluatie:\s*(.+?)$', text_block, re.DOTALL)
    if eval_match:
        eval_text = eval_match.group(1).strip()
        if eval_text:
            result['evaluation'] = eval_text

    return result


def parse_csv():
    """Parse the CSV file with multi-line text blocks."""
    print("\n" + "="*60)
    print("PARSING MEERJARENPLAN PROJECTEN CSV")
    print("="*60)

    # Read CSV with proper handling of quoted multi-line fields
    df = pd.read_csv(INPUT_CSV, sep=';', quotechar='"', encoding='utf-8')

    print(f"Loaded {len(df)} records from CSV")
    print(f"Columns: {list(df.columns)}")

    return df


def parse_dutch_number(value):
    """Parse Dutch-formatted number (dots as thousands separator)."""
    if pd.isna(value):
        return 0
    if isinstance(value, (int, float)):
        return float(value)
    # Remove dots (thousand separators) and handle potential commas
    amount_str = str(value).strip().replace('.', '').replace(',', '.')
    try:
        return float(amount_str)
    except:
        return 0


def process_projects(df, nis_lookups, policy_lookup=None):
    """Process data-54.csv data into structured project records.

    Data-54.csv contains individual investment line items with policy categorization.
    Projects are aggregated by municipality + action code.

    Args:
        df: Input dataframe (data-54.csv)
        nis_lookups: Tuple of (name_to_nis, nis_to_name) dictionaries
        policy_lookup: Not used when data-54.csv has inline policy data
    """
    print("\n" + "="*60)
    print("PROCESSING PROJECTS FROM DATA-54")
    print("="*60)

    name_to_nis, nis_to_name = nis_lookups
    projects_map = {}  # Group by municipality + action code
    skipped_no_municipality = 0
    skipped_no_nis = 0
    skipped_no_policy = 0
    policy_classified = 0

    for idx, row in df.iterrows():
        if idx % 5000 == 0:
            print(f"Processing record {idx}/{len(df)}...")

        # Get NIS code directly from data-54.csv
        nis_code = row.get('NIS-code')
        if pd.isna(nis_code):
            skipped_no_nis += 1
            continue
        nis_code = str(int(nis_code))

        # Get municipality name from NIS code (correct, authoritative source)
        municipality_name = nis_to_name.get(nis_code)
        if not municipality_name:
            skipped_no_municipality += 1
            continue

        # Extract policy domain (data-54 has this inline)
        beleidsdomein = row.get('Beleidsdomein', '').strip()
        beleidssubdomein = row.get('Beleidssubdomein', '').strip()

        if not beleidsdomein:
            skipped_no_policy += 1
            continue

        # Extract policy domain and action plan details
        bd_data = extract_code_description(row.get('Beleidsdoelst. totaaloverzicht', ''))
        ap_data = extract_code_description(row.get('Actieplan totaaloverzicht', ''))
        ac_data = extract_code_description(row.get('Actie totaaloverzicht', ''))

        if not ac_data.get('short'):
            continue

        # Parse amount
        amount = parse_dutch_number(row.get('Uitgave', 0))
        if amount <= 0:
            continue

        # Get fiscal year
        fiscal_year = str(row.get('Boekjaar', 2026))

        # Create project key: municipality + action code
        ac_code = ac_data.get('code', '')
        project_key = f"{municipality_name}|{ac_code}"

        # Classify using policy domain (preferred method)
        categories = classify_project_by_policy_domain(beleidsdomein, beleidssubdomein)
        policy_classified += 1

        # Initialize or update project
        if project_key not in projects_map:
            projects_map[project_key] = {
                "municipality": municipality_name,
                "nis_code": nis_code,
                "bd_code": bd_data.get('code', ''),
                "bd_short": bd_data.get('short', ''),
                "bd_long": bd_data.get('long', ''),
                "ap_code": ap_data.get('code', ''),
                "ap_short": ap_data.get('short', ''),
                "ap_long": ap_data.get('long', ''),
                "ac_code": ac_code,
                "ac_short": ac_data.get('short', ''),
                "ac_long": ac_data.get('long', ''),
                "categories": categories,
                "total_amount": 0,
                "amount_per_capita": 0,
                "yearly_amounts": {str(y): 0 for y in range(2026, 2032)},
                "yearly_per_capita": {str(y): 0 for y in range(2026, 2032)}
            }

        # Accumulate amount
        projects_map[project_key]["total_amount"] += amount
        projects_map[project_key]["yearly_amounts"][fiscal_year] = \
            projects_map[project_key]["yearly_amounts"].get(fiscal_year, 0) + amount

    # Convert to list and calculate per-capita
    projects = []
    for project_data in projects_map.values():
        # Round amounts
        project_data["total_amount"] = round(project_data["total_amount"], 2)
        project_data["yearly_amounts"] = {
            str(k): round(v, 2) for k, v in project_data["yearly_amounts"].items()
        }
        # Per-capita fields are populated in a dedicated post-processing step.
        project_data["amount_per_capita"] = 0
        project_data["yearly_per_capita"] = {str(y): 0 for y in range(2026, 2032)}
        projects.append(project_data)

    print(f"\nProcessed {len(projects)} unique projects")
    print(f"  - Policy-based classification: {policy_classified}")
    print(f"Skipped: {skipped_no_municipality} (no municipality), {skipped_no_nis} (no NIS), {skipped_no_policy} (no policy domain)")

    return projects


def chunk_and_save(projects, chunk_size=2000):
    """Split projects into chunks and save as JSON files."""
    print("\n" + "="*60)
    print("CHUNKING AND SAVING DATA")
    print("="*60)

    # Sort projects by total amount (descending)
    projects_sorted = sorted(projects, key=lambda x: x['total_amount'], reverse=True)

    # Split into chunks
    chunks = [projects_sorted[i:i + chunk_size] for i in range(0, len(projects_sorted), chunk_size)]

    print(f"Creating {len(chunks)} chunks of ~{chunk_size} projects each")

    def sanitize_project(p):
        """Convert numpy/pandas scalars & containers to native types for JSON serialisation."""
        out = {}
        import numpy as _np
        import pandas as _pd

        for k, v in p.items():
            if v is None:
                out[k] = None
                continue

            # dict -> sanitize recursively
            if isinstance(v, dict):
                out[k] = {str(kk): (vv.tolist() if isinstance(vv, _np.ndarray) else (vv.to_dict() if isinstance(vv, _pd.Series) else vv)) if not isinstance(vv, dict) else sanitize_project(vv) for kk, vv in v.items()}
                continue

            # list/tuple/ndarray
            if isinstance(v, (list, tuple, _np.ndarray)):
                new_list = []
                for item in v:
                    if isinstance(item, dict):
                        new_list.append(sanitize_project(item))
                    else:
                        try:
                            if isinstance(item, (_np.integer, _np.floating)):
                                new_list.append(float(item))
                            else:
                                new_list.append(item)
                        except Exception:
                            new_list.append(item)
                out[k] = new_list
                continue

            # numpy scalar
            try:
                if isinstance(v, (_np.integer, _np.floating)):
                    out[k] = float(v)
                    continue
            except Exception:
                pass

            # pandas timestamp
            try:
                if isinstance(v, _pd.Timestamp):
                    out[k] = str(v)
                    continue
            except Exception:
                pass

            out[k] = v
        return out

    for i, chunk in enumerate(chunks):
        filename = f"projects_2026_chunk_{i}.json"
        # sanitize chunk contents for JSON
        sanitized_chunk = [sanitize_project(p) for p in chunk]

        # Write to public data directory
        filepath = PUBLIC_DATA_DIR / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(sanitized_chunk, f, ensure_ascii=False, indent=2)
        size_mb = filepath.stat().st_size / 1024 / 1024
        print(f"  → {filename} ({len(chunk)} projects, {size_mb:.2f} MB)")

        # Also write to external data repo if available (split-repo setup)
        if DATA_REPO_AVAILABLE:
            repo_filepath = DATA_REPO_DIR / filename
            with open(repo_filepath, 'w', encoding='utf-8') as f:
                json.dump(sanitized_chunk, f, ensure_ascii=False, indent=2)

    # Create metadata file
    total_amount = sum(p['total_amount'] for p in projects)
    municipalities = len(set(p['nis_code'] for p in projects))

    # Summarize projects by category (counts, sums, largest projects)
    category_summaries = summarize_projects_by_category(projects, top_n=10)

    # Normalize numeric types for JSON compatibility
    total_amount_native = float(total_amount)
    metadata = {
        "total_projects": int(len(projects)),
        "total_amount": round(total_amount_native, 2),
        "municipalities": int(municipalities),
        "chunks": len(chunks),
        "chunk_size": chunk_size,
        "categories": category_summaries
    }

    # Sanitize category_summaries numeric fields and ensure all nested data is JSON-serializable
    def sanitize_value(val):
        """Recursively sanitize values for JSON serialization."""
        import numpy as _np
        import pandas as _pd
        
        if val is None:
            return None
        if isinstance(val, dict):
            return {k: sanitize_value(v) for k, v in val.items()}
        if isinstance(val, (list, tuple)):
            return [sanitize_value(item) for item in val]
        if isinstance(val, (_np.integer, _np.floating)):
            return float(val)
        if isinstance(val, _np.ndarray):
            return val.tolist()
        if isinstance(val, _pd.Timestamp):
            return str(val)
        return val
    
    for cat_id, cat in metadata['categories'].items():
        metadata['categories'][cat_id] = sanitize_value(cat)

    # Print a more informative category breakdown
    print(f"\nCategory breakdown (top {10} largest projects shown per category):")
    for cat_id, cat_data in sorted(metadata['categories'].items(), key=lambda x: x[1]['project_count'], reverse=True):
        print(f"  {cat_data['label']}: {cat_data['project_count']} projects, total €{cat_data['total_amount']:,.0f}")

    metadata_file = PUBLIC_DATA_DIR / "projects_metadata.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # Also write to external data repo if available
    if DATA_REPO_AVAILABLE:
        repo_metadata_file = DATA_REPO_DIR / "projects_metadata.json"
        with open(repo_metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"\n  → projects_metadata.json")
    print(f"\nMetadata:")
    print(f"  Total projects: {metadata['total_projects']}")
    print(f"  Total amount: €{metadata['total_amount']:,.0f}")
    print(f"  Municipalities: {metadata['municipalities']}")
    print(f"  Chunks: {metadata['chunks']}")
    print(f"\nCategory breakdown:")
    for cat_id, cat_data in sorted(metadata['categories'].items(), key=lambda x: x[1]['project_count'], reverse=True):
        print(f"  {cat_data['label']}: {cat_data['project_count']} projects")

    # Report export locations
    print(f"\nExport locations:")
    print(f"  ✓ Local: {PUBLIC_DATA_DIR}")
    if DATA_REPO_AVAILABLE:
        print(f"  ✓ Data repo: {DATA_REPO_DIR}")
    else:
        print(f"  ℹ Data repo not available (is gehuybre/data cloned?)")


def main():
    """Main processing pipeline."""
    print("\n" + "="*60)
    print("MUNICIPAL INVESTMENT PROJECT DETAILS PROCESSOR")
    print("="*60)

    # Load NIS lookups
    print("\nLoading NIS municipality lookups...")
    nis_lookups = load_nis_lookups()
    print(f"Loaded {len(nis_lookups[0])} municipalities")

    # Load policy domain data
    print("\nLoading policy domain data...")
    policy_lookup = load_policy_domain_data()

    # Load input: prefer parquet snapshot when available
    is_processed, data = load_input_dataframe()

    if is_processed:
        # Parquet snapshot already contains processed project dicts
        projects = data
    else:
        # Raw CSV dataframe - run full processing
        df = data
        projects = process_projects(df, nis_lookups, policy_lookup)

    # Ensure per-capita values are populated from inferred municipality populations.
    population_lookup = load_population_lookup()
    projects = apply_per_capita(projects, population_lookup)

    # Chunk and save (will write updated metadata including per-category summaries)
    chunk_and_save(projects)

    print("\n" + "="*60)
    print("KLAAR!")
    print("="*60)


if __name__ == "__main__":
    main()
