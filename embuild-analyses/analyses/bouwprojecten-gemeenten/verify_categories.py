#!/usr/bin/env python3
"""Verify that category keywords are correctly applied to projects."""

import json
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))
from category_keywords import classify_project, get_category_label

# Load first chunk
data_dir = Path(__file__).parent.parent.parent / 'public' / 'data' / 'bouwprojecten-gemeenten'
chunk_file = data_dir / 'projects_2026_chunk_0.json'

with open(chunk_file, 'r', encoding='utf-8') as f:
    projects = json.load(f)

print("="*80)
print("CATEGORY VERIFICATION - Sample from chunk 0")
print("="*80)
print(f"Total projects in chunk: {len(projects)}")

# Check first 10 projects
matches = 0
mismatches = 0

for i, project in enumerate(projects[:10], 1):
    print(f"\n--- Project {i} ---")
    print(f"Municipality: {project['municipality']}")
    print(f"AC Code: {project['ac_code']}")
    print(f"AC Short: {project['ac_short'][:100]}")
    if project.get('ac_long'):
        print(f"AC Long: {project['ac_long'][:100]}")
    
    # Re-classify
    recalc_cats = classify_project(project['ac_short'], project.get('ac_long', ''))
    stored_cats = project['categories']
    
    print(f"Stored: {stored_cats}")
    print(f"Recalc: {recalc_cats}")
    
    if set(stored_cats) == set(recalc_cats):
        print("✓ Match")
        matches += 1
    else:
        print("⚠️  MISMATCH!")
        mismatches += 1

print("\n" + "="*80)
print(f"Summary: {matches} matches, {mismatches} mismatches")
print("="*80)

# Also check some specific keywords
print("\n" + "="*80)
print("KEYWORD SPOT CHECKS")
print("="*80)

test_cases = [
    ("Heraanleg Kerkstraat", "wegenbouw"),
    ("Renovatie sporthal", "sport"),
    ("Nieuwe riolering", "riolering"),
    ("Scholengroep uitbreiding", "scholenbouw"),
    ("Bibliotheek renovatie", "cultuur"),
    ("Park aanleg", "groen"),
]

for text, expected_cat in test_cases:
    cats = classify_project(text, "")
    found = expected_cat in cats
    status = "✓" if found else "⚠️"
    print(f"{status} '{text}' → {cats} (expected '{expected_cat}')")
