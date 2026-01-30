# Shared Data

This directory contains data shared across multiple analyses.

## Structure

- `geo/`: Maps and geographical data (e.g., shapefiles, GeoJSONs not served directly by public).
- `nace/`: NACE codes and classifications.
- `nis/`: Belgian NIS codes and municipality data.

## Usage

Data processing scripts in `analyses/<slug>/src/` can reference this data using relative paths.
Example: `../../../shared-data/nace/nace_codes.csv`
