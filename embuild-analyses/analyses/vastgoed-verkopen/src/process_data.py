"""
Vastgoed verkopen data processor.

Downloads real estate transaction data from Statbel and processes it into
aggregated JSON/CSV files for the blog dashboard.
"""

import json
import os
import re
import zipfile
from pathlib import Path

import pandas as pd
import requests

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
CONTENT_FILE = BASE_DIR / "content.mdx"

DEFAULT_INPUT_URL = "https://statbel.fgov.be/sites/default/files/files/opendata/immo/vastgoed_2010_9999.zip"
DEFAULT_ZIP_NAME = "vastgoed_2010_9999.zip"

# Property types mapping (short codes)
PROPERTY_TYPES = {
    "Huizen met 2 of 3 gevels (gesloten + halfopen bebouwing)": "huizen_23",
    "Huizen met 4 of meer gevels (open bebouwing)": "huizen_4plus",
    "Alle huizen met 2, 3, 4 of meer gevels (excl. appartementen)": "alle_huizen",
    "Appartementen": "appartementen",
}

# NIS code levels
# 1 = Belgium, 2 = Region, 3 = Province, 4 = Arrondissement, 5 = Municipality
LEVEL_BELGIUM = 1
LEVEL_REGION = 2
LEVEL_PROVINCE = 3
LEVEL_ARRONDISSEMENT = 4
LEVEL_MUNICIPALITY = 5


def update_mdx_frontmatter_date(path: Path, date_str: str) -> bool:
    """Update the date field in MDX frontmatter."""
    if not path.exists():
        return False

    text = path.read_text(encoding="utf-8")
    if text.startswith("\ufeff"):
        text = text.lstrip("\ufeff")

    if not text.startswith("---"):
        return False

    newline = "\r\n" if "\r\n" in text else "\n"
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return False

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return False

    fm_lines = lines[1:end_idx]
    body_lines = lines[end_idx + 1 :]

    updated = False
    seen_date = False
    new_fm_lines = []
    for line in fm_lines:
        if re.match(r"^date:\s*.*$", line):
            if not seen_date:
                new_fm_lines.append(f"date: {date_str}{newline}")
                updated = True
                seen_date = True
            else:
                updated = True
        else:
            new_fm_lines.append(line)

    if not seen_date:
        inserted = False
        new2 = []
        for line in new_fm_lines:
            new2.append(line)
            if not inserted and re.match(r"^title:\s*.*$", line):
                new2.append(f"date: {date_str}{newline}")
                inserted = True
        if not inserted:
            new2.append(f"date: {date_str}{newline}")
        new_fm_lines = new2
        updated = True

    new_text = "".join([f"---{newline}", *new_fm_lines, f"---{newline}", *body_lines])
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return updated


def download_input_zip(url: str, dest: Path) -> Path:
    """Download a ZIP file from the given URL."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True, timeout=180) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    return dest


def extract_txt_from_zip(zip_path: Path, extract_dir: Path) -> Path:
    """Extract the main TXT file from the ZIP archive."""
    extract_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as z:
        members = z.namelist()
        candidates = [m for m in members if m.lower().endswith(".txt")]
        chosen = candidates[0] if candidates else None
        if not chosen:
            raise RuntimeError("No .txt file found in ZIP")
        z.extract(chosen, extract_dir)
        return extract_dir / Path(chosen).name


def normalize_nis_code(code: str | int | None) -> str | None:
    """Normalize NIS codes to consistent string format."""
    if code is None or pd.isna(code):
        return None
    s = str(int(float(code))) if isinstance(code, (float, int)) else str(code).strip()
    return s if s else None


def map_nis_to_region(nis: str | None) -> str | None:
    """Map NIS code to region code (2000, 3000, 4000)."""
    if not nis:
        return None
    try:
        code = int(nis)
    except ValueError:
        return None

    # Flanders: 10000-49999 -> 2000
    if 10000 <= code < 50000:
        return "2000"
    # Wallonia: 50000-99999 -> 3000
    if 50000 <= code < 100000:
        return "3000"
    # Brussels: 21000-21999 -> 4000
    if 21000 <= code < 22000:
        return "4000"
    # Already a region code
    if code in [1000, 2000, 3000, 4000]:
        return str(code)
    return None


def map_nis_to_province(nis: str | None) -> str | None:
    """Map municipality NIS code to province code."""
    if not nis:
        return None
    try:
        code = int(nis)
    except ValueError:
        return None

    # Province codes are 5 digits starting with 1-4 + 0000
    # e.g., Antwerpen = 10000, Limburg = 70000, etc.
    province_map = {
        range(10000, 13000): "10000",  # Antwerpen
        range(20000, 25000): "20001",  # Vlaams-Brabant
        range(30000, 35000): "30000",  # West-Vlaanderen
        range(40000, 45000): "40000",  # Oost-Vlaanderen
        range(70000, 73000): "70000",  # Limburg
        range(21000, 22000): "21000",  # Brussels
        range(25000, 29000): "20002",  # Waals-Brabant
        range(50000, 53000): "50000",  # Henegouwen
        range(55000, 58000): "55000",  # Namen
        range(60000, 65000): "60000",  # Luik
        range(80000, 85000): "80000",  # Luxemburg
    }

    for r, prov in province_map.items():
        if code in r:
            return prov
    return None


def process_data() -> None:
    """Main data processing function."""
    input_url = os.environ.get("INPUT_URL") or DEFAULT_INPUT_URL
    input_file_path = os.environ.get("INPUT_FILE_PATH")
    input_filename = os.environ.get("INPUT_FILENAME") or DEFAULT_ZIP_NAME

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    txt_path: Path | None = None
    if input_file_path and Path(input_file_path).exists():
        p = Path(input_file_path)
        if p.suffix.lower() == ".zip":
            txt_path = extract_txt_from_zip(p, DATA_DIR)
        else:
            txt_path = p
    else:
        zip_path = DATA_DIR / input_filename
        download_input_zip(input_url, zip_path)
        txt_path = extract_txt_from_zip(zip_path, DATA_DIR)

    # Read data with latin-1 encoding for special characters
    df = pd.read_csv(
        txt_path,
        sep="|",
        encoding="latin-1",
        dtype=str,
        low_memory=False,
    )

    # Normalize NIS codes
    df["CD_REFNIS"] = df["CD_REFNIS"].apply(normalize_nis_code)
    df["CD_niveau_refnis"] = pd.to_numeric(df["CD_niveau_refnis"], errors="coerce").astype("Int64")

    # Convert numeric columns
    for col in ["MS_TOTAL_TRANSACTIONS", "MS_P_25", "MS_P_50_median", "MS_P_75"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["CD_YEAR"] = pd.to_numeric(df["CD_YEAR"], errors="coerce").astype("Int64")

    # Map property types to short codes
    df["property_type"] = df["CD_TYPE_NL"].map(PROPERTY_TYPES)

    # Update MDX date to latest quarter/year in data
    max_year = int(df["CD_YEAR"].max())
    # Find latest quarter for latest year
    latest_year_data = df[df["CD_YEAR"] == max_year]
    quarters = [q for q in latest_year_data["CD_PERIOD"].unique() if q.startswith("Q")]
    if quarters:
        latest_quarter = max(quarters)
        quarter_num = int(latest_quarter[1])
        # Map quarter to month
        quarter_months = {1: "03-31", 2: "06-30", 3: "09-30", 4: "12-31"}
        date_str = f"{max_year}-{quarter_months.get(quarter_num, '12-31')}"
    else:
        date_str = f"{max_year}-12-31"
    update_mdx_frontmatter_date(CONTENT_FILE, date_str)

    # ============================================================
    # Create aggregated datasets
    # ============================================================

    # 1. Yearly aggregates by property type at different geographic levels
    # Filter to yearly data only (CD_PERIOD == 'Y') and levels 1-3-5 (Belgium, Region, Province, Municipality)
    yearly_df = df[
        (df["CD_PERIOD"] == "Y") &
        (df["CD_niveau_refnis"].isin([LEVEL_BELGIUM, LEVEL_REGION, LEVEL_PROVINCE, LEVEL_MUNICIPALITY]))
    ].copy()

    # Aggregate by year, geo level, NIS code, and property type
    yearly_agg = yearly_df.groupby(
        ["CD_YEAR", "CD_niveau_refnis", "CD_REFNIS", "property_type"],
        dropna=False
    ).agg({
        "MS_TOTAL_TRANSACTIONS": "sum",
        "MS_P_50_median": "mean",  # Average of median prices
        "CD_REFNIS_NL": "first",
    }).reset_index()

    # Rename columns for compact JSON
    yearly_agg = yearly_agg.rename(columns={
        "CD_YEAR": "y",
        "CD_niveau_refnis": "lvl",
        "CD_REFNIS": "nis",
        "property_type": "type",
        "MS_TOTAL_TRANSACTIONS": "n",
        "MS_P_50_median": "p50",
        "CD_REFNIS_NL": "name",
    })

    # Round price to integers
    yearly_agg["p50"] = yearly_agg["p50"].round(0)

    # 2. Quarterly data for all geographic levels (Belgium, Region, Province, Municipality)
    quarterly_df = df[
        (df["CD_PERIOD"].str.startswith("Q", na=False)) &
        (df["CD_niveau_refnis"].isin([LEVEL_BELGIUM, LEVEL_REGION, LEVEL_PROVINCE, LEVEL_MUNICIPALITY]))
    ].copy()

    # Extract quarter number
    quarterly_df["quarter"] = quarterly_df["CD_PERIOD"].str.extract(r"Q(\d)").astype(int)

    quarterly_agg = quarterly_df.groupby(
        ["CD_YEAR", "quarter", "CD_niveau_refnis", "CD_REFNIS", "property_type"],
        dropna=False
    ).agg({
        "MS_TOTAL_TRANSACTIONS": "sum",
        "MS_P_50_median": "mean",
        "MS_P_25": "mean",
        "MS_P_75": "mean",
        "CD_REFNIS_NL": "first",
    }).reset_index()

    quarterly_agg = quarterly_agg.rename(columns={
        "CD_YEAR": "y",
        "quarter": "q",
        "CD_niveau_refnis": "lvl",
        "CD_REFNIS": "nis",
        "property_type": "type",
        "MS_TOTAL_TRANSACTIONS": "n",
        "MS_P_50_median": "p50",
        "MS_P_25": "p25",
        "MS_P_75": "p75",
        "CD_REFNIS_NL": "name",
    })

    # Round prices
    for col in ["p50", "p25", "p75"]:
        quarterly_agg[col] = quarterly_agg[col].round(0)

    # 3. Create lookups for geographic entities
    geo_lookup = df[
        df["CD_niveau_refnis"].isin([LEVEL_BELGIUM, LEVEL_REGION, LEVEL_PROVINCE, LEVEL_MUNICIPALITY])
    ][["CD_REFNIS", "CD_REFNIS_NL", "CD_niveau_refnis"]].drop_duplicates()

    lookups = {
        "property_types": [
            {"code": v, "nl": k}
            for k, v in PROPERTY_TYPES.items()
        ],
        "regions": [
            {"code": row["CD_REFNIS"], "name": row["CD_REFNIS_NL"]}
            for _, row in geo_lookup[geo_lookup["CD_niveau_refnis"] == LEVEL_REGION].iterrows()
        ],
        "provinces": [
            {"code": row["CD_REFNIS"], "name": row["CD_REFNIS_NL"]}
            for _, row in geo_lookup[geo_lookup["CD_niveau_refnis"] == LEVEL_PROVINCE].iterrows()
        ],
        "municipalities": [
            {"code": row["CD_REFNIS"], "name": row["CD_REFNIS_NL"]}
            for _, row in geo_lookup[geo_lookup["CD_niveau_refnis"] == LEVEL_MUNICIPALITY].iterrows()
        ],
    }

    # ============================================================
    # Write output files
    # ============================================================

    # Clean up NaN values for JSON serialization
    def clean_for_json(records):
        cleaned = []
        for r in records:
            clean_r = {}
            for k, v in r.items():
                if pd.isna(v):
                    clean_r[k] = None
                elif isinstance(v, (int, float)) and not isinstance(v, bool):
                    if v != v:  # Check for NaN
                        clean_r[k] = None
                    else:
                        clean_r[k] = int(v) if float(v).is_integer() else float(v)
                else:
                    clean_r[k] = v
            cleaned.append(clean_r)
        return cleaned

    yearly_records = clean_for_json(yearly_agg.to_dict(orient="records"))
    quarterly_records = clean_for_json(quarterly_agg.to_dict(orient="records"))

    (RESULTS_DIR / "yearly.json").write_text(
        json.dumps(yearly_records, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    (RESULTS_DIR / "quarterly.json").write_text(
        json.dumps(quarterly_records, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    (RESULTS_DIR / "lookups.json").write_text(
        json.dumps(lookups, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    # Also write CSV versions
    yearly_agg.to_csv(RESULTS_DIR / "yearly.csv", index=False)
    quarterly_agg.to_csv(RESULTS_DIR / "quarterly.csv", index=False)

    # Write metadata
    metadata = {
        "source_url": input_url,
        "latest_year": max_year,
        "latest_date": date_str,
        "property_types": list(PROPERTY_TYPES.values()),
        "years": sorted(df["CD_YEAR"].dropna().unique().tolist()),
    }
    (RESULTS_DIR / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Processed {len(df)} rows")
    print(f"Yearly records: {len(yearly_records)}")
    print(f"Quarterly records: {len(quarterly_records)}")
    print(f"Latest data: {date_str}")


if __name__ == "__main__":
    process_data()
