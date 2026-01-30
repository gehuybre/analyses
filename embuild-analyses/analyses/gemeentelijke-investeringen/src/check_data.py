#!/usr/bin/env python3
"""Check Beleidsveld coverage in gemeentelijke-investeringen data."""

import json
import pandas as pd
from pathlib import Path

PUBLIC_DIR = Path(__file__).parent.parent.parent.parent / 'public' / 'data' / 'gemeentelijke-investeringen'

# Check BV lookups
with open(PUBLIC_DIR / 'bv_lookups.json') as f:
    bv = json.load(f)
    
print('BV Lookups:')
print(f"  Domains: {len(bv['domains'])}")
print(f"  Subdomeins: {len(bv['subdomeins'])}")
print(f"  Beleidsvelds: {len(bv['beleidsvelds'])}")

# Check BV Vlaanderen data
with open(PUBLIC_DIR / 'bv_vlaanderen_data.json') as f:
    data = json.load(f)
    
df = pd.DataFrame(data)
print(f"\nBV Vlaanderen data shape: {df.shape}")
print(f"Rapportjaren: {sorted(df['Rapportjaar'].unique())}")
print(f"Has Beleidsveld: {'Beleidsveld' in df.columns}")

if 'Beleidsveld' in df.columns:
    print("\nBeleidsveld coverage per rapportjaar:")
    for rj in sorted(df['Rapportjaar'].unique()):
        subset = df[df['Rapportjaar'] == rj]
        with_bv = subset['Beleidsveld'].notna().sum()
        total = len(subset)
        print(f"  {rj}: {with_bv}/{total} records ({100*with_bv/total:.1f}%)")
        
    # Show examples without Beleidsveld
    no_bv = df[df['Beleidsveld'].isna()]
    if len(no_bv) > 0:
        print(f"\nRecords WITHOUT Beleidsveld: {len(no_bv)}")
        print(no_bv[['Rapportjaar', 'BV_domein', 'BV_subdomein', 'Beleidsveld']].head())
else:
    print("\n  WARNING: Beleidsveld column not found!")
