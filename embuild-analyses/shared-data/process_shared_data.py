import pandas as pd
import os
import geopandas as gpd

def process_geo():
    input_path = 'geo/LAU_RG_01M_2024_4326.gpkg'
    output_path = '../public/maps/belgium_municipalities.json'
    
    if not os.path.exists(input_path):
        print(f"Skipping Geo: {input_path} not found")
        return

    print(f"Processing {input_path}...")
    try:
        gdf = gpd.read_file(input_path)
        
        # Filter for Belgium
        if 'CNTR_CODE' in gdf.columns:
            gdf = gdf[gdf['CNTR_CODE'] == 'BE']
            
        # Create NIS code column (remove BE_ prefix)
        if 'GISCO_ID' in gdf.columns:
            gdf['code'] = gdf['GISCO_ID'].str.replace('BE_', '')
            
        # Keep relevant columns
        cols = ['code', 'LAU_NAME', 'geometry']
        gdf = gdf[cols]
        
        # Simplify geometry (0.001 degrees ~ 111m)
        gdf['geometry'] = gdf.geometry.simplify(0.001)
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        gdf.to_file(output_path, driver='GeoJSON')
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Error processing Geo: {e}")

def process_nace():
    input_path = 'nace/NACEBEL_2025.xlsx'
    output_path = 'nace/nace_codes.csv'
    
    if not os.path.exists(input_path):
        print(f"Skipping NACE: {input_path} not found")
        return

    print(f"Processing {input_path}...")
    try:
        df = pd.read_excel(input_path)
        df.to_csv(output_path, index=False)
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Error processing NACE: {e}")

def process_nis():
    input_path = 'nis/TU_COM_REFNIS.txt'
    output_path = 'nis/refnis.csv'
    
    if not os.path.exists(input_path):
        print(f"Skipping NIS: {input_path} not found")
        return

    print(f"Processing {input_path}...")
    try:
        # Try UTF-8 first
        df = pd.read_csv(input_path, sep='|')
    except UnicodeDecodeError:
        print("UTF-8 failed, trying latin-1...")
        df = pd.read_csv(input_path, sep='|', encoding='latin-1')
    except Exception as e:
        print(f"Error processing NIS: {e}")
        return

    df.to_csv(output_path, index=False)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    # Change to script directory to use relative paths
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    process_nace()
    process_nis()
    process_geo()
