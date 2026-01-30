---
kind: file
path: embuild-analyses/shared-data/nis/TU_COM_REFNIS.txt
role: data
workflows: []
inputs: []
outputs: []
last_reviewed: 2025-12-14
---

# REFNIS Municipality Codes

## Purpose
Contains the official NIS codes (Refnis) for Belgian administrative units (municipalities, provinces, regions).

## Context
Used to link data from Statbel and other sources that use NIS codes to municipality names and hierarchies.

## Data Shape
**Format**: Pipe-separated values (`|`)
**Columns**:
- `LVL_REFNIS`: Hierarchy level
- `CD_REFNIS`: The NIS code
- `CD_SUP_REFNIS`: Parent NIS code
- `TX_REFNIS_NL`, `TX_REFNIS_FR`: Names in NL/FR
- `DT_VLDT_START`, `DT_VLDT_END`: Validity dates

## Lifecycle
Static reference data.

## TODO
- Consider converting to standard CSV for consistency.
