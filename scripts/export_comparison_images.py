#!/usr/bin/env python3
"""
Export matched optical + AlphaEarth imagery for comparison slider.
Exports 6 preset locations at 1200px width, optimized for web.
"""

import ee
import json
import requests
import os
from PIL import Image
from io import BytesIO

# Initialize Earth Engine
SA_PATH = '/Users/hutchbot/.config/gee/service-account.json'
with open(SA_PATH) as f:
    creds = json.load(f)
credentials = ee.ServiceAccountCredentials(creds['client_email'], SA_PATH)
ee.Initialize(credentials, project=creds['project_id'])

# Output directory
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'imagery')

# Locations: [id, name, bounds (W, S, E, N)]
LOCATIONS = [
    ('chesapeake', 'Chesapeake Bay', [-79.5, 37.0, -75.0, 40.5]),
    ('california', 'Central Valley', [-122.5, 36.0, -118.5, 39.0]),
    ('florida', 'Florida Everglades', [-81.5, 25.0, -80.0, 27.0]),
    ('midwest', 'Iowa Farmland', [-96.0, 41.0, -92.0, 43.5]),
    ('southwest', 'Phoenix Metro', [-113.0, 32.5, -111.0, 34.5]),
    ('pacific', 'Puget Sound', [-123.5, 47.0, -121.5, 49.0]),
]

# Image dimensions (width x height based on aspect ratio)
WIDTH = 1200


def get_thumbnail_url(image, bounds, bands, min_val, max_val, width=1200):
    """Get a thumbnail URL for the given image and bounds."""
    region = ee.Geometry.Rectangle(bounds)
    
    # Calculate height from aspect ratio
    w = bounds[2] - bounds[0]
    h = bounds[3] - bounds[1]
    height = int(width * (h / w))
    
    vis_params = {
        'bands': bands,
        'min': min_val,
        'max': max_val,
        'dimensions': f'{width}x{height}',
        'region': region,
        'format': 'jpg',
    }
    
    return image.getThumbURL(vis_params)


def download_image(url, output_path, max_size_kb=500):
    """Download image from URL and save, optionally reducing quality for size."""
    print(f"  Downloading from GEE...")
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    
    img = Image.open(BytesIO(response.content))
    
    # Save with quality optimization
    quality = 85
    while True:
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        size_kb = buffer.tell() / 1024
        
        if size_kb <= max_size_kb or quality <= 30:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
            print(f"  Saved: {output_path} ({size_kb:.1f} KB, quality={quality})")
            return
        
        quality -= 10


def export_location(loc_id, loc_name, bounds, year=2023):
    """Export optical and AlphaEarth images for a location."""
    print(f"\n{'='*50}")
    print(f"Exporting: {loc_name} ({loc_id})")
    print(f"Bounds: {bounds}")
    
    region = ee.Geometry.Rectangle(bounds)
    
    # ===== AlphaEarth Embeddings =====
    print(f"\n1. AlphaEarth Embeddings...")
    try:
        ae = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL') \
            .filter(ee.Filter.eq('year', year)) \
            .first()
        
        # Use bands A01, A16, A09 for RGB (good general-purpose visualization)
        ae_url = get_thumbnail_url(
            ae, bounds, 
            bands=['A01', 'A16', 'A09'],
            min_val=-0.2, max_val=0.2,
            width=WIDTH
        )
        download_image(ae_url, os.path.join(OUT_DIR, f'alphaearth-{loc_id}.jpg'))
    except Exception as e:
        print(f"  ERROR: {e}")
    
    # ===== Optical Imagery (Sentinel-2) =====
    print(f"\n2. Optical Imagery (Sentinel-2)...")
    try:
        s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(region) \
            .filterDate(f'{year}-06-01', f'{year}-09-30') \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
            .median()
        
        optical_url = get_thumbnail_url(
            s2, bounds,
            bands=['B4', 'B3', 'B2'],  # RGB
            min_val=0, max_val=3000,
            width=WIDTH
        )
        download_image(optical_url, os.path.join(OUT_DIR, f'optical-{loc_id}.jpg'))
    except Exception as e:
        print(f"  ERROR with Sentinel-2: {e}")
        # Fallback to NAIP if available (US only)
        try:
            print("  Trying NAIP fallback...")
            naip = ee.ImageCollection('USDA/NAIP/DOQQ') \
                .filterBounds(region) \
                .filterDate('2020-01-01', '2023-12-31') \
                .sort('system:time_start', False) \
                .first()
            
            optical_url = get_thumbnail_url(
                naip, bounds,
                bands=['R', 'G', 'B'],
                min_val=0, max_val=255,
                width=WIDTH
            )
            download_image(optical_url, os.path.join(OUT_DIR, f'optical-{loc_id}.jpg'))
        except Exception as e2:
            print(f"  ERROR with NAIP: {e2}")


def main():
    print("=" * 60)
    print("GEE Image Export for Comparison Slider")
    print("=" * 60)
    
    os.makedirs(OUT_DIR, exist_ok=True)
    
    for loc_id, loc_name, bounds in LOCATIONS:
        export_location(loc_id, loc_name, bounds)
    
    print("\n" + "=" * 60)
    print("Export complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
