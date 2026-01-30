"""
Script to prepare visualization data from processed parquet files.

Creates aggregated JSON files for the dashboard:
- BV section: Aggregated by BV_domein, BV_subdomein, Beleidsveld
- REK section: Aggregated by Niveau_3, Alg_rekening
"""

import pandas as pd
import json
import numpy as np
from pathlib import Path

# Load NIS municipality lookups
SHARED_DATA_DIR = Path(__file__).parent.parent.parent.parent / 'shared-data'
NIS_FILE = SHARED_DATA_DIR / 'nis' / 'refnis.csv'

# Directories
SCRIPT_DIR = Path(__file__).parent
PUBLIC_DATA_DIR = SCRIPT_DIR.parent.parent.parent / 'public' / 'data' / 'gemeentelijke-investeringen'
PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR = PUBLIC_DATA_DIR # Use public dir for JSON outputs

# Input files
RESULTS_INTERNAL_DIR = SCRIPT_DIR.parent / 'results'
INPUT_BV = RESULTS_INTERNAL_DIR / 'investments_bv.parquet'
INPUT_REK = RESULTS_INTERNAL_DIR / 'investments_rek.parquet'

class NumpyEncoder(json.JSONEncoder):
    """JSON encoder for numpy types."""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            # Check for NaN and Inf before converting to float
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super().default(obj)

def save_json(data, filename, chunk_size=None):
    """Save data as JSON with NaN handling and optional chunking."""
    output_path = RESULTS_DIR / filename

    # Replace NaN values with None before saving
    def replace_nan(obj):
        if isinstance(obj, dict):
            return {k: replace_nan(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [replace_nan(item) for item in obj]
        elif isinstance(obj, (float, np.floating)):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return obj
        elif pd.isna(obj):
            return None
        else:
            return obj

    data_clean = replace_nan(data)

    if chunk_size and isinstance(data_clean, list):
        chunks = [data_clean[i:i + chunk_size] for i in range(0, len(data_clean), chunk_size)]
        for i, chunk in enumerate(chunks):
            chunk_filename = f"{filename.replace('.json', '')}_chunk_{i}.json"
            chunk_path = RESULTS_DIR / chunk_filename
            with open(chunk_path, 'w', encoding='utf-8') as f:
                json.dump(chunk, f, cls=NumpyEncoder, ensure_ascii=False)
        return len(chunks)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data_clean, f, cls=NumpyEncoder, ensure_ascii=False, indent=2)

    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"  → {filename} ({size_mb:.2f} MB)")
    return 1

# NIS 2025 Fusions mapping (Sources -> Target)
NIS_MERGERS_LOOKUP = {
    '11007': '11002', # Borsbeek -> Antwerpen
    '23023': '23106', '23024': '23106', '23032': '23106', # Pajottegem
    '37012': '37021', '37018': '37021', # Wingene
    '37007': '37022', '37015': '37022', # Tielt
    '44012': '44086', '44048': '44086', # Nazareth-De Pinte
    '44034': '44087', '44073': '44087', # Lochristi
    '46014': '46029', '44045': '46029', # Lokeren
    '44040': '44088', '44043': '44088', # Merelbeke-Melle
    '46003': '46030', '46013': '46030', '11056': '46030', # Beveren-Kruibeke-Zwijndrecht
    '73006': '73110', '73032': '73110', # Bilzen-Hoeselt
    '73009': '73111', '73083': '73111', # Tongeren-Borgloon
    '71069': '71071', '71057': '71071', # Tessenderlo-Ham
    '71022': '71072', '73040': '71072', # Hasselt
}

NEW_MUNI_NAMES = {
    "23106": "Pajottegem",
    "37021": "Wingene",
    "37022": "Tielt",
    "44086": "Nazareth-De Pinte",
    "44087": "Lochristi",
    "46029": "Lokeren",
    "44088": "Merelbeke-Melle",
    "46030": "Beveren-Kruibeke-Zwijndrecht",
    "73110": "Bilzen-Hoeselt",
    "73111": "Tongeren-Borgloon",
    "71071": "Tessenderlo-Ham",
    "71072": "Hasselt"
}

def load_nis_lookups():
    """Load NIS municipality lookups for Flanders only, with 2025 mergers."""
    nis_df = pd.read_csv(NIS_FILE, encoding='utf-8')
    
    # Filter for current/recent Flemish municipalities
    # Flanders NIS codes start with 1, 2, 3, 4, or 7
    municipalities = nis_df[
        (nis_df['LVL_REFNIS'] == 4) &
        (nis_df['CD_REFNIS'].astype(str).str[0].isin(['1', '2', '3', '4', '7']))
    ].copy()

    # Create lookup dictionary
    nis_lookup = {}
    for _, row in municipalities.iterrows():
        nis_code = str(row['CD_REFNIS'])
        # Skip source municipalities that are defunct in 2025
        if nis_code in NIS_MERGERS_LOOKUP and nis_code != NIS_MERGERS_LOOKUP[nis_code]:
            continue
            
        name = row['TX_REFNIS_NL'].strip()
        # Handle bilingual names (e.g., "Bruxelles / Brussel" or "Ronse / Renaix")
        if '/' in name:
            # For NL version, we usually want the second part if it's Brussels, 
            # but for Flemish facilities it's the first part.
            # However, looking at refnis.csv, TX_REFNIS_NL for Ronse is "Ronse (Renaix)" or "Ronse / Renaix"?
            # Actually, most Flemish towns have only the Dutch name in TX_REFNIS_NL.
            # Let's take the first part as a safe default for Dutch.
            name = name.split('/')[0].strip()
        
        if '(' in name:
            name = name.split('(')[0].strip()
        nis_lookup[nis_code] = name

    # Inject new merger targets
    for code, name in NEW_MUNI_NAMES.items():
        nis_lookup[code] = name

    # Final sort
    return dict(sorted(nis_lookup.items(), key=lambda x: x[1]))

def aggregate_by_rapportjaar(df, group_cols, value_cols=['Totaal', 'Per_inwoner']):
    """
    Aggregate data by rapportjaar (sum over 6-year legislatuur periods).

    Legislatuurperiodes:
    - 2014: 2014-2019 (6 jaar)
    - 2020: 2020-2025 (6 jaar)
    - 2026: 2026-2031 (6 jaar)
    """
    # Define legislatuur periods (6 years each)
    legislatuur_periods = {
        2014: (2014, 2019),
        2020: (2020, 2025),
        2026: (2026, 2031),
    }

    # Filter data to only include years within legislatuur periods
    filtered_rows = []
    for rapportjaar, (start_year, end_year) in legislatuur_periods.items():
        df_period = df[
            (df['Rapportjaar'] == rapportjaar) &
            (df['Boekjaar'] >= start_year) &
            (df['Boekjaar'] <= end_year)
        ]
        filtered_rows.append(df_period)

    df_filtered = pd.concat(filtered_rows, ignore_index=True) if filtered_rows else df

    # Aggregate by rapportjaar
    grouped = df_filtered.groupby(['NIS_code', 'Rapportjaar'] + group_cols, dropna=False)[value_cols].sum().reset_index()
    return grouped

def prepare_bv_data():
    """Prepare BV (beleidsdomein) visualization data."""
    print("\n" + "="*60)
    print("PREPARE BV VISUALIZATION DATA")
    print("="*60)

    # Load data
    df = pd.read_parquet(INPUT_BV)
    print(f"Loaded {len(df)} records")

    # Aggregate per rapportjaar
    df_agg = aggregate_by_rapportjaar(df, ['BV_domein', 'BV_subdomein', 'Beleidsveld'])
    print(f"Aggregated to {len(df_agg)} records (per rapportjaar)")

    # Create lookups with unique values
    domains = df_agg[['BV_domein']].drop_duplicates().sort_values('BV_domein').reset_index(drop=True)
    subdomeins = df_agg[['BV_domein', 'BV_subdomein']].drop_duplicates().sort_values(['BV_domein', 'BV_subdomein']).reset_index(drop=True)
    beleidsvelds = df_agg[['BV_subdomein', 'Beleidsveld']].drop_duplicates().sort_values(['BV_subdomein', 'Beleidsveld']).reset_index(drop=True)

    lookups = {
        'domains': domains.to_dict('records'),
        'subdomeins': subdomeins.to_dict('records'),
        'beleidsvelds': beleidsvelds.to_dict('records'),
        'municipalities': load_nis_lookups(),
    }

    print(f"Lookups: {len(domains)} domains, {len(subdomeins)} subdomeins, {len(beleidsvelds)} beleidsvelds")

    # Municipality data (all records)
    muni_data = df_agg.to_dict('records')

    # Vlaanderen totals (sum across all municipalities)
    vlaanderen_totals = df_agg.groupby(['Rapportjaar', 'BV_domein', 'BV_subdomein', 'Beleidsveld'], dropna=False)[['Totaal', 'Per_inwoner']].sum().reset_index()
    vlaanderen_data = vlaanderen_totals.to_dict('records')

    return {
        'lookups': lookups,
        'municipality_data': muni_data,
        'vlaanderen_data': vlaanderen_data,
    }

def prepare_rek_data():
    """Prepare REK (economische rekening) visualization data."""
    print("\n" + "="*60)
    print("PREPARE REK VISUALIZATION DATA")
    print("="*60)

    # Load data
    df = pd.read_parquet(INPUT_REK)
    print(f"Loaded {len(df)} records")

    # Aggregate per rapportjaar
    df_agg = aggregate_by_rapportjaar(df, ['Niveau_3', 'Alg_rekening'])
    print(f"Aggregated to {len(df_agg)} records (per rapportjaar)")

    # Create lookups
    niveau3s = df_agg[['Niveau_3']].drop_duplicates().sort_values('Niveau_3').reset_index(drop=True)
    alg_rekenings = df_agg[['Niveau_3', 'Alg_rekening']].drop_duplicates().sort_values(['Niveau_3', 'Alg_rekening']).reset_index(drop=True)

    lookups = {
        'niveau3s': niveau3s.to_dict('records'),
        'alg_rekenings': alg_rekenings.to_dict('records'),
        'municipalities': load_nis_lookups(),
    }

    print(f"Lookups: {len(niveau3s)} niveau3s, {len(alg_rekenings)} alg_rekenings")

    # Municipality data
    muni_data = df_agg.to_dict('records')

    # Vlaanderen totals
    vlaanderen_totals = df_agg.groupby(['Rapportjaar', 'Niveau_3', 'Alg_rekening'], dropna=False)[['Totaal', 'Per_inwoner']].sum().reset_index()
    vlaanderen_data = vlaanderen_totals.to_dict('records')

    return {
        'lookups': lookups,
        'municipality_data': muni_data,
        'vlaanderen_data': vlaanderen_data,
    }

def main():
    """Generate all visualization data files."""
    chunk_size = 5000

    # Prepare BV data
    bv_results = prepare_bv_data()
    save_json(bv_results['lookups'], 'bv_lookups.json')
    # Also save lookups to internal results dir for nisUtils.ts imports
    save_json(bv_results['lookups'], RESULTS_INTERNAL_DIR / 'bv_lookups.json')
    
    bv_chunks = save_json(bv_results['municipality_data'], 'bv_municipality_data.json', chunk_size=chunk_size)
    save_json(bv_results['vlaanderen_data'], 'bv_vlaanderen_data.json')

    # Prepare REK data
    rek_results = prepare_rek_data()
    save_json(rek_results['lookups'], 'rek_lookups.json')
    # Also save lookups to internal results dir for nisUtils.ts imports
    save_json(rek_results['lookups'], RESULTS_INTERNAL_DIR / 'rek_lookups.json')

    rek_chunks = save_json(rek_results['municipality_data'], 'rek_municipality_data.json', chunk_size=chunk_size)
    save_json(rek_results['vlaanderen_data'], 'rek_vlaanderen_data.json')

    # Create metadata
    df_bv = pd.read_parquet(INPUT_BV)
    # df_rek = pd.read_parquet(INPUT_REK)

    metadata = {
        'rapportjaren': sorted(df_bv['Rapportjaar'].unique().tolist()),
        'total_municipalities': int(df_bv['NIS_code'].nunique()),
        'bv_domains': len(bv_results['lookups']['domains']),
        'bv_subdomeins': len(bv_results['lookups']['subdomeins']),
        'bv_beleidsvelds': len(bv_results['lookups']['beleidsvelds']),
        'rek_niveau3s': len(rek_results['lookups']['niveau3s']),
        'rek_alg_rekenings': len(rek_results['lookups']['alg_rekenings']),
        'bv_chunks': bv_chunks,
        'rek_chunks': rek_chunks,
        'chunk_size': chunk_size
    }
    save_json(metadata, 'metadata.json')

    print("\n" + "="*60)
    print("KLAAR!")
    print("="*60)
    print(f"\nMetadata:")
    print(f"  Rapportjaren: {metadata['rapportjaren']}")
    print(f"  Gemeenten: {metadata['total_municipalities']}")
    print(f"  BV domeinen: {metadata['bv_domains']}")
    print(f"  BV subdomeinen: {metadata['bv_subdomeins']}")
    print(f"  BV beleidsvelds: {metadata['bv_beleidsvelds']}")
    print(f"  REK niveau 3: {metadata['rek_niveau3s']}")
    print(f"  REK alg. rekenings: {metadata['rek_alg_rekenings']}")

if __name__ == '__main__':
    main()
