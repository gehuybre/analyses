#!/usr/bin/env python3
import json
from pathlib import Path
from collections import defaultdict

R = Path(__file__).resolve().parent.parent / 'analyses' / 'vergunningen-goedkeuringen' / 'results'
P = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'vergunningen-goedkeuringen'

R.mkdir(parents=True, exist_ok=True)
P.mkdir(parents=True, exist_ok=True)

# Filter monthly >2018
mfile = R / 'data_monthly.json'
if not mfile.exists():
    print('ERROR: monthly file not found at', mfile)
    raise SystemExit(1)
md = json.load(open(mfile))
filtered = [r for r in md if r.get('y', 0) > 2018]
print('monthly rows before:', len(md), 'after filter:', len(filtered))
json.dump(filtered, open(mfile, 'w'), ensure_ascii=False)
json.dump(filtered, open(P / 'data_monthly.json', 'w'), ensure_ascii=False)

# Create municipality files
mun_dir = R / 'municipality'
pub_mun_dir = P / 'municipality'
mun_dir.mkdir(exist_ok=True)
pub_mun_dir.mkdir(exist_ok=True)
by_m = defaultdict(list)
for r in filtered:
    by_m[str(r['m'])].append(r)
municipality_index = []
for m, rows in by_m.items():
    rows_sorted = sorted(rows, key=lambda r: (r['y'], r['mo']))
    fname = f"{str(m).zfill(5)}.json"
    fp = mun_dir / fname
    with open(fp, 'w') as f:
        json.dump(rows_sorted, f, ensure_ascii=False)
    with open(pub_mun_dir / fname, 'w') as f:
        json.dump(rows_sorted, f, ensure_ascii=False)
    years = [r['y'] for r in rows_sorted]
    municipality_index.append({'code': str(m).zfill(5), 'file': str(fp.relative_to(R)), 'years': [min(years), max(years)]})

json.dump(municipality_index, open(R / 'municipality_index.json','w'), ensure_ascii=False)
json.dump(municipality_index, open(P / 'municipality_index.json','w'), ensure_ascii=False)
print('Wrote municipality files:', len(municipality_index))

# Create yearly files from quarterly
qfile = R / 'data_quarterly.json'
if not qfile.exists():
    print('ERROR: quarterly file not found at', qfile)
    raise SystemExit(1)
qdata = json.load(open(qfile))
by_year_m = defaultdict(lambda: defaultdict(lambda: {'ren':0,'new':0}))
for r in qdata:
    y = r['y']
    # Municipality codes may be represented as floats in the JSON (e.g., 11001.0)
    m = str(int(float(r['m']))).zfill(5)
    by_year_m[y][m]['ren'] += int(r.get('ren') or 0)
    by_year_m[y][m]['new'] += int(r.get('new') or 0)

yearly_dir = R / 'yearly'
pub_yearly_dir = P / 'yearly'
yearly_dir.mkdir(exist_ok=True)
pub_yearly_dir.mkdir(exist_ok=True)
yearly_index = []
for y in sorted(by_year_m.keys()):
    arr = []
    for m, vals in by_year_m[y].items():
        arr.append({'y': int(y), 'm': int(m), 'ren': vals['ren'], 'new': vals['new']})
    fp = yearly_dir / f'year_{y}.json'
    with open(fp, 'w') as f:
        json.dump(arr, f, ensure_ascii=False)
    with open(pub_yearly_dir / fp.name, 'w') as f:
        json.dump(arr, f, ensure_ascii=False)
    yearly_index.append({'year': int(y), 'file': str(fp.relative_to(R))})

json.dump(yearly_index, open(R / 'yearly_index.json','w'), ensure_ascii=False)
json.dump(yearly_index, open(P / 'yearly_index.json','w'), ensure_ascii=False)
print('Wrote yearly files for years:', [y['year'] for y in yearly_index])
