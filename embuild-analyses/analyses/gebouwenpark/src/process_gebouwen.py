
import csv
import json
import os
from collections import defaultdict

# Configuration
INPUT_FILE = "embuild-analyses/analyses/gebouwenpark/data/building_stock_open_data.txt"
OUTPUT_FILE = "embuild-analyses/analyses/gebouwenpark/results/stats_2025.json"

def process_data():
    print(f"Reading {INPUT_FILE}...")
    
    # Structure for results
    results = {
        "metadata": {
            "year_snapshot": 2025,
            "source": "Statbel Building Stock 2025"
        },
        "snapshot_2025": {
            "national": {"total": 0, "by_type": defaultdict(int)},
            "regions": {} # Key: Region Code, Value: {name, total, by_type}
        },
        "time_series": {
            "years": [],
            "national": {
                "total_buildings": [],
                "residential_buildings": [] 
            },
            "regions": {} # Key: Region Code -> {name, total_buildings: [], residential_buildings: []}
        },
        "available_stat_types": set()
    }

    # Residential building classification based on Statbel Building Stock data
    #
    # Statbel uses the following building type codes for residential buildings:
    # - R1: Huizen in gesloten bebouwing (Closed-row houses)
    # - R2: Huizen in halfopen bebouwing (Semi-detached houses)
    # - R3: Huizen in open bebouwing, hoeven en kastelen (Detached houses, farms, and castles)
    # - R4: Buildings en flatgebouwen met appartementen (Apartment buildings)
    # - R5: Handelshuizen (Trade houses - mixed residential/commercial use)
    #
    # For this analysis, we define "residential buildings" (Woongebouwen) as R1-R4 only.
    # R5 (Handelshuizen) is excluded because these are primarily commercial/mixed-use buildings.

    residential_codes = {'R1', 'R2', 'R3', 'R4'}  # Residential buildings only

    # Time series temporary storage: year -> level -> region -> {total, residential, by_type}
    ts_data = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {
        "total": 0,
        "residential": 0,
        "by_type": defaultdict(int)
    })))
    region_names = {}

    try:
        with open(INPUT_FILE, 'r', encoding='latin-1') as f:
            # Detect delimiter
            line = f.readline()
            delimiter = '|' if '|' in line else ','
            f.seek(0)
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row in reader:
                results["available_stat_types"].add(row['CD_STAT_TYPE'] + ": " + row['CD_STAT_TYPE_NL'])

                # Only process "Aantal gebouwen" (T1) - Number of buildings
                # Other stat types (if present) are tracked in available_stat_types but not processed
                if row['CD_STAT_TYPE'] != 'T1':
                    continue

                year = int(row['CD_YEAR'])
                lvl = row['CD_REFNIS_LVL']
                value = int(row['MS_VALUE'])
                b_type_code = row['CD_BUILDING_TYPE']
                b_type_name = row['CD_BUILDING_TYPE_NL']

                # Check if this building type is residential (R1-R4 only)
                is_residential = b_type_code in residential_codes
                
                # Snapshot 2025
                if year == 2025:
                    if lvl == '1': # National
                        results['snapshot_2025']['national']['total'] += value
                        results['snapshot_2025']['national']['by_type'][b_type_name] += value
                    elif lvl == '2': # Region
                        reg_code = row['CD_REFNIS']
                        reg_name = row['CD_REFNIS_NL']
                        region_names[reg_code] = reg_name
                        
                        if reg_code not in results['snapshot_2025']['regions']:
                            results['snapshot_2025']['regions'][reg_code] = {
                                "name": reg_name,
                                "total": 0,
                                "by_type": defaultdict(int)
                            }
                        results['snapshot_2025']['regions'][reg_code]['total'] += value
                        results['snapshot_2025']['regions'][reg_code]['by_type'][b_type_name] += value

                # Time Series Data (All years)
                # Store by Year -> Level -> Code
                if lvl == '1': # National
                    ts_data[year]['national']['00000']['total'] += value
                    ts_data[year]['national']['00000']['by_type'][b_type_name] += value
                    if is_residential:
                        ts_data[year]['national']['00000']['residential'] += value
                elif lvl == '2': # Regions
                    reg_code = row['CD_REFNIS']
                    reg_name = row['CD_REFNIS_NL']
                    region_names[reg_code] = reg_name

                    ts_data[year]['regions'][reg_code]['total'] += value
                    ts_data[year]['regions'][reg_code]['by_type'][b_type_name] += value
                    if is_residential:
                        ts_data[year]['regions'][reg_code]['residential'] += value

    except Exception as e:
        print(f"Error processing data: {e}")
        return

    # Convert Snapshot defaultdicts
    results['snapshot_2025']['national']['by_type'] = dict(results['snapshot_2025']['national']['by_type'])
    for reg in results['snapshot_2025']['regions'].values():
        reg['by_type'] = dict(reg['by_type'])

    # Process Time Series structure
    sorted_years = sorted(ts_data.keys())
    results['time_series']['years'] = sorted_years

    # Get all building types from the data
    all_building_types = set()
    for year_data in ts_data.values():
        for level_data in year_data.values():
            for region_data in level_data.values():
                all_building_types.update(region_data['by_type'].keys())

    # National TS
    results['time_series']['national']['by_type'] = {btype: [] for btype in all_building_types}
    for y in sorted_years:
        data = ts_data[y]['national']['00000']
        results['time_series']['national']['total_buildings'].append(data['total'])
        results['time_series']['national']['residential_buildings'].append(data['residential'])

        # Add by_type data for each building type
        for btype in all_building_types:
            results['time_series']['national']['by_type'][btype].append(data['by_type'][btype])

    # Regional TS
    for reg_code, reg_name in region_names.items():
        results['time_series']['regions'][reg_code] = {
            "name": reg_name,
            "total_buildings": [],
            "residential_buildings": [],
            "by_type": {btype: [] for btype in all_building_types}
        }
        for y in sorted_years:
            val = ts_data[y]['regions'][reg_code] # defaultdict, returns 0s if missing
            results['time_series']['regions'][reg_code]['total_buildings'].append(val['total'])
            results['time_series']['regions'][reg_code]['residential_buildings'].append(val['residential'])

            # Add by_type data for each building type
            for btype in all_building_types:
                results['time_series']['regions'][reg_code]['by_type'][btype].append(val['by_type'][btype])

    results['available_stat_types'] = list(results['available_stat_types'])
    print("Stat Types Found:", results['available_stat_types'])

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Done. Processed {len(sorted_years)} years. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
