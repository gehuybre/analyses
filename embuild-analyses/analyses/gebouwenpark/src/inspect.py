
import csv
import sys

file_path = "embuild-analyses/analyses/gebouwenpark/data/building_stock_open_data.txt"

try:
    with open(file_path, 'r', encoding='latin-1') as f:
        # Detect delimiter from first line if possible, or just assume |
        first_line = f.readline()
        if '|' in first_line:
            delimiter = '|'
        else:
            delimiter = ','
        
        f.seek(0)
        reader = csv.DictReader(f, delimiter=delimiter)
        
        columns = reader.fieldnames
        print("Columns:", columns)
        
        years = set()
        refnis_lvls = set()
        building_types = set()
        
        count_2022 = 0
        
        for row in reader:
            years.add(row['CD_YEAR'])
            if row['CD_YEAR'] == '2022':
                count_2022 += 1
                refnis_lvls.add(row['CD_REFNIS_LVL'])
                building_types.add(row['CD_BUILDING_TYPE_NL'])
                
                if count_2022 < 5:
                    print("Sample row:", row)

        print("\nYears found:", sorted(list(years)))
        print(f"\nRow count for 2022: {count_2022}")
        print("\nUnique CD_REFNIS_LVL for 2022:", sorted(list(refnis_lvls)))
        print("\nUnique CD_BUILDING_TYPE_NL for 2022:", sorted(list(building_types)))
        
except Exception as e:
    print(f"Error: {e}")
