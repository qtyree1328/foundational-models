#!/usr/bin/env python3
"""Download GEE imagery for AlphaEarth comparison views."""

import ee
import requests
import os
import sys
from pathlib import Path

# Flush output immediately
sys.stdout.reconfigure(line_buffering=True)

# Config
OUTPUT_DIR = Path.home() / "clawd/projects/foundational-models/public/imagery"
SERVICE_ACCOUNT_KEY = Path.home() / ".config/gee/service-account.json"

LOCATIONS = [
    {"id": "california", "name": "Central Valley", "bounds": [-122.5, 36.0, -118.5, 39.0]},
    {"id": "florida", "name": "Everglades", "bounds": [-81.5, 25.0, -80.0, 27.0]},
    {"id": "midwest", "name": "Iowa", "bounds": [-96.0, 41.0, -92.0, 43.5]},
    {"id": "southwest", "name": "Phoenix", "bounds": [-113.0, 32.5, -111.0, 34.5]},
    {"id": "pacific", "name": "Puget Sound", "bounds": [-123.5, 47.0, -121.5, 49.0]},
]

def init_gee():
    """Initialize GEE with service account."""
    print("Initializing GEE...")
    credentials = ee.ServiceAccountCredentials(
        email=None,  # Will be read from the JSON
        key_file=str(SERVICE_ACCOUNT_KEY)
    )
    ee.Initialize(credentials)
    print("GEE initialized successfully!")

def get_alphaearth_image(bounds):
    """Get AlphaEarth embeddings visualization."""
    region = ee.Geometry.Rectangle(bounds)
    
    # AlphaEarth embeddings - annual 2023
    embeddings = ee.ImageCollection("GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL") \
        .filterDate('2023-01-01', '2023-12-31') \
        .first()
    
    # Use bands A01, A16, A09 for RGB visualization
    vis = embeddings.select(['A01', 'A16', 'A09'])
    
    # Get thumbnail URL
    url = vis.getThumbURL({
        'region': region,
        'dimensions': '1000x750',
        'format': 'jpg',
        'min': -0.2,
        'max': 0.2,
    })
    return url

def get_optical_image(bounds):
    """Get Sentinel-2 optical imagery for summer 2023."""
    region = ee.Geometry.Rectangle(bounds)
    
    # Sentinel-2 Surface Reflectance, summer 2023
    s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
        .filterBounds(region) \
        .filterDate('2023-06-01', '2023-09-30') \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
        .median()
    
    # True color RGB
    vis = s2.select(['B4', 'B3', 'B2'])
    
    url = vis.getThumbURL({
        'region': region,
        'dimensions': '1000x750',
        'format': 'jpg',
        'min': 0,
        'max': 3000,
    })
    return url

def download_image(url, output_path, max_size_kb=500):
    """Download image from URL, retry with lower quality if too large."""
    print(f"  Downloading from: {url[:80]}...")
    
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    
    # Check size
    size_kb = len(response.content) / 1024
    print(f"  Downloaded: {size_kb:.1f} KB")
    
    # Save
    with open(output_path, 'wb') as f:
        f.write(response.content)
    
    print(f"  Saved to: {output_path}")
    return True

def main():
    print("=" * 60)
    print("GEE Imagery Download for Foundational Models")
    print("=" * 60)
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    init_gee()
    
    successful = []
    failed = []
    
    for loc in LOCATIONS:
        loc_id = loc["id"]
        name = loc["name"]
        bounds = loc["bounds"]
        
        print(f"\n{'='*60}")
        print(f"Processing: {name} ({loc_id})")
        print(f"Bounds: {bounds}")
        print("=" * 60)
        
        alphaearth_path = OUTPUT_DIR / f"alphaearth-{loc_id}.jpg"
        optical_path = OUTPUT_DIR / f"optical-{loc_id}.jpg"
        
        try:
            # AlphaEarth embeddings
            print("\n[1/2] Getting AlphaEarth embeddings URL...")
            alpha_url = get_alphaearth_image(bounds)
            download_image(alpha_url, alphaearth_path)
            
            # Optical imagery
            print("\n[2/2] Getting optical imagery URL...")
            optical_url = get_optical_image(bounds)
            download_image(optical_url, optical_path)
            
            successful.append(loc_id)
            print(f"\n✓ {name} completed successfully!")
            
        except Exception as e:
            print(f"\n✗ Error processing {name}: {e}")
            failed.append(loc_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print("=" * 60)
    print(f"Successful: {len(successful)} - {successful}")
    print(f"Failed: {len(failed)} - {failed}")
    
    # List files
    print("\nFiles in imagery folder:")
    for f in sorted(OUTPUT_DIR.glob("*.jpg")):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name}: {size_kb:.1f} KB")
    
    return successful

if __name__ == "__main__":
    successful = main()
    # Exit with count of successful downloads
    sys.exit(0 if len(successful) == 5 else 1)
