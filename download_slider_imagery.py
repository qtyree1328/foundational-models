#!/usr/bin/env python3
"""
Download AlphaEarth embedding images for the slider comparison.
Each location gets an optical image + AlphaEarth RGB visualization.
"""

import ee
import json
import requests
import os

# Initialize Earth Engine
SA_PATH = '/Users/hutchbot/.config/gee/service-account.json'
with open(SA_PATH) as f:
    creds_data = json.load(f)

credentials = ee.ServiceAccountCredentials(creds_data['client_email'], SA_PATH)
ee.Initialize(credentials, project=creds_data['project_id'])

# Output directory
OUT_DIR = '/Users/hutchbot/clawd/projects/foundational-models/public/imagery'
os.makedirs(OUT_DIR, exist_ok=True)

# Location bounds [west, south, east, north]
LOCATIONS = {
    'california': {
        'name': 'Central Valley',
        'bounds': [-120.5, 36.5, -119.5, 37.5],  # Near Fresno
    },
    'florida': {
        'name': 'Florida Everglades', 
        'bounds': [-81.0, 25.5, -80.0, 26.5],  # Everglades
    },
    'midwest': {
        'name': 'Iowa Farmland',
        'bounds': [-94.0, 41.5, -93.0, 42.5],  # Central Iowa
    },
    'southwest': {
        'name': 'Phoenix Metro',
        'bounds': [-112.5, 33.0, -111.5, 34.0],  # Phoenix area
    },
    'pacific': {
        'name': 'Puget Sound',
        'bounds': [-123.0, 47.0, -122.0, 48.0],  # Seattle area
    },
}

def get_optical_image(bounds, year=2023):
    """Get Sentinel-2 true color composite."""
    region = ee.Geometry.Rectangle(bounds)
    
    s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
        .filterBounds(region) \
        .filterDate(f'{year}-06-01', f'{year}-09-30') \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
        .median()
    
    rgb = s2.select(['B4', 'B3', 'B2']).visualize(min=0, max=3000)
    return rgb, region

def get_alphaearth_image(bounds, year=2023):
    """Get AlphaEarth embedding RGB visualization."""
    region = ee.Geometry.Rectangle(bounds)
    
    emb = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL') \
        .filterDate(f'{year}-01-01', f'{year+1}-01-01') \
        .mosaic()
    
    # Use bands A01, A16, A09 for RGB (good default)
    rgb = emb.select(['A01', 'A16', 'A09']).visualize(min=-0.3, max=0.3)
    return rgb, region

def download_image(image, region, filepath, dimensions=800):
    """Download image as JPEG."""
    url = image.getThumbURL({
        'region': region,
        'dimensions': dimensions,
        'format': 'jpg'
    })
    
    print(f'  Downloading: {filepath}', flush=True)
    response = requests.get(url)
    if response.status_code == 200:
        with open(filepath, 'wb') as f:
            f.write(response.content)
        print(f'  ✓ Saved ({len(response.content)} bytes)', flush=True)
        return True
    else:
        print(f'  ✗ Failed: {response.status_code}', flush=True)
        return False

def main():
    import sys
    print('🛰️  Downloading slider imagery from Google Earth Engine\n', flush=True)
    
    for loc_id, loc_data in LOCATIONS.items():
        print(f'\n📍 {loc_data["name"]} ({loc_id})', flush=True)
        bounds = loc_data['bounds']
        
        # Download optical
        try:
            optical, region = get_optical_image(bounds)
            optical_path = os.path.join(OUT_DIR, f'optical-{loc_id}.jpg')
            download_image(optical, region, optical_path)
        except Exception as e:
            print(f'  ✗ Optical failed: {e}')
        
        # Download AlphaEarth
        try:
            alpha, region = get_alphaearth_image(bounds)
            alpha_path = os.path.join(OUT_DIR, f'alphaearth-{loc_id}.jpg')
            download_image(alpha, region, alpha_path)
        except Exception as e:
            print(f'  ✗ AlphaEarth failed: {e}')
    
    print('\n✅ Done!')

if __name__ == '__main__':
    main()
