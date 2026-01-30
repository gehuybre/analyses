#!/usr/bin/env python3
"""
Generate belgium_arrondissements.json by aggregating municipality geometries.

This script:
1. Reads belgium_municipalities.json (581 features)
2. Reads refnis.csv to get municipality → arrondissement mapping
3. Groups municipalities by arrondissement and unions their geometries
4. Outputs belgium_arrondissements.json (43 features)
"""

import json
import csv
from pathlib import Path
from collections import defaultdict

# Try to import geopandas, fall back to shapely if needed
try:
    import geopandas as gpd
    from shapely.geometry import shape, mapping
    from shapely.ops import unary_union
    HAS_GEOPANDAS = True
except ImportError:
    print("Warning: geopandas not installed. Installing dependencies...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "geopandas", "shapely"])
    import geopandas as gpd
    from shapely.geometry import shape, mapping
    from shapely.ops import unary_union
    HAS_GEOPANDAS = True

# Paths
BASE_DIR = Path(__file__).parent.parent
MUN_GEOJSON = BASE_DIR / "public" / "maps" / "belgium_municipalities.json"
REFNIS_CSV = BASE_DIR / "shared-data" / "nis" / "refnis.csv"
OUTPUT_GEOJSON = BASE_DIR / "public" / "maps" / "belgium_arrondissements.json"

def load_municipality_geojson():
    """Load municipality GeoJSON and return as dict."""
    with open(MUN_GEOJSON, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_refnis_mapping():
    """
    Load refnis.csv and return:
    - mun_to_arr: dict mapping municipality code → arrondissement code
    - arrondissements: list of {code, name, provinceCode} for 43 arrondissements
    """
    mun_to_arr = {}
    arrondissements = {}

    with open(REFNIS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            level = row['LVL_REFNIS']
            code = row['CD_REFNIS']
            sup_code = row['CD_SUP_REFNIS']
            name_nl = row['TX_REFNIS_NL']
            end_date = row['DT_VLDT_END']

            # Only consider active entries (end date = 9999)
            if end_date != '31/12/9999':
                continue

            # Level 3 = arrondissements
            if level == '3':
                arrondissements[code] = {
                    'code': code,
                    'name': name_nl,
                    'provinceCode': sup_code
                }

            # Level 4 = municipalities
            if level == '4':
                mun_to_arr[code] = sup_code

    return mun_to_arr, list(arrondissements.values())

def generate_arrondissement_geojson():
    """Main function to generate arrondissement GeoJSON."""
    print("Loading municipality GeoJSON...")
    mun_geojson = load_municipality_geojson()

    print("Loading refnis mapping...")
    mun_to_arr, arrondissements = load_refnis_mapping()

    print(f"Found {len(arrondissements)} arrondissements")
    print(f"Found {len(mun_to_arr)} municipality → arrondissement mappings")

    # Group municipalities by arrondissement
    arr_to_features = defaultdict(list)

    for feature in mun_geojson['features']:
        mun_code = str(feature['properties']['code'])
        arr_code = mun_to_arr.get(mun_code)

        if not arr_code:
            print(f"Warning: No arrondissement found for municipality {mun_code}")
            continue

        arr_to_features[arr_code].append(feature)

    print(f"Grouped municipalities into {len(arr_to_features)} arrondissements")

    # Union geometries per arrondissement
    arr_features = []

    for arr_info in sorted(arrondissements, key=lambda x: x['code']):
        arr_code = arr_info['code']
        features = arr_to_features.get(arr_code, [])

        if not features:
            print(f"Warning: No municipalities found for arrondissement {arr_code} ({arr_info['name']})")
            continue

        print(f"Processing {arr_code} ({arr_info['name']}): {len(features)} municipalities")

        # Convert GeoJSON geometries to shapely shapes
        geometries = [shape(f['geometry']) for f in features]

        # Union all geometries
        union_geom = unary_union(geometries)

        # Create feature
        arr_feature = {
            'type': 'Feature',
            'properties': {
                'code': arr_code,
                'name': arr_info['name'],
                'provinceCode': arr_info['provinceCode']
            },
            'geometry': mapping(union_geom)
        }

        arr_features.append(arr_feature)

    # Create output GeoJSON
    output = {
        'type': 'FeatureCollection',
        'features': arr_features
    }

    # Write to file
    print(f"\nWriting {len(arr_features)} arrondissements to {OUTPUT_GEOJSON}...")
    with open(OUTPUT_GEOJSON, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)

    # Print file size
    file_size = OUTPUT_GEOJSON.stat().st_size / 1024
    print(f"✓ Generated {OUTPUT_GEOJSON.name} ({file_size:.1f} KB)")
    print(f"✓ Contains {len(arr_features)} arrondissements")

    # Validate
    print("\nValidation:")
    print(f"  - Expected: 43 arrondissements")
    print(f"  - Generated: {len(arr_features)} arrondissements")
    if len(arr_features) == 43:
        print("  ✓ Count matches!")
    else:
        print(f"  ✗ Count mismatch! Missing {43 - len(arr_features)} arrondissements")

if __name__ == '__main__':
    generate_arrondissement_geojson()
