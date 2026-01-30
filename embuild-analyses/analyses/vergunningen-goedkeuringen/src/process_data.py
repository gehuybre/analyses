import pandas as pd
import json
from pathlib import Path
import math

# Configuration
import os
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
# Default input filename (kept for backwards compatibility)
DEFAULT_INPUT_FILE = DATA_DIR / "BV_opendata_260120_102955.txt"
# Allow override via environment variable INPUT_FILE_PATH or download via INPUT_URL/BV_DATA_URL
INPUT_FILE = Path(os.environ.get('INPUT_FILE_PATH', DEFAULT_INPUT_FILE))
INPUT_URL = os.environ.get('INPUT_URL') or os.environ.get('BV_DATA_URL')
OUTPUT_DATA_FILE = RESULTS_DIR / "data_quarterly.json"
OUTPUT_MONTHLY_FILE = RESULTS_DIR / "data_monthly.json"
OUTPUT_MUNICIPALITIES_FILE = RESULTS_DIR / "municipalities.json"
# Also write copies to the public folder so the Next.js frontend can fetch them directly
OUTPUT_PUBLIC_DIR = BASE_DIR.parent.parent / "public" / "data" / "vergunningen-goedkeuringen"

def process_data():
    # Choose input file: prioritize explicit environment override, then downloaded file, then default
    input_file = Path(os.environ.get('INPUT_FILE_PATH')) if os.environ.get('INPUT_FILE_PATH') else DEFAULT_INPUT_FILE

    # If INPUT_URL is provided, download into DATA_DIR and set input_file accordingly
    if INPUT_URL:
        try:
            import requests
            import zipfile
            import time
            import subprocess
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            # Download with proper filename based on URL
            fname = os.environ.get('INPUT_FILENAME') or Path(INPUT_URL).name or 'BV_opendata_latest.zip'
            download_path = DATA_DIR / fname

            def download_with_requests():
                """Download using requests library with retry logic"""
                max_retries = 2
                retry_delay = 2
                for attempt in range(1, max_retries + 1):
                    try:
                        print(f"Downloading {INPUT_URL} -> {download_path}... (requests, attempt {attempt}/{max_retries})")
                        headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                        with requests.get(INPUT_URL, headers=headers, stream=True, timeout=120, verify=True) as r:
                            r.raise_for_status()
                            content_type = r.headers.get('content-type', '')
                            if 'text/html' in content_type:
                                print(f'⚠️  ERROR: Server returned HTML (content-type: {content_type}). This usually means an error page.')
                                raise ValueError('Server returned HTML instead of data file')
                            with open(download_path, 'wb') as f:
                                for chunk in r.iter_content(chunk_size=8192):
                                    if chunk:
                                        f.write(chunk)
                        return True
                    except (requests.RequestException, IOError) as e:
                        if attempt < max_retries:
                            print(f'⚠️  Request attempt {attempt} failed: {e}. Retrying in {retry_delay}s...')
                            time.sleep(retry_delay)
                            retry_delay *= 2
                        else:
                            print(f'❌ Requests download failed after {max_retries} attempts: {e}')
                            return False

            def download_with_curl():
                """Fallback: Download using curl command"""
                try:
                    print(f"Downloading with curl: {INPUT_URL} -> {download_path}...")
                    result = subprocess.run(
                        ['curl', '-L', '-f', '-o', str(download_path), '--max-time', '120',
                         '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                         INPUT_URL],
                        capture_output=True, text=True, timeout=130
                    )
                    if result.returncode == 0:
                        print("curl download succeeded")
                        return True
                    else:
                        print(f'❌ curl failed with code {result.returncode}: {result.stderr}')
                        return False
                except FileNotFoundError:
                    print('⚠️  curl not available')
                    return False
                except Exception as e:
                    print(f'❌ curl download failed: {e}')
                    return False

            def validate_download():
                """Validate the downloaded file"""
                if not download_path.exists():
                    raise FileNotFoundError(f"Download file not found: {download_path}")

                file_size = download_path.stat().st_size
                print(f"Downloaded file size: {file_size} bytes")

                # Always check if file is HTML (check first 1KB regardless of file size)
                with open(download_path, 'rb') as f:
                    preview = f.read(1024).decode('utf-8', errors='ignore')
                    if '<html' in preview.lower() or '<!doctype' in preview.lower() or '<body' in preview.lower():
                        print(f'⚠️  ERROR: Downloaded file appears to be HTML. First 200 chars:\n{preview[:200]}')
                        raise ValueError('Server returned HTML instead of data file.')

            # Try download with requests first, fallback to curl
            success = download_with_requests()
            if not success:
                print("Trying fallback download method (curl)...")
                success = download_with_curl()

            if not success:
                raise RuntimeError("All download methods failed")

            # Validate the downloaded file
            validate_download()

            # If ZIP, try to extract the relevant file
            if str(download_path).lower().endswith('.zip'):
                print(f"Downloaded ZIP file {download_path}, extracting...")
                try:
                    with zipfile.ZipFile(download_path, 'r') as z:
                        z.extractall(DATA_DIR)
                        # Prefer a file that contains 'BUILDING' or 'TF_BUILDING' and ends with .txt or .csv
                        candidates = [p for p in z.namelist() if p.lower().endswith(('.txt', '.csv'))]
                        preferred = None
                        for c in candidates:
                            if 'building' in c.lower() or 'tf_building' in c.lower():
                                preferred = c
                                break
                        if not preferred and candidates:
                            preferred = candidates[0]
                        if preferred:
                            extracted_path = DATA_DIR / Path(preferred).name
                            print(f"Using extracted file: {extracted_path}")
                            input_file = extracted_path
                        else:
                            print('No text/csv file found inside ZIP; falling back to downloaded ZIP file path')
                            input_file = download_path
                except zipfile.BadZipFile as zip_err:
                    print(f'❌ ZIP extraction failed: {zip_err}')
                    print('This usually means the downloaded file is corrupted or not actually a ZIP file.')
                    print('Check if the server is returning an error page or if there\'s a network issue.')
                    raise
            else:
                input_file = download_path
        except Exception as e:
            print(f'❌ Download failed: {e}')
            print('Falling back to local file if available...')
            # fall back to environment-specified INPUT_FILE_PATH or default
    else:
        print('No INPUT_URL provided, using local file or INPUT_FILE_PATH override.')

    # If input file doesn't exist, try to find the most recent .txt file in DATA_DIR
    if not Path(input_file).exists():
        print(f"Input file {input_file} not found, searching for recent .txt files...")
        if DATA_DIR.exists():
            txt_files = sorted(
                [f for f in DATA_DIR.glob('BV_opendata_*.txt')],
                key=lambda f: f.stat().st_mtime,
                reverse=True
            )
            if txt_files:
                input_file = txt_files[0]
                print(f"Found most recent file: {input_file}")
            else:
                raise FileNotFoundError(f"No input file found. Expected {input_file} or recent BV_opendata_*.txt files in {DATA_DIR}")
        else:
            raise FileNotFoundError(f"Data directory does not exist: {DATA_DIR}")

    print(f"Reading {input_file}...")
    # Read the text file (assuming comma separated based on previous CSV check, or check delimiter)
    # The previous read_file of csv showed comma. Let's assume the txt is also comma or tab.
    # Usually these exports are CSVs.
    try:
        df = pd.read_csv(input_file, encoding='utf-8', sep='|', low_memory=False)
    except Exception:
        df = pd.read_csv(input_file, encoding='latin1', sep='|', low_memory=False)

    print("Filtering for municipalities (Level 5)...")
    # Filter for municipalities
    df_mun = df[df['CD_REFNIS_LEVEL'] == 5].copy()

    # Filter out yearly totals (Period 0)
    df_mun = df_mun[df_mun['CD_PERIOD'] != 0]

    # Calculate Quarter
    df_mun['Quarter'] = (df_mun['CD_PERIOD'] - 1) // 3 + 1

    # Select relevant columns
    # MS_BUILDING_RES_RENOVATION: Renovation
    # MS_DWELLING_RES_NEW: New Construction - Total dwellings
    # MS_APARTMENT_RES_NEW: New Construction - Apartments
    # MS_SINGLE_HOUSE_RES_NEW: New Construction - Single houses
    cols = [
        'CD_YEAR', 'Quarter', 'CD_REFNIS_MUNICIPALITY', 'REFNIS_NL',
        'MS_BUILDING_RES_RENOVATION',
        'MS_DWELLING_RES_NEW',
        'MS_APARTMENT_RES_NEW',
        'MS_SINGLE_HOUSE_RES_NEW'
    ]
    df_subset = df_mun[cols]

    print("Aggregating by Quarter...")
    # Group by Year, Quarter, Municipality
    df_agg = df_subset.groupby(['CD_YEAR', 'Quarter', 'CD_REFNIS_MUNICIPALITY', 'REFNIS_NL']).sum().reset_index()

    # Prepare data for JSON export
    # We want a list of objects, but to save space, maybe a compact format?
    # Or just standard JSON.
    
    # Create municipalities list
    municipalities = df_agg[['CD_REFNIS_MUNICIPALITY', 'REFNIS_NL']].drop_duplicates().sort_values('REFNIS_NL')
    municipalities_list = municipalities.rename(columns={'CD_REFNIS_MUNICIPALITY': 'code', 'REFNIS_NL': 'name'}).to_dict(orient='records')

    # Create data list
    # Rename columns for compactness (quarterly)
    df_agg = df_agg.rename(columns={
        'CD_YEAR': 'y',
        'Quarter': 'q',
        'CD_REFNIS_MUNICIPALITY': 'm',
        'MS_BUILDING_RES_RENOVATION': 'ren',
        'MS_DWELLING_RES_NEW': 'dwell',
        'MS_APARTMENT_RES_NEW': 'apt',
        'MS_SINGLE_HOUSE_RES_NEW': 'house'
    })

    # Drop name from data to save space (lookup via municipalities list)
    df_export = df_agg[['y', 'q', 'm', 'ren', 'dwell', 'apt', 'house']]
    
    data_quarterly = df_export.to_dict(orient='records')

    # Also produce monthly aggregation (CD_PERIOD is month in source)
    print("Aggregating by Month...")
    # Use df_mun which still contains the original CD_PERIOD column
    df_month = df_mun.rename(columns={'CD_PERIOD': 'mo'})
    # Sum only the relevant metric columns to avoid grouping non-numeric columns
    df_month = df_month.groupby(['CD_YEAR', 'mo', 'CD_REFNIS_MUNICIPALITY', 'REFNIS_NL'])[
        ['MS_BUILDING_RES_RENOVATION', 'MS_DWELLING_RES_NEW', 'MS_APARTMENT_RES_NEW', 'MS_SINGLE_HOUSE_RES_NEW']
    ].sum().reset_index()
    df_month = df_month.rename(columns={
        'CD_YEAR': 'y',
        'mo': 'mo',
        'CD_REFNIS_MUNICIPALITY': 'm',
        'MS_BUILDING_RES_RENOVATION': 'ren',
        'MS_DWELLING_RES_NEW': 'dwell',
        'MS_APARTMENT_RES_NEW': 'apt',
        'MS_SINGLE_HOUSE_RES_NEW': 'house'
    })
    df_month_export = df_month[['y', 'mo', 'm', 'ren', 'dwell', 'apt', 'house']]

    # Sanity check: dwell ≈ apt + house
    df_month_export['calc_dwell'] = df_month_export['apt'] + df_month_export['house']
    df_month_export['diff_pct'] = abs((df_month_export['dwell'] - df_month_export['calc_dwell']) / (df_month_export['dwell'] + 1e-6) * 100)
    high_diff = df_month_export[df_month_export['diff_pct'] > 10]
    if len(high_diff) > 0:
        print(f"⚠️  Warning: {len(high_diff)} rows have >10% difference between dwell and (apt+house)")
        print(f"   Sample rows with high discrepancy:")
        print(high_diff.head(3)[['y', 'mo', 'm', 'dwell', 'apt', 'house', 'calc_dwell', 'diff_pct']])

    # Remove temporary validation columns
    df_month_export = df_month_export[['y', 'mo', 'm', 'ren', 'dwell', 'apt', 'house']]
    data_monthly = df_month_export.to_dict(orient='records')

    print(f"Exporting to {OUTPUT_DATA_FILE} and {OUTPUT_MONTHLY_FILE}...")
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(OUTPUT_DATA_FILE, 'w') as f:
        json.dump(data_quarterly, f)
    with open(OUTPUT_MONTHLY_FILE, 'w') as f:
        json.dump(data_monthly, f)
    with open(OUTPUT_MUNICIPALITIES_FILE, 'w') as f:
        json.dump(municipalities_list, f)

    # Create per-year aggregates for use by the map (one chunk per year)
    yearly_dir = RESULTS_DIR / "yearly"
    yearly_dir.mkdir(parents=True, exist_ok=True)
    years = sorted(df_agg['y'].unique())
    yearly_index = []
    for year in years:
        df_year = df_agg[df_agg['y'] == year]
        df_year_export = df_year[['y', 'm', 'ren', 'dwell', 'apt', 'house']]
        year_file = yearly_dir / f"year_{year}.json"
        df_year_export.to_json(year_file, orient='records', force_ascii=False)
        yearly_index.append({'year': int(year), 'file': str(year_file.relative_to(RESULTS_DIR))})

    with open(RESULTS_DIR / 'yearly_index.json', 'w') as f:
        json.dump(yearly_index, f)

    # Create per-municipality monthly time series (only years > 2018)
    municipalities_dir = RESULTS_DIR / "municipality"
    municipalities_dir.mkdir(parents=True, exist_ok=True)

    # Only include monthly data strictly after 2018 (i.e., 2019+)
    df_month_for_mun = df_month[df_month['y'] > 2018]
    municipality_index = []
    for mun_code, grp in df_month_for_mun.groupby('m'):
        series = grp.sort_values(['y', 'mo'])[['y', 'mo', 'ren', 'dwell', 'apt', 'house']].to_dict(orient='records')
        mun_file = municipalities_dir / f"{str(int(mun_code)).zfill(5)}.json"
        with open(mun_file, 'w') as f:
            json.dump(series, f, ensure_ascii=False)
        municipality_index.append({'code': str(int(mun_code)).zfill(5), 'file': str(mun_file.relative_to(RESULTS_DIR)), 'years': [int(min(g['y'] for g in series)), int(max(g['y'] for g in series))]})

    with open(RESULTS_DIR / 'municipality_index.json', 'w') as f:
        json.dump(municipality_index, f)

    # Also export to public/data for the frontend
    print(f"Also exporting to public data directory: {OUTPUT_PUBLIC_DIR}")
    OUTPUT_PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PUBLIC_DIR / "data_quarterly.json", 'w') as f:
        json.dump(data_quarterly, f)
    with open(OUTPUT_PUBLIC_DIR / "data_monthly.json", 'w') as f:
        json.dump(data_monthly, f)
    with open(OUTPUT_PUBLIC_DIR / "municipalities.json", 'w') as f:
        json.dump(municipalities_list, f)

    # Copy yearly files to public/yearly
    public_yearly_dir = OUTPUT_PUBLIC_DIR / "yearly"
    public_yearly_dir.mkdir(parents=True, exist_ok=True)
    for y in years:
        src = yearly_dir / f"year_{y}.json"
        dst = public_yearly_dir / f"year_{y}.json"
        with open(src, 'r') as fr, open(dst, 'w') as fw:
            fw.write(fr.read())

    # Copy municipality files to public/municipality
    public_mun_dir = OUTPUT_PUBLIC_DIR / "municipality"
    public_mun_dir.mkdir(parents=True, exist_ok=True)
    for entry in municipality_index:
        src = municipalities_dir / Path(entry['file']).name
        dst = public_mun_dir / Path(entry['file']).name
        with open(src, 'r') as fr, open(dst, 'w') as fw:
            fw.write(fr.read())

    # Write indexes to public
    with open(OUTPUT_PUBLIC_DIR / 'yearly_index.json', 'w') as f:
        json.dump(yearly_index, f)
    with open(OUTPUT_PUBLIC_DIR / 'municipality_index.json', 'w') as f:
        json.dump(municipality_index, f)

    print("Done.")

if __name__ == "__main__":
    process_data()


