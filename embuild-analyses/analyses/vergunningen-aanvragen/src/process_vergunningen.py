"""
Process building permit application data from Omgevingsloket Vlaanderen.

Data source: https://omgevingsloketrapportering.omgeving.vlaanderen.be/wonen

Output structure:
- nieuwbouw_*.json - New construction data
- verbouw_*.json - Renovation data
- sloop_*.json - Demolition data
- aanvrager_yearly.json - Project applicant type data
"""

import pandas as pd
import json
from pathlib import Path

def unique_paths(paths):
    seen = set()
    ordered = []
    for path in paths:
        resolved = path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        ordered.append(path)
    return ordered

def write_json(filename, data, **kwargs):
    """Write JSON to local results/public directories and the split data repo when available."""
    for target_dir in RESULT_TARGET_DIRS:
        with open(target_dir / filename, "w") as f:
            json.dump(data, f, **kwargs)
    for target_dir in PUBLIC_TARGET_DIRS:
        with open(target_dir / filename, "w") as f:
            json.dump(data, f, **kwargs)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
EMBUILD_DIR = BASE_DIR.parent.parent
WORKSPACE_ROOT = EMBUILD_DIR.parent.parent
DATA_REPO_DIR = WORKSPACE_ROOT / "data"

DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# Also write to public data directory for GitHub Pages
PUBLIC_DATA_DIR = EMBUILD_DIR / "public" / "data" / "vergunningen-aanvragen"
PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_RESULTS_DIR = EMBUILD_DIR / "public" / "analyses" / "vergunningen-aanvragen" / "results"
PUBLIC_RESULTS_DIR.mkdir(parents=True, exist_ok=True)

DATA_REPO_RESULTS_DIRS = [
    DATA_REPO_DIR / "analyses" / "vergunningen-aanvragen" / "results",
    DATA_REPO_DIR / "docs" / "analyses" / "vergunningen-aanvragen" / "results",
]
DATA_REPO_PUBLIC_DIRS = [
    DATA_REPO_DIR / "data" / "vergunningen-aanvragen",
    DATA_REPO_DIR / "docs" / "data" / "vergunningen-aanvragen",
]

RESULT_TARGET_DIRS = unique_paths(
    [RESULTS_DIR, PUBLIC_RESULTS_DIR, *DATA_REPO_RESULTS_DIRS] if DATA_REPO_DIR.exists() else [RESULTS_DIR, PUBLIC_RESULTS_DIR]
)
PUBLIC_TARGET_DIRS = unique_paths(
    [PUBLIC_DATA_DIR, *DATA_REPO_PUBLIC_DIRS] if DATA_REPO_DIR.exists() else [PUBLIC_DATA_DIR]
)

for target_dir in [*RESULT_TARGET_DIRS, *PUBLIC_TARGET_DIRS]:
    target_dir.mkdir(parents=True, exist_ok=True)

def simplify_handeling(h):
    if h == "Nieuwbouw":
        return "nieuwbouw"
    if h == "Verbouwen of hergebruik":
        return "verbouw"
    if h == "Sloop":
        return "sloop"
    return "onbekend"

def group_aanvrager(a):
    if a == "Natuurlijk persoon":
        return "natuurlijk_persoon"
    if a in {"Rechtspersoon", "Natuurlijk persoon-Rechtspersoon"}:
        return "rechtspersoon"
    if a in {"Overheid", "Overheid-Rechtspersoon"}:
        return "overheid"
    return "andere"

# Read main CSV
df = pd.read_csv(
    DATA_DIR / "bouwen_of_verbouwen_van_woningen.csv",
    encoding="utf-8-sig",
    decimal=",",
    thousands="."
)

# Rename columns for easier handling
df.columns = [
    "jaar",
    "besluit_type",
    "gebouw_functie",
    "handeling",
    "kwartaal",
    "aantal_projecten",
    "aantal_gebouwen",
    "aantal_gebouwen_info",
    "aantal_wooneenheden",
    "aantal_kamers",
    "woonoppervlakte_m2",
    "oppervlakte_kamerwoning_m2",
    "bovengronds_nuttig_m2",
    "bovengronds_grond_m2",
    "gesloopt_m2",
    "gesloopt_m3"
]

# Clean data
df["kwartaal_nr"] = df["kwartaal"].str.extract(r"Q(\d)").astype(int)
df["jaar"] = df["jaar"].astype(int)

# Replace "-" with meaningful labels
df["besluit_type"] = df["besluit_type"].replace("-", "Onbekend")
df["gebouw_functie"] = df["gebouw_functie"].replace("-", "Onbekend")
df["handeling"] = df["handeling"].replace("-", "Onbekend")

# Simplify gebouw functie to eengezins/meergezins/kamer
def simplify_functie(f):
    if pd.isna(f) or f == "Onbekend":
        return "onbekend"
    if "meergezins" in f:
        return "meergezins"
    elif "eengezins" in f:
        return "eengezins"
    elif "kamerwoning" in f:
        return "kamer"
    return "onbekend"

df["functie_kort"] = df["gebouw_functie"].apply(simplify_functie)

# Filter for residential building types (for nieuwbouw/verbouw)
woningen_functies = [
    "eengezinswoning",
    "meergezinswoning",
    "kamerwoning",
    "eengezins- en kamerwoning",
    "meergezins- en kamerwoning"
]

# Read yearly applicant type CSV and align to the main analysis period
df_aanvrager = pd.read_csv(
    DATA_DIR / "Kopie van bouwstatistieken_met type aanvrager_2026.csv",
    sep=";",
    encoding="utf-8-sig",
    decimal=",",
    thousands="."
)

df_aanvrager.columns = [
    "jaar",
    "gebouw_functie",
    "handeling",
    "aanvrager_type",
    "aantal_projecten",
    "aantal_gebouwen",
    "aantal_gebouwen_info",
    "aantal_wooneenheden",
    "aantal_kamers",
    "woonoppervlakte_m2",
    "oppervlakte_kamerwoning_m2",
    "bovengronds_nuttig_m2",
    "bovengronds_grond_m2",
    "gesloopt_m2",
    "gesloopt_m3",
    "project_toestand",
]

df_aanvrager["jaar"] = df_aanvrager["jaar"].astype(int)
df_aanvrager = df_aanvrager[df_aanvrager["jaar"] <= df["jaar"].max()].copy()
df_aanvrager["gebouw_functie"] = df_aanvrager["gebouw_functie"].replace("-", "Onbekend")
df_aanvrager["handeling"] = df_aanvrager["handeling"].replace("-", "Onbekend")
df_aanvrager["aanvrager_type"] = df_aanvrager["aanvrager_type"].replace("-", "Onbekend")
df_aanvrager["aanvrager_groep"] = df_aanvrager["aanvrager_type"].apply(group_aanvrager)

# ============================================================================
# SECTION 1: NIEUWBOUW (New Construction)
# ============================================================================

df_nieuwbouw = df[(df["handeling"] == "Nieuwbouw") & (df["gebouw_functie"].isin(woningen_functies))].copy()

# Quarterly totals
nieuwbouw_quarterly = df_nieuwbouw.groupby(["jaar", "kwartaal_nr"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values(["jaar", "kwartaal_nr"])

write_json("nieuwbouw_quarterly.json", [
    {"y": int(r["jaar"]), "q": int(r["kwartaal_nr"]), "p": int(r["aantal_projecten"]),
     "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
    for _, r in nieuwbouw_quarterly.iterrows()
])

# Yearly totals
nieuwbouw_yearly = df_nieuwbouw.groupby(["jaar"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values("jaar")

write_json("nieuwbouw_yearly.json", [
    {"y": int(r["jaar"]), "p": int(r["aantal_projecten"]), "g": int(r["aantal_gebouwen"]),
     "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
    for _, r in nieuwbouw_yearly.iterrows()
])

# By type - yearly
nieuwbouw_by_type = df_nieuwbouw.groupby(["jaar", "functie_kort"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values(["jaar", "functie_kort"])

write_json("nieuwbouw_by_type.json", [
    {"y": int(r["jaar"]), "t": r["functie_kort"], "p": int(r["aantal_projecten"]),
     "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
    for _, r in nieuwbouw_by_type.iterrows()
])

# ============================================================================
# SECTION 2: VERBOUW (Renovation)
# ============================================================================

df_verbouw = df[(df["handeling"] == "Verbouwen of hergebruik") & (df["gebouw_functie"].isin(woningen_functies))].copy()

# Quarterly totals
verbouw_quarterly = df_verbouw.groupby(["jaar", "kwartaal_nr"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values(["jaar", "kwartaal_nr"])

write_json("verbouw_quarterly.json", [
    {"y": int(r["jaar"]), "q": int(r["kwartaal_nr"]), "p": int(r["aantal_projecten"]),
     "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
    for _, r in verbouw_quarterly.iterrows()
])

# Yearly totals
verbouw_yearly = df_verbouw.groupby(["jaar"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values("jaar")

write_json("verbouw_yearly.json", [
    {"y": int(r["jaar"]), "p": int(r["aantal_projecten"]), "g": int(r["aantal_gebouwen"]),
     "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
    for _, r in verbouw_yearly.iterrows()
])

# By type - yearly
verbouw_by_type = df_verbouw.groupby(["jaar", "functie_kort"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values(["jaar", "functie_kort"])

write_json("verbouw_by_type.json", [
    {"y": int(r["jaar"]), "t": r["functie_kort"], "p": int(r["aantal_projecten"]),
     "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
    for _, r in verbouw_by_type.iterrows()
])

# ============================================================================
# SECTION 3: SLOOP (Demolition)
# ============================================================================

df_sloop = df[df["handeling"] == "Sloop"].copy()

# Quarterly totals - for sloop we use gesloopt_m2 and gesloopt_m3
sloop_quarterly = df_sloop.groupby(["jaar", "kwartaal_nr"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "gesloopt_m2": "sum",
    "gesloopt_m3": "sum"
}).reset_index().sort_values(["jaar", "kwartaal_nr"])

write_json("sloop_quarterly.json", [
    {"y": int(r["jaar"]), "q": int(r["kwartaal_nr"]), "p": int(r["aantal_projecten"]),
     "g": int(r["aantal_gebouwen"]), "m2": round(r["gesloopt_m2"], 0), "m3": round(r["gesloopt_m3"], 0)}
    for _, r in sloop_quarterly.iterrows()
])

# Yearly totals
sloop_yearly = df_sloop.groupby(["jaar"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "gesloopt_m2": "sum",
    "gesloopt_m3": "sum"
}).reset_index().sort_values("jaar")

write_json("sloop_yearly.json", [
    {"y": int(r["jaar"]), "p": int(r["aantal_projecten"]), "g": int(r["aantal_gebouwen"]),
     "m2": round(r["gesloopt_m2"], 0), "m3": round(r["gesloopt_m3"], 0)}
    for _, r in sloop_yearly.iterrows()
])

# By besluit type (who decides: gemeente, provincie, etc)
sloop_by_besluit = df_sloop.groupby(["jaar", "besluit_type"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "gesloopt_m2": "sum",
    "gesloopt_m3": "sum"
}).reset_index().sort_values(["jaar", "besluit_type"])

write_json("sloop_by_besluit.json", [
    {"y": int(r["jaar"]), "b": r["besluit_type"], "p": int(r["aantal_projecten"]),
     "g": int(r["aantal_gebouwen"]), "m2": round(r["gesloopt_m2"], 0), "m3": round(r["gesloopt_m3"], 0)}
    for _, r in sloop_by_besluit.iterrows()
])

# ============================================================================
# SECTION 4: PROJECT AANVRAGER TYPE
# ============================================================================

df_aanvrager_woningen = df_aanvrager[df_aanvrager["gebouw_functie"].isin(woningen_functies)].copy()

aanvrager_yearly = df_aanvrager_woningen.groupby(["jaar", "handeling", "aanvrager_groep"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum",
    "gesloopt_m2": "sum",
    "gesloopt_m3": "sum",
}).reset_index().sort_values(["handeling", "jaar", "aanvrager_groep"])

write_json("aanvrager_yearly.json", [
    {
        "y": int(r["jaar"]),
        "h": simplify_handeling(r["handeling"]),
        "a": r["aanvrager_groep"],
        "p": int(r["aantal_projecten"]),
        "g": int(r["aantal_gebouwen"]),
        "w": int(r["aantal_wooneenheden"]),
        "m2": round(r["woonoppervlakte_m2"], 0),
        "dm2": round(r["gesloopt_m2"], 0),
        "m3": round(r["gesloopt_m3"], 0),
    }
    for _, r in aanvrager_yearly.iterrows()
])

# ============================================================================
# LOOKUPS for UI
# ============================================================================

lookups = {
    "types": [
        {"code": "eengezins", "nl": "Eengezinswoning"},
        {"code": "meergezins", "nl": "Meergezinswoning"},
        {"code": "kamer", "nl": "Kamerwoning"}
    ],
    "besluit_types": [
        {"code": "Gemeente", "nl": "Gemeente"},
        {"code": "Provincie", "nl": "Provincie"},
        {"code": "Vlaamse Overheid", "nl": "Vlaamse Overheid"},
        {"code": "RVVB", "nl": "RVVB"},
        {"code": "Onbekend", "nl": "Onbekend"}
    ],
    "handelingen": [
        {"code": "nieuwbouw", "nl": "Nieuwbouw"},
        {"code": "verbouw", "nl": "Verbouwen"},
        {"code": "sloop", "nl": "Sloop"}
    ],
    "aanvrager_types": [
        {"code": "natuurlijk_persoon", "nl": "Natuurlijk persoon"},
        {"code": "rechtspersoon", "nl": "Rechtspersoon"},
        {"code": "overheid", "nl": "Overheid"},
        {"code": "andere", "nl": "Andere / onbekend"}
    ]
}

write_json("lookups.json", lookups, ensure_ascii=False, indent=2)

# Print summary
print("Processing complete!")
print(f"Data range: {df['jaar'].min()} Q1 - {df['jaar'].max()} Q{df['kwartaal_nr'].max()}")
print(f"Total rows: {len(df)}")
print(f"Nieuwbouw rows: {len(df_nieuwbouw)}")
print(f"Verbouw rows: {len(df_verbouw)}")
print(f"Sloop rows: {len(df_sloop)}")
print(f"Output files saved to: {RESULTS_DIR}")
