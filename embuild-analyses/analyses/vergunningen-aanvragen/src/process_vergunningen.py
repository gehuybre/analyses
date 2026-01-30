"""
Process building permit application data from Omgevingsloket Vlaanderen.

Data source: https://omgevingsloketrapportering.omgeving.vlaanderen.be/wonen

Output structure:
- nieuwbouw_*.json - New construction data
- verbouw_*.json - Renovation data
- sloop_*.json - Demolition data
"""

import pandas as pd
import json
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent.parent / "data"
RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# Read CSV
df = pd.read_csv(
    DATA_DIR / "bouwen_of_verbouwen_van_woningen.csv",
    encoding="utf-8",
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

with open(RESULTS_DIR / "nieuwbouw_quarterly.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "q": int(r["kwartaal_nr"]), "p": int(r["aantal_projecten"]),
         "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
        for _, r in nieuwbouw_quarterly.iterrows()
    ], f)

# Yearly totals
nieuwbouw_yearly = df_nieuwbouw.groupby(["jaar"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values("jaar")

with open(RESULTS_DIR / "nieuwbouw_yearly.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "p": int(r["aantal_projecten"]), "g": int(r["aantal_gebouwen"]),
         "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
        for _, r in nieuwbouw_yearly.iterrows()
    ], f)

# By type - yearly
nieuwbouw_by_type = df_nieuwbouw.groupby(["jaar", "functie_kort"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values(["jaar", "functie_kort"])

with open(RESULTS_DIR / "nieuwbouw_by_type.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "t": r["functie_kort"], "p": int(r["aantal_projecten"]),
         "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
        for _, r in nieuwbouw_by_type.iterrows()
    ], f)

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

with open(RESULTS_DIR / "verbouw_quarterly.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "q": int(r["kwartaal_nr"]), "p": int(r["aantal_projecten"]),
         "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
        for _, r in verbouw_quarterly.iterrows()
    ], f)

# Yearly totals
verbouw_yearly = df_verbouw.groupby(["jaar"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values("jaar")

with open(RESULTS_DIR / "verbouw_yearly.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "p": int(r["aantal_projecten"]), "g": int(r["aantal_gebouwen"]),
         "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
        for _, r in verbouw_yearly.iterrows()
    ], f)

# By type - yearly
verbouw_by_type = df_verbouw.groupby(["jaar", "functie_kort"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index().sort_values(["jaar", "functie_kort"])

with open(RESULTS_DIR / "verbouw_by_type.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "t": r["functie_kort"], "p": int(r["aantal_projecten"]),
         "g": int(r["aantal_gebouwen"]), "w": int(r["aantal_wooneenheden"]), "m2": round(r["woonoppervlakte_m2"], 0)}
        for _, r in verbouw_by_type.iterrows()
    ], f)

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

with open(RESULTS_DIR / "sloop_quarterly.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "q": int(r["kwartaal_nr"]), "p": int(r["aantal_projecten"]),
         "g": int(r["aantal_gebouwen"]), "m2": round(r["gesloopt_m2"], 0), "m3": round(r["gesloopt_m3"], 0)}
        for _, r in sloop_quarterly.iterrows()
    ], f)

# Yearly totals
sloop_yearly = df_sloop.groupby(["jaar"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "gesloopt_m2": "sum",
    "gesloopt_m3": "sum"
}).reset_index().sort_values("jaar")

with open(RESULTS_DIR / "sloop_yearly.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "p": int(r["aantal_projecten"]), "g": int(r["aantal_gebouwen"]),
         "m2": round(r["gesloopt_m2"], 0), "m3": round(r["gesloopt_m3"], 0)}
        for _, r in sloop_yearly.iterrows()
    ], f)

# By besluit type (who decides: gemeente, provincie, etc)
sloop_by_besluit = df_sloop.groupby(["jaar", "besluit_type"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "gesloopt_m2": "sum",
    "gesloopt_m3": "sum"
}).reset_index().sort_values(["jaar", "besluit_type"])

with open(RESULTS_DIR / "sloop_by_besluit.json", "w") as f:
    json.dump([
        {"y": int(r["jaar"]), "b": r["besluit_type"], "p": int(r["aantal_projecten"]),
         "g": int(r["aantal_gebouwen"]), "m2": round(r["gesloopt_m2"], 0), "m3": round(r["gesloopt_m3"], 0)}
        for _, r in sloop_by_besluit.iterrows()
    ], f)

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
    ]
}

with open(RESULTS_DIR / "lookups.json", "w") as f:
    json.dump(lookups, f, ensure_ascii=False, indent=2)

# Print summary
print("Processing complete!")
print(f"Data range: {df['jaar'].min()} Q1 - {df['jaar'].max()} Q{df['kwartaal_nr'].max()}")
print(f"Total rows: {len(df)}")
print(f"Nieuwbouw rows: {len(df_nieuwbouw)}")
print(f"Verbouw rows: {len(df_verbouw)}")
print(f"Sloop rows: {len(df_sloop)}")
print(f"Output files saved to: {RESULTS_DIR}")
