#!/usr/bin/env python3
import pandas as pd
import json

# Load raw data
df = pd.read_csv("../data/epc_labelverdeling.csv", sep=";")

# Define residential and non-residential categories
residential = ["Appartement", "Collectief woongebouw", "Eengezinswoning"]
non_residential = ["Handelspand", "Horeca", "Kantoor", "Logement", "Andere"]

# Process data for residential A+A share
residential_data = df[df["Bestemming"].isin(residential)].copy()
residential_aa_by_year_building = []

for year in sorted(df["Jaar"].unique(), reverse=True):
    year_data = residential_data[residential_data["Jaar"] == year]
    for building_type in residential:
        building_data = year_data[year_data["Bestemming"] == building_type]
        if len(building_data) > 0:
            aa_count = building_data[building_data["Energielabel"].isin(["A+", "A"])]["Aantal"].sum()
            total_count = building_data["Aantal"].sum()
            share = (aa_count / total_count * 100) if total_count > 0 else 0
            residential_aa_by_year_building.append({
                "year": int(year),
                "building_type": building_type,
                "share": round(float(share), 2),
                "label_a_plus_a": int(aa_count),
                "total": int(total_count)
            })

# Process data for residential E+F share (not meeting D)
residential_ef_by_year_building = []

for year in sorted(df["Jaar"].unique(), reverse=True):
    year_data = residential_data[residential_data["Jaar"] == year]
    for building_type in residential:
        building_data = year_data[year_data["Bestemming"] == building_type]
        if len(building_data) > 0:
            ef_count = building_data[building_data["Energielabel"].isin(["E", "F"])]["Aantal"].sum()
            total_count = building_data["Aantal"].sum()
            share = (ef_count / total_count * 100) if total_count > 0 else 0
            residential_ef_by_year_building.append({
                "year": int(year),
                "building_type": building_type,
                "share": round(float(share), 2),
                "label_e_f": int(ef_count),
                "total": int(total_count)
            })

# Process data for non-residential A+A share
non_residential_data = df[df["Bestemming"].isin(non_residential)].copy()
non_residential_aa_by_year_building = []

for year in sorted(df["Jaar"].unique(), reverse=True):
    year_data = non_residential_data[non_residential_data["Jaar"] == year]
    for building_type in non_residential:
        building_data = year_data[year_data["Bestemming"] == building_type]
        if len(building_data) > 0:
            aa_count = building_data[building_data["Energielabel"].isin(["A+", "A"])]["Aantal"].sum()
            total_count = building_data["Aantal"].sum()
            share = (aa_count / total_count * 100) if total_count > 0 else 0
            non_residential_aa_by_year_building.append({
                "year": int(year),
                "building_type": building_type,
                "share": round(float(share), 2),
                "label_a_plus_a": int(aa_count),
                "total": int(total_count)
            })

# Process data for non-residential E+F share (not meeting D)
non_residential_ef_by_year_building = []

for year in sorted(df["Jaar"].unique(), reverse=True):
    year_data = non_residential_data[non_residential_data["Jaar"] == year]
    for building_type in non_residential:
        building_data = year_data[year_data["Bestemming"] == building_type]
        if len(building_data) > 0:
            ef_count = building_data[building_data["Energielabel"].isin(["E", "F"])]["Aantal"].sum()
            total_count = building_data["Aantal"].sum()
            share = (ef_count / total_count * 100) if total_count > 0 else 0
            non_residential_ef_by_year_building.append({
                "year": int(year),
                "building_type": building_type,
                "share": round(float(share), 2),
                "label_e_f": int(ef_count),
                "total": int(total_count)
            })

# Export to JSON
with open("../results/residential_aa_share.json", "w") as f:
    json.dump(residential_aa_by_year_building, f, indent=2)

with open("../results/residential_ef_share.json", "w") as f:
    json.dump(residential_ef_by_year_building, f, indent=2)

with open("../results/non_residential_aa_share.json", "w") as f:
    json.dump(non_residential_aa_by_year_building, f, indent=2)

with open("../results/non_residential_ef_share.json", "w") as f:
    json.dump(non_residential_ef_by_year_building, f, indent=2)

print("Data processing complete!")
print(f"Processed {len(df)} rows")
