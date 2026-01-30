import pandas as pd
import json

# Load the Excel file
excel_file = "data/SILC_module2023_HEE_PUBLICATION_NL.xlsx"
sheets_to_process = [
    "Overzicht",
    "Verwarmingssysteem",
    "Belangrijkste energiebron",
    "Isolatie verbeterd",
]

results = {}

for sheet in sheets_to_process:
    df = pd.read_excel(excel_file, sheet_name=sheet, header=None)
    # For simplicity, assume the data starts after some rows
    # This needs manual inspection per sheet, but for now, export raw
    results[sheet] = df.to_dict(orient="records")

# Save to results
with open("results/processed_data.json", "w") as f:
    json.dump(results, f, indent=2)

print("Data processed.")
