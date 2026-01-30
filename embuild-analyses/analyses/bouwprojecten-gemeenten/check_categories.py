"""Check if categories are correctly applied to projects_2026_full.parquet"""
import pandas as pd
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))
from category_keywords import classify_project, get_category_label, CATEGORY_DEFINITIONS

# Load the parquet file
parquet_file = Path(__file__).parent / 'results' / 'projects_2026_full.parquet'
df = pd.read_parquet(parquet_file)

print("="*80)
print("PARQUET FILE ANALYSIS")
print("="*80)
print(f"Total records: {len(df)}")
print(f"\nColumns: {list(df.columns)}")
print(f"\nFirst few rows:")
print(df.head())

# Check if categories column exists
if 'categories' in df.columns:
    print("\n" + "="*80)
    print("CATEGORY DISTRIBUTION")
    print("="*80)
    
    # Count categories
    category_counts = {}
    for categories in df['categories']:
        if isinstance(categories, list):
            for cat in categories:
                category_counts[cat] = category_counts.get(cat, 0) + 1
        elif isinstance(categories, str):
            # Try parsing as list
            import ast
            try:
                cat_list = ast.literal_eval(categories)
                for cat in cat_list:
                    category_counts[cat] = category_counts.get(cat, 0) + 1
            except:
                category_counts[categories] = category_counts.get(categories, 0) + 1
    
    print(f"\nCategory counts:")
    for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        label = get_category_label(cat)
        print(f"  {cat} ({label}): {count}")
    
    # Sample some records to verify classification
    print("\n" + "="*80)
    print("SAMPLE CLASSIFICATION VERIFICATION")
    print("="*80)
    
    for idx in [0, 100, 200, 300, 400]:
        if idx >= len(df):
            break
        row = df.iloc[idx]
        
        print(f"\n--- Record {idx} ---")
        print(f"Municipality: {row.get('municipality', 'N/A')}")
        print(f"AC Short: {row.get('ac_short', 'N/A')[:100]}")
        print(f"AC Long: {row.get('ac_long', 'N/A')[:100]}")
        
        # Re-classify to verify
        ac_short = str(row.get('ac_short', ''))
        ac_long = str(row.get('ac_long', ''))
        recalculated_cats = classify_project(ac_short, ac_long)
        stored_cats = row.get('categories', [])
        
        # Normalize stored categories
        if isinstance(stored_cats, str):
            import ast
            try:
                stored_cats = ast.literal_eval(stored_cats)
            except:
                stored_cats = [stored_cats]
        
        print(f"Stored categories: {stored_cats}")
        print(f"Re-calculated categories: {recalculated_cats}")
        
        if set(stored_cats) != set(recalculated_cats):
            print("⚠️  MISMATCH!")
        else:
            print("✓ Match")

else:
    print("\n⚠️  WARNING: 'categories' column not found in parquet file!")
    print("Available columns:", list(df.columns))

