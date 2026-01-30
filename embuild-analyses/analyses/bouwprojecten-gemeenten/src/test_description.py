#!/usr/bin/env python3
"""Test script to generate category description."""

import pandas as pd
from pathlib import Path
from category_keywords import generate_category_description

# Load projects
parquet_file = Path(__file__).parent.parent / 'results' / 'projects_2026_full.parquet'
df = pd.read_parquet(parquet_file)
projects = df.to_dict(orient='records')

# Generate and print description
description = generate_category_description(projects)
print(description)
