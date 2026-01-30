---
kind: file
path: embuild-analyses/shared-data/README.md
role: documentation
workflows: []
inputs: []
outputs: []
last_reviewed: 2025-12-14
---

# Shared Data Documentation

## Purpose
This file documents the structure and usage of the `embuild-analyses/shared-data/` directory, which serves as a central repository for common data assets used across multiple analyses.

## Context
The `shared-data` directory prevents duplication of common datasets like geographical maps, NACE codes, and NIS codes.

## Data Shape
The directory is organized into subfolders:
- `geo/`: Geographical data.
- `nace/`: NACE classification codes.
- `nis/`: NIS municipality codes.

## Lifecycle
This file is static documentation. The data within the folders it describes is updated as needed when new common data is acquired.
