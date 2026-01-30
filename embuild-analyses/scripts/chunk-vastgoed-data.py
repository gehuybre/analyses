#!/usr/bin/env python3
"""
Chunk vastgoed-verkopen quarterly.json into smaller files for lazy-loading.

This script splits the 17 MB quarterly.json file into ~3 MB chunks to prevent
Out of Memory errors during Next.js build and improve runtime loading performance.
"""

import json
import os
import math
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
EMBUILD_DIR = SCRIPT_DIR.parent
RESULTS_DIR = EMBUILD_DIR / "analyses" / "vastgoed-verkopen" / "results"
PUBLIC_DATA_DIR = EMBUILD_DIR / "public" / "data" / "vastgoed-verkopen"

# Target chunk size (~3 MB per chunk)
TARGET_CHUNK_SIZE_MB = 3
BYTES_PER_MB = 1024 * 1024

def estimate_json_size(data):
    """Estimate JSON size in bytes without serializing."""
    return len(json.dumps(data, separators=(',', ':')))

def chunk_quarterly_data():
    """Split quarterly.json into chunks."""
    print("Loading quarterly.json...")
    quarterly_path = RESULTS_DIR / "quarterly.json"

    if not quarterly_path.exists():
        print(f"Error: {quarterly_path} not found")
        return

    with open(quarterly_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} quarterly records")
    print(f"Total size: {estimate_json_size(data) / BYTES_PER_MB:.2f} MB")

    # Calculate optimal chunk size
    total_records = len(data)
    avg_record_size = estimate_json_size(data) / total_records
    records_per_chunk = int((TARGET_CHUNK_SIZE_MB * BYTES_PER_MB) / avg_record_size)
    num_chunks = math.ceil(total_records / records_per_chunk)

    print(f"Creating {num_chunks} chunks with ~{records_per_chunk} records each")

    # Create public data directory
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Split data into chunks
    chunks_metadata = []
    for i in range(num_chunks):
        start_idx = i * records_per_chunk
        end_idx = min((i + 1) * records_per_chunk, total_records)
        chunk_data = data[start_idx:end_idx]

        chunk_filename = f"quarterly_chunk_{i}.json"
        chunk_path = PUBLIC_DATA_DIR / chunk_filename

        with open(chunk_path, 'w', encoding='utf-8') as f:
            json.dump(chunk_data, f, separators=(',', ':'))

        chunk_size = chunk_path.stat().st_size
        chunks_metadata.append({
            "index": i,
            "filename": chunk_filename,
            "records": len(chunk_data),
            "size_mb": chunk_size / BYTES_PER_MB
        })

        print(f"  Created {chunk_filename}: {len(chunk_data)} records, {chunk_size / BYTES_PER_MB:.2f} MB")

    # Create metadata file
    metadata = {
        "quarterly_chunks": num_chunks,
        "total_records": total_records,
        "records_per_chunk": records_per_chunk,
        "chunks": chunks_metadata
    }

    metadata_path = PUBLIC_DATA_DIR / "metadata.json"
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    print(f"\nCreated metadata.json with {num_chunks} chunk entries")
    print(f"Total chunked size: {sum(c['size_mb'] for c in chunks_metadata):.2f} MB")

def copy_other_files():
    """Copy yearly, municipalities, and lookups to public/data."""
    print("\nCopying other data files...")

    files_to_copy = [
        "yearly.json",
        "municipalities.json",
        "lookups.json"
    ]

    for filename in files_to_copy:
        src = RESULTS_DIR / filename
        dst = PUBLIC_DATA_DIR / filename

        if src.exists():
            with open(src, 'r', encoding='utf-8') as f_in:
                data = json.load(f_in)

            with open(dst, 'w', encoding='utf-8') as f_out:
                json.dump(data, f_out, separators=(',', ':'))

            size_mb = dst.stat().st_size / BYTES_PER_MB
            print(f"  Copied {filename}: {size_mb:.2f} MB")
        else:
            print(f"  Warning: {filename} not found in results directory")

if __name__ == "__main__":
    print("=" * 60)
    print("Chunking vastgoed-verkopen data for lazy-loading")
    print("=" * 60)

    chunk_quarterly_data()
    copy_other_files()

    print("\n" + "=" * 60)
    print("Chunking complete!")
    print(f"Output directory: {PUBLIC_DATA_DIR}")
    print("=" * 60)
