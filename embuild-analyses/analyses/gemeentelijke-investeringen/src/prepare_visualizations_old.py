"""
Prepare visualization data from investments_tidy.parquet for the dashboard.
Generates JSON files with time series, aggregations, and NIS codes.
"""

import pandas as pd
import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
RESULTS_DIR = BASE_DIR / "results"
SHARED_DATA_DIR = BASE_DIR.parent.parent / "shared-data"
NIS_DIR = SHARED_DATA_DIR / "nis"

# Input files
PARQUET_FILE = RESULTS_DIR / "investments_tidy.parquet"
INDEX_GEMEENTE = RESULTS_DIR / "index_gemeente.csv"
INDEX_DOMEIN = RESULTS_DIR / "index_domein.csv"
INDEX_SUBDOMEIN = RESULTS_DIR / "index_subdomein.csv"
REFNIS_FILE = NIS_DIR / "refnis.csv"

# Output files
OUTPUT_VLAANDEREN_DOMAIN = RESULTS_DIR / "investments_by_domain_vlaanderen.json"
OUTPUT_VLAANDEREN_SUBDOMEIN = RESULTS_DIR / "investments_by_subdomein_vlaanderen.json"
OUTPUT_MUNI_TOTAL = RESULTS_DIR / "investments_by_municipality_total.json"
OUTPUT_MUNI_DOMAIN = RESULTS_DIR / "investments_by_municipality_domain.json"
OUTPUT_MUNI_SUBDOMEIN = RESULTS_DIR / "investments_by_municipality_subdomein.json"
OUTPUT_DOMAIN_SUMMARY = RESULTS_DIR / "domain_summary.json"
OUTPUT_SUBDOMEIN_SUMMARY = RESULTS_DIR / "subdomein_summary.json"
OUTPUT_LOOKUPS = RESULTS_DIR / "lookups.json"
OUTPUT_METADATA = RESULTS_DIR / "metadata.json"

print("Start verwerking...")

# Load data
print("\nLaden van data...")
df = pd.read_parquet(PARQUET_FILE)
print(f"Parquet data: {len(df)} rijen")

# Load indices
gemeente_idx = pd.read_csv(INDEX_GEMEENTE)
domein_idx = pd.read_csv(INDEX_DOMEIN)
subdomein_idx = pd.read_csv(INDEX_SUBDOMEIN)

print(f"Index gemeenten: {len(gemeente_idx)}")
print(f"Index domeinen: {len(domein_idx)}")
print(f"Index subdomeinen: {len(subdomein_idx)}")

# Load and process NIS codes
print("\nKoppelen van NIS codes...")
refnis = pd.read_csv(REFNIS_FILE)

# Filter for current Flemish municipalities (level 4 = gemeenten, valid until 9999)
municipalities_nis = refnis[
    (refnis['LVL_REFNIS'] == 4) &
    (refnis['DT_VLDT_END'] == '31/12/9999')
].copy()

print(f"NIS codes gevonden: {len(municipalities_nis)}")

# Create lookup: gemeente name -> NIS code (case insensitive, remove disambiguators)
nis_lookup = {}
for _, row in municipalities_nis.iterrows():
    name_nl = str(row['TX_REFNIS_NL']).strip()
    # Remove disambiguation like "(Aalst)" from "Aalst (Aalst)"
    if '(' in name_nl:
        base_name = name_nl.split('(')[0].strip()
    else:
        base_name = name_nl
    nis_code = str(row['CD_REFNIS'])
    nis_lookup[base_name.lower()] = nis_code

print(f"Unieke gemeentenamen in lookup: {len(nis_lookup)}")

# Add NIS codes to gemeente index (case insensitive matching)
gemeente_idx['NIS_code'] = gemeente_idx['Gemeente'].str.lower().map(nis_lookup)

# Report missing NIS codes
missing_nis = gemeente_idx[gemeente_idx['NIS_code'].isna()]['Gemeente'].tolist()
if missing_nis:
    print(f"⚠️ {len(missing_nis)} gemeenten zonder NIS code:")
    for gem in missing_nis[:10]:
        print(f"  - {gem}")
    if len(missing_nis) > 10:
        print(f"  ... en {len(missing_nis) - 10} meer")
else:
    print("✓ Alle gemeenten gekoppeld aan NIS code")

# Merge indices back to main data
df = df.merge(gemeente_idx[['Gemeente_ID', 'Gemeente', 'NIS_code']], on='Gemeente_ID', how='left')
df = df.merge(domein_idx, on='Domein_ID', how='left')
df = df.merge(subdomein_idx, on='Subdomein_ID', how='left')

print(f"\nData na koppeling: {len(df)} rijen")
print(f"Kolommen: {list(df.columns)}")

# Extract domain code and name from "0 Algemene financiering" format
df['Domein_code'] = df['BV_domein'].str.split(' ').str[0]
df['Domein_naam'] = df['BV_domein'].str.split(' ', n=1).str[1]

# Extract subdomein code and name from "00 Algemene financiering" format  
df['Subdomein_code'] = df['BV_subdomein'].str.split(' ').str[0]
df['Subdomein_naam'] = df['BV_subdomein'].str.split(' ', n=1).str[1]

print("\n" + "="*60)
print("1. VLAANDEREN NIVEAU - PER DOMEIN")
print("="*60)

# Aggregate per year, domain, metric (total and per_capita)
vlaanderen_domain = []

for metric_name, value_col in [('total', 'Totaal'), ('per_capita', 'Per_inwoner')]:
    grouped = df.groupby(['Rapportjaar', 'Domein_code', 'Domein_naam'])[value_col].sum().reset_index()
    
    for _, row in grouped.iterrows():
        vlaanderen_domain.append({
            'year': int(row['Rapportjaar']),
            'domain_code': row['Domein_code'],
            'domain_name': row['Domein_naam'],
            'metric': metric_name,
            'value': float(row[value_col])
        })

print(f"Records: {len(vlaanderen_domain)}")

with open(OUTPUT_VLAANDEREN_DOMAIN, 'w') as f:
    json.dump(vlaanderen_domain, f, indent=2)
print(f"✓ {OUTPUT_VLAANDEREN_DOMAIN.name}")

print("\n" + "="*60)
print("2. VLAANDEREN NIVEAU - PER SUBDOMEIN")
print("="*60)

vlaanderen_subdomein = []

for metric_name, value_col in [('total', 'Totaal'), ('per_capita', 'Per_inwoner')]:
    grouped = df.groupby(['Rapportjaar', 'Subdomein_code', 'Subdomein_naam'])[value_col].sum().reset_index()
    
    for _, row in grouped.iterrows():
        vlaanderen_subdomein.append({
            'year': int(row['Rapportjaar']),
            'subdomein_code': row['Subdomein_code'],
            'subdomein_name': row['Subdomein_naam'],
            'metric': metric_name,
            'value': float(row[value_col])
        })

print(f"Records: {len(vlaanderen_subdomein)}")

with open(OUTPUT_VLAANDEREN_SUBDOMEIN, 'w') as f:
    json.dump(vlaanderen_subdomein, f, indent=2)
print(f"✓ {OUTPUT_VLAANDEREN_SUBDOMEIN.name}")

print("\n" + "="*60)
print("3. GEMEENTE NIVEAU - TOTAAL")
print("="*60)

# Group by gemeente for total
muni_total = []

for metric_name, value_col in [('total', 'Totaal'), ('per_capita', 'Per_inwoner')]:
    grouped = df.groupby(['Gemeente', 'NIS_code'], dropna=False)[value_col].sum().reset_index()
    
    for _, row in grouped.iterrows():
        muni_total.append({
            'municipality': row['Gemeente'],
            'nis_code': str(int(row['NIS_code'])) if pd.notna(row['NIS_code']) else None,
            'metric': metric_name,
            'value': float(row[value_col])
        })

print(f"Records: {len(muni_total)}")

with open(OUTPUT_MUNI_TOTAL, 'w') as f:
    json.dump(muni_total, f, indent=2)
print(f"✓ {OUTPUT_MUNI_TOTAL.name}")

print("\n" + "="*60)
print("4. GEMEENTE NIVEAU - PER DOMEIN")
print("="*60)

# Group by gemeente and domein
muni_domain = []

for metric_name, value_col in [('total', 'Totaal'), ('per_capita', 'Per_inwoner')]:
    grouped = df.groupby(['Gemeente', 'NIS_code', 'Domein_code', 'Domein_naam'], dropna=False)[value_col].sum().reset_index()
    
    for _, row in grouped.iterrows():
        muni_domain.append({
            'municipality': row['Gemeente'],
            'nis_code': str(int(row['NIS_code'])) if pd.notna(row['NIS_code']) else None,
            'domain_code': row['Domein_code'],
            'domain_name': row['Domein_naam'],
            'metric': metric_name,
            'value': float(row[value_col])
        })

print(f"Records: {len(muni_domain)}")

with open(OUTPUT_MUNI_DOMAIN, 'w') as f:
    json.dump(muni_domain, f, indent=2)
print(f"✓ {OUTPUT_MUNI_DOMAIN.name}")

print("\n" + "="*60)
print("5. GEMEENTE NIVEAU - PER SUBDOMEIN")
print("="*60)

# Group by gemeente and subdomein
muni_subdomein = []

for metric_name, value_col in [('total', 'Totaal'), ('per_capita', 'Per_inwoner')]:
    grouped = df.groupby(['Gemeente', 'NIS_code', 'Subdomein_code', 'Subdomein_naam'], dropna=False)[value_col].sum().reset_index()
    
    for _, row in grouped.iterrows():
        muni_subdomein.append({
            'municipality': row['Gemeente'],
            'nis_code': str(int(row['NIS_code'])) if pd.notna(row['NIS_code']) else None,
            'subdomein_code': row['Subdomein_code'],
            'subdomein_name': row['Subdomein_naam'],
            'metric': metric_name,
            'value': float(row[value_col])
        })

print(f"Records: {len(muni_subdomein)}")

with open(OUTPUT_MUNI_SUBDOMEIN, 'w') as f:
    json.dump(muni_subdomein, f, indent=2)
print(f"✓ {OUTPUT_MUNI_SUBDOMEIN.name}")

print("\n" + "="*60)
print("6. SAMENVATTING - DOMEINEN")
print("="*60)

domain_summary = df.groupby(['Domein_code', 'Domein_naam'])['Totaal'].agg([
    ('total_value', 'sum'),
    ('avg_value', 'mean'),
    ('count', 'count')
]).reset_index()

domain_summary = domain_summary.sort_values('total_value', ascending=False)

domain_summary_list = []
for _, row in domain_summary.iterrows():
    domain_summary_list.append({
        'domain_code': row['Domein_code'],
        'domain_name': row['Domein_naam'],
        'total_value': float(row['total_value']),
        'avg_value': float(row['avg_value']),
        'count': int(row['count'])
    })

print(f"Domeinen: {len(domain_summary_list)}")

with open(OUTPUT_DOMAIN_SUMMARY, 'w') as f:
    json.dump(domain_summary_list, f, indent=2)
print(f"✓ {OUTPUT_DOMAIN_SUMMARY.name}")

print("\n" + "="*60)
print("7. SAMENVATTING - SUBDOMEINEN")
print("="*60)

subdomein_summary = df.groupby(['Subdomein_code', 'Subdomein_naam'])['Totaal'].agg([
    ('total_value', 'sum'),
    ('avg_value', 'mean'),
    ('count', 'count')
]).reset_index()

subdomein_summary = subdomein_summary.sort_values('total_value', ascending=False)

subdomein_summary_list = []
for _, row in subdomein_summary.iterrows():
    subdomein_summary_list.append({
        'subdomein_code': row['Subdomein_code'],
        'subdomein_name': row['Subdomein_naam'],
        'total_value': float(row['total_value']),
        'avg_value': float(row['avg_value']),
        'count': int(row['count'])
    })

print(f"Subdomeinen: {len(subdomein_summary_list)}")

with open(OUTPUT_SUBDOMEIN_SUMMARY, 'w') as f:
    json.dump(subdomein_summary_list, f, indent=2)
print(f"✓ {OUTPUT_SUBDOMEIN_SUMMARY.name}")

print("\n" + "="*60)
print("8. LOOKUPS")
print("="*60)

# Extract codes and names from domain index
domains_lookup = []
for _, row in domein_idx.iterrows():
    parts = row['BV_domein'].split(' ', 1)
    domains_lookup.append({
        'domain_code': parts[0],
        'domain_name': parts[1] if len(parts) > 1 else parts[0]
    })

# Extract codes and names from subdomein index
subdomeinen_lookup = []
for _, row in subdomein_idx.iterrows():
    parts = row['BV_subdomein'].split(' ', 1)
    subdomeinen_lookup.append({
        'subdomein_code': parts[0],
        'subdomein_name': parts[1] if len(parts) > 1 else parts[0]
    })

lookups_data = {
    'domains': domains_lookup,
    'subdomeinen': subdomeinen_lookup,
    'municipalities': [
        {
            'municipality': row['Gemeente'],
            'nis_code': row['NIS_code'] if pd.notna(row['NIS_code']) else None
        }
        for _, row in gemeente_idx.iterrows()
    ]
}

with open(OUTPUT_LOOKUPS, 'w') as f:
    json.dump(lookups_data, f, indent=2)
print(f"✓ {OUTPUT_LOOKUPS.name}")

print("\n" + "="*60)
print("9. METADATA")
print("="*60)

metadata_dict = {
    'total_municipalities': int(df['Gemeente'].nunique()),
    'bv_latest_year': int(df['Rapportjaar'].max()),
    'bv_earliest_year': int(df['Rapportjaar'].min()),
    'total_domains': int(df['Domein_code'].nunique()),
    'total_subdomeinen': int(df['Subdomein_code'].nunique()),
    'total_records': int(len(df)),
    'municipalities_with_nis': int(gemeente_idx['NIS_code'].notna().sum()),
    'is_kostenpost_truncated': False  # We have complete data
}

with open(OUTPUT_METADATA, 'w') as f:
    json.dump(metadata_dict, f, indent=2)
print(f"✓ {OUTPUT_METADATA.name}")

print("\n" + "="*60)
print("KLAAR!")
print("="*60)
print(f"\nGegenereerde bestanden:")
print(f"  - {OUTPUT_VLAANDEREN_DOMAIN.name}")
print(f"  - {OUTPUT_VLAANDEREN_SUBDOMEIN.name}")
print(f"  - {OUTPUT_MUNI_TOTAL.name}")
print(f"  - {OUTPUT_MUNI_DOMAIN.name}")
print(f"  - {OUTPUT_MUNI_SUBDOMEIN.name}")
print(f"  - {OUTPUT_DOMAIN_SUMMARY.name}")
print(f"  - {OUTPUT_SUBDOMEIN_SUMMARY.name}")
print(f"  - {OUTPUT_LOOKUPS.name}")
print(f"  - {OUTPUT_METADATA.name}")
