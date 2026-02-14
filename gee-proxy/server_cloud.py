"""
GEE Tile Proxy Server for Foundational Models Dashboard
Cloud Run version — reads credentials from env var or Secret Manager.
"""

import ee
import json
import os
import time
import traceback
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS

# ========== Initialize Earth Engine ==========
# Cloud Run: credentials from GOOGLE_APPLICATION_CREDENTIALS env var
# or from GEE_SERVICE_ACCOUNT_KEY env var (JSON string)
sa_key_b64 = os.environ.get('GEE_SERVICE_ACCOUNT_KEY_B64')
sa_key_json = os.environ.get('GEE_SERVICE_ACCOUNT_KEY')
sa_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')

if sa_key_b64:
    import base64
    sa_key_json = base64.b64decode(sa_key_b64).decode('utf-8')

if sa_key_json:
    # Write to temp file for ee library
    creds_data = json.loads(sa_key_json)
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    tmp.write(sa_key_json)
    tmp.close()
    sa_path = tmp.name
elif sa_path:
    with open(sa_path) as f:
        creds_data = json.load(f)
else:
    # Fallback: local dev path
    sa_path = os.path.expanduser('~/.config/gee/service-account.json')
    with open(sa_path) as f:
        creds_data = json.load(f)

credentials = ee.ServiceAccountCredentials(
    creds_data['client_email'],
    sa_path
)
ee.Initialize(credentials, project=creds_data['project_id'])

# ========== Flask App ==========
app = Flask(__name__)

# Allow all origins in Cloud Run (frontend is on a different domain)
allowed_origins = os.environ.get('CORS_ORIGINS', '*')
if allowed_origins == '*':
    CORS(app)
else:
    CORS(app, origins=allowed_origins.split(','))

# ========== Tile URL Cache ==========
_tile_cache = {}
CACHE_TTL = 90 * 60


def _cache_key(*args):
    return str(args)


def _get_cached(key):
    if key in _tile_cache:
        url, ts = _tile_cache[key]
        if time.time() - ts < CACHE_TTL:
            return url
        del _tile_cache[key]
    return None


def _set_cached(key, url):
    _tile_cache[key] = (url, time.time())
    now = time.time()
    expired = [k for k, (_, ts) in _tile_cache.items() if now - ts > CACHE_TTL]
    for k in expired:
        del _tile_cache[k]


# ========== Helper: Get Embedding Mosaic ==========
def get_embedding_mosaic(year):
    start = f'{year}-01-01'
    end = f'{int(year) + 1}-01-01'
    collection = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL') \
        .filter(ee.Filter.date(start, end))
    return collection.mosaic()


def get_tile_url(image):
    map_id = image.getMapId()
    return map_id['tile_fetcher'].url_format


# ========== Health Check ==========
@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'gee-proxy'})


# ========== Endpoint: Embedding RGB Tiles ==========
@app.route('/api/tiles/embeddings')
def tiles_embeddings():
    try:
        year = request.args.get('year', '2023')
        bands = request.args.get('bands', 'A01,A16,A09').split(',')
        vmin = float(request.args.get('min', '-0.3'))
        vmax = float(request.args.get('max', '0.3'))

        if len(bands) != 3:
            return jsonify({'error': 'Exactly 3 bands required for RGB'}), 400

        cache_key = _cache_key('embeddings', year, tuple(bands), vmin, vmax)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        mosaic = get_embedding_mosaic(year)
        vis = mosaic.select(bands).visualize(min=vmin, max=vmax)
        tile_url = get_tile_url(vis)

        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Optical Tiles (Sentinel-2) ==========
@app.route('/api/tiles/optical')
def tiles_optical():
    """
    GET /api/tiles/optical?year=2023&bbox=-94,41,-93,42
    Returns XYZ tile URL for Sentinel-2 true color visualization.
    """
    try:
        year = request.args.get('year', '2023')
        bbox = request.args.get('bbox', '')
        
        cache_key = _cache_key('optical', year, bbox)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        # Get Sentinel-2 Surface Reflectance
        start = f'{year}-01-01'
        end = f'{int(year) + 1}-01-01'
        
        s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterDate(start, end) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
            .median()
        
        # True color RGB
        vis = s2.select(['B4', 'B3', 'B2']).visualize(min=0, max=3000)
        tile_url = get_tile_url(vis)

        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: List Images (for timelapse preview) ==========
@app.route('/api/images/list')
def list_images():
    """
    GET /api/images/list - List images matching filters with metadata
    
    Required params:
      - dataset: GEE collection ID
      - bbox: bounds (west,south,east,north)
      - startDate: start date (YYYY-MM-DD)
      - endDate: end date (YYYY-MM-DD)
      
    Optional params:
      - maxCloud: max cloud percentage (default 20)
      - minAreaCoverage: minimum area coverage percentage (default 95)
      - limit: max images to return (default 100)
    
    Returns list of qualifying images with:
      - date, cloudCover, areaCoverage, thumbnailUrl
    """
    try:
        dataset = request.args.get('dataset', 'COPERNICUS/S2_SR_HARMONIZED')
        bbox = request.args.get('bbox', '')
        start_date = request.args.get('startDate', '2023-01-01')
        end_date = request.args.get('endDate', '2024-01-01')
        max_cloud = float(request.args.get('maxCloud', 20))
        min_area_coverage = float(request.args.get('minAreaCoverage', 95))
        limit = int(request.args.get('limit', 100))
        
        if not bbox:
            return jsonify({'error': 'bbox parameter required'}), 400
        
        coords = [float(x) for x in bbox.split(',')]
        bounds = ee.Geometry.Rectangle(coords)
        bounds_area = bounds.area().getInfo()
        
        # Get collection
        collection = ee.ImageCollection(dataset) \
            .filterDate(start_date, end_date) \
            .filterBounds(bounds)
        
        # Apply cloud filter for known collections
        cloud_property = None
        if 'S2' in dataset or 'COPERNICUS' in dataset:
            cloud_property = 'CLOUDY_PIXEL_PERCENTAGE'
            collection = collection.filter(ee.Filter.lte(cloud_property, max_cloud))
        elif 'LANDSAT' in dataset:
            cloud_property = 'CLOUD_COVER'
            collection = collection.filter(ee.Filter.lte(cloud_property, max_cloud))
        
        # Get image list with metadata
        def get_image_info(image):
            # Get date
            date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd')
            
            # Get cloud cover
            cloud = image.get(cloud_property) if cloud_property else 0
            
            # Calculate area coverage (intersection with bounds)
            footprint = image.geometry()
            intersection = footprint.intersection(bounds, ee.ErrorMargin(100))
            coverage = intersection.area().divide(bounds_area).multiply(100)
            
            return ee.Feature(None, {
                'id': image.get('system:index'),
                'date': date,
                'cloudCover': cloud,
                'areaCoverage': coverage,
                'system_id': image.get('system:id')
            })
        
        # Map and filter by area coverage
        image_list = collection.map(get_image_info)
        
        # Filter by minimum area coverage
        image_list = image_list.filter(ee.Filter.gte('areaCoverage', min_area_coverage))
        
        # Sort by date and limit
        image_list = image_list.sort('date').limit(limit)
        
        # Get info
        features = image_list.getInfo()['features']
        
        images = []
        for f in features:
            props = f['properties']
            images.append({
                'id': props.get('id'),
                'date': props.get('date'),
                'cloudCover': round(props.get('cloudCover', 0), 1),
                'areaCoverage': round(props.get('areaCoverage', 0), 1),
            })
        
        return jsonify({
            'dataset': dataset,
            'bbox': bbox,
            'dateRange': [start_date, end_date],
            'filters': {
                'maxCloud': max_cloud,
                'minAreaCoverage': min_area_coverage
            },
            'count': len(images),
            'images': images
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Multi-Tile Coverage Analysis ==========
@app.route('/api/images/coverage')
def images_coverage():
    """
    GET /api/images/coverage - Find dates with complete multi-tile coverage
    
    For AOIs spanning multiple S2 tiles, this endpoint:
    1. Identifies which MGRS tiles are needed for full coverage
    2. Groups images by date (12-hour window)
    3. Returns only dates where ALL required tiles have qualifying imagery
    
    Required params:
      - dataset: GEE collection ID (must be S2 for now)
      - bbox: bounds (west,south,east,north)
      - startDate: start date (YYYY-MM-DD)
      - endDate: end date (YYYY-MM-DD)
      
    Optional params:
      - maxCloud: max cloud percentage per tile (default 30)
      - limit: max dates to return (default 50)
    
    Returns:
      - requiredTiles: list of MGRS tile IDs needed
      - dates: list of {date, tiles: [{tileId, imageId, cloudCover}]}
    """
    try:
        dataset = request.args.get('dataset', 'COPERNICUS/S2_SR_HARMONIZED')
        bbox = request.args.get('bbox', '')
        start_date = request.args.get('startDate', '2023-01-01')
        end_date = request.args.get('endDate', '2024-01-01')
        max_cloud = float(request.args.get('maxCloud', 30))
        limit = int(request.args.get('limit', 50))
        
        if not bbox:
            return jsonify({'error': 'bbox parameter required'}), 400
        
        if 'S2' not in dataset and 'COPERNICUS' not in dataset:
            return jsonify({'error': 'Multi-tile coverage only supported for Sentinel-2'}), 400
        
        coords = [float(x) for x in bbox.split(',')]
        bounds = ee.Geometry.Rectangle(coords)
        
        # Get all images in date range that intersect bounds
        collection = ee.ImageCollection(dataset) \
            .filterDate(start_date, end_date) \
            .filterBounds(bounds) \
            .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', max_cloud))
        
        # Extract image info including MGRS tile
        def get_tile_info(image):
            return ee.Feature(None, {
                'id': image.get('system:index'),
                'date': ee.Date(image.get('system:time_start')).format('YYYY-MM-dd'),
                'timestamp': image.get('system:time_start'),
                'mgrs_tile': image.get('MGRS_TILE'),
                'cloudCover': image.get('CLOUDY_PIXEL_PERCENTAGE'),
            })
        
        image_list = collection.map(get_tile_info)
        features = image_list.getInfo()['features']
        
        if not features:
            return jsonify({
                'dataset': dataset,
                'bbox': bbox,
                'dateRange': [start_date, end_date],
                'requiredTiles': [],
                'completeDates': 0,
                'dates': [],
                'message': 'No images found matching criteria'
            })
        
        # Extract unique MGRS tiles (these are required for full coverage)
        all_tiles = set()
        images_by_date = {}
        
        for f in features:
            props = f['properties']
            tile_id = props.get('mgrs_tile')
            date = props.get('date')
            
            if tile_id:
                all_tiles.add(tile_id)
            
            if date not in images_by_date:
                images_by_date[date] = []
            
            images_by_date[date].append({
                'id': props.get('id'),
                'tileId': tile_id,
                'cloudCover': round(props.get('cloudCover', 0), 1),
                'timestamp': props.get('timestamp')
            })
        
        required_tiles = sorted(list(all_tiles))
        
        # Find dates with complete coverage (all required tiles present)
        complete_dates = []
        
        for date, images in sorted(images_by_date.items()):
            # Get unique tiles for this date
            date_tiles = set(img['tileId'] for img in images if img['tileId'])
            
            # Check if all required tiles are present
            if date_tiles >= set(required_tiles):
                # Pick best (lowest cloud) image for each tile
                best_per_tile = {}
                for img in images:
                    tile = img['tileId']
                    if tile and (tile not in best_per_tile or img['cloudCover'] < best_per_tile[tile]['cloudCover']):
                        best_per_tile[tile] = img
                
                # Calculate average cloud cover across all tiles
                avg_cloud = sum(img['cloudCover'] for img in best_per_tile.values()) / len(best_per_tile)
                
                complete_dates.append({
                    'date': date,
                    'avgCloudCover': round(avg_cloud, 1),
                    'tiles': [
                        {
                            'tileId': tile,
                            'imageId': img['id'],
                            'cloudCover': img['cloudCover']
                        }
                        for tile, img in sorted(best_per_tile.items())
                    ]
                })
        
        # Sort by date and limit
        complete_dates = complete_dates[:limit]
        
        return jsonify({
            'dataset': dataset,
            'bbox': bbox,
            'dateRange': [start_date, end_date],
            'filters': {
                'maxCloud': max_cloud
            },
            'requiredTiles': required_tiles,
            'tileCount': len(required_tiles),
            'completeDates': len(complete_dates),
            'dates': complete_dates
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Mosaic Timelapse Frames ==========
@app.route('/api/timelapse/mosaic')
def timelapse_mosaic():
    """
    GET /api/timelapse/mosaic - Get tile URLs for multi-tile mosaics
    
    Takes output from /api/images/coverage and creates mosaicked tile URLs.
    
    Required params:
      - dataset: GEE collection ID
      - dates: JSON array of {date, imageIds: [ids]} from coverage endpoint
      
    Optional params:
      - bands: visualization bands
      - min/max: visualization range
      - index: spectral index (ndvi, ndwi, etc.)
    """
    try:
        dataset = request.args.get('dataset', 'COPERNICUS/S2_SR_HARMONIZED')
        dates_json = request.args.get('dates', '[]')
        bands = request.args.get('bands', '')
        vis_min = float(request.args.get('min', 0))
        vis_max = float(request.args.get('max', 3000))
        index = request.args.get('index', '')
        
        try:
            dates_data = json.loads(dates_json)
        except:
            return jsonify({'error': 'Invalid dates JSON'}), 400
        
        if not dates_data:
            return jsonify({'error': 'dates parameter required'}), 400
        
        # Band mappings for spectral indices
        band_mapping = {
            'COPERNICUS/S2': {'RED': 'B4', 'GREEN': 'B3', 'BLUE': 'B2', 'NIR': 'B8', 'SWIR': 'B11'},
        }
        
        mapping = None
        for key in band_mapping:
            if key in dataset:
                mapping = band_mapping[key]
                break
        
        frames = []
        
        for date_entry in dates_data:
            date = date_entry.get('date')
            image_ids = date_entry.get('imageIds', [])
            
            if not image_ids:
                continue
            
            try:
                # Load all images for this date and mosaic them
                images = [ee.Image(f"{dataset}/{img_id}") for img_id in image_ids]
                mosaic = ee.ImageCollection(images).mosaic()
                
                # Apply spectral index if specified
                if index and mapping:
                    if index.lower() == 'ndvi':
                        calc = mosaic.normalizedDifference([mapping['NIR'], mapping['RED']])
                        vis_params = {'min': -0.2, 'max': 0.8, 'palette': ['brown', 'yellow', 'green']}
                    elif index.lower() == 'ndwi':
                        calc = mosaic.normalizedDifference([mapping['GREEN'], mapping['NIR']])
                        vis_params = {'min': -0.5, 'max': 0.5, 'palette': ['brown', 'white', 'blue']}
                    elif index.lower() == 'ndbi':
                        calc = mosaic.normalizedDifference([mapping['SWIR'], mapping['NIR']])
                        vis_params = {'min': -0.5, 'max': 0.5, 'palette': ['green', 'white', 'red']}
                    elif index.lower() == 'evi':
                        nir = mosaic.select(mapping['NIR'])
                        red = mosaic.select(mapping['RED'])
                        blue = mosaic.select(mapping['BLUE'])
                        calc = nir.subtract(red).multiply(2.5).divide(
                            nir.add(red.multiply(6)).subtract(blue.multiply(7.5)).add(1)
                        )
                        vis_params = {'min': -0.2, 'max': 0.8, 'palette': ['brown', 'yellow', 'green']}
                    else:
                        calc = mosaic.normalizedDifference([mapping['NIR'], mapping['RED']])
                        vis_params = {'min': -0.2, 'max': 0.8, 'palette': ['brown', 'yellow', 'green']}
                    
                    vis = calc.visualize(**vis_params)
                else:
                    # Standard RGB
                    if bands:
                        band_list = bands.split(',')
                    elif mapping:
                        band_list = [mapping['RED'], mapping['GREEN'], mapping['BLUE']]
                    else:
                        band_list = ['B4', 'B3', 'B2']
                    
                    vis = mosaic.select(band_list).visualize(min=vis_min, max=vis_max)
                
                tile_url = get_tile_url(vis)
                
                frames.append({
                    'date': date,
                    'tileUrl': tile_url,
                    'imageCount': len(image_ids)
                })
                
            except Exception as img_error:
                frames.append({
                    'date': date,
                    'error': str(img_error)
                })
        
        return jsonify({
            'dataset': dataset,
            'frameCount': len(frames),
            'frames': frames
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Generate Timelapse Frames ==========
@app.route('/api/timelapse/frames')
def timelapse_frames():
    """
    GET /api/timelapse/frames - Get tile URLs for specific image IDs
    
    Required params:
      - dataset: GEE collection ID
      - imageIds: comma-separated image IDs (from /api/images/list)
      
    Optional params:
      - bands: visualization bands (default: true color for dataset)
      - min/max: visualization range
      - index: spectral index (ndvi, ndwi, ndbi, evi, savi)
      - palette: color palette for indices
    """
    try:
        dataset = request.args.get('dataset', 'COPERNICUS/S2_SR_HARMONIZED')
        image_ids = request.args.get('imageIds', '').split(',')
        bands = request.args.get('bands', '')
        vis_min = float(request.args.get('min', 0))
        vis_max = float(request.args.get('max', 3000))
        index = request.args.get('index', '')
        palette = request.args.get('palette', '')
        
        if not image_ids or not image_ids[0]:
            return jsonify({'error': 'imageIds parameter required'}), 400
        
        # Spectral index definitions
        indices = {
            'ndvi': {'formula': '(NIR - RED) / (NIR + RED)', 'min': -0.2, 'max': 0.8, 'palette': ['brown', 'yellow', 'green']},
            'ndwi': {'formula': '(GREEN - NIR) / (GREEN + NIR)', 'min': -0.5, 'max': 0.5, 'palette': ['brown', 'white', 'blue']},
            'ndbi': {'formula': '(SWIR - NIR) / (SWIR + NIR)', 'min': -0.5, 'max': 0.5, 'palette': ['green', 'white', 'red']},
            'evi': {'formula': '2.5 * (NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1)', 'min': -0.2, 'max': 0.8, 'palette': ['brown', 'yellow', 'green']},
            'savi': {'formula': '1.5 * (NIR - RED) / (NIR + RED + 0.5)', 'min': -0.2, 'max': 0.8, 'palette': ['brown', 'yellow', 'green']},
        }
        
        # Band mappings for different sensors
        band_mapping = {
            'COPERNICUS/S2': {'RED': 'B4', 'GREEN': 'B3', 'BLUE': 'B2', 'NIR': 'B8', 'SWIR': 'B11'},
            'LANDSAT/LC08': {'RED': 'SR_B4', 'GREEN': 'SR_B3', 'BLUE': 'SR_B2', 'NIR': 'SR_B5', 'SWIR': 'SR_B6'},
            'LANDSAT/LC09': {'RED': 'SR_B4', 'GREEN': 'SR_B3', 'BLUE': 'SR_B2', 'NIR': 'SR_B5', 'SWIR': 'SR_B6'},
        }
        
        # Get band mapping for dataset
        mapping = None
        for key in band_mapping:
            if key in dataset:
                mapping = band_mapping[key]
                break
        
        frames = []
        
        for image_id in image_ids:
            try:
                # Construct full asset ID
                full_id = f"{dataset}/{image_id}"
                image = ee.Image(full_id)
                
                # Get date for frame
                date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo()
                
                # Apply spectral index if specified
                if index and index.lower() in indices and mapping:
                    idx_config = indices[index.lower()]
                    
                    if index.lower() == 'ndvi':
                        calc_image = image.normalizedDifference([mapping['NIR'], mapping['RED']])
                    elif index.lower() == 'ndwi':
                        calc_image = image.normalizedDifference([mapping['GREEN'], mapping['NIR']])
                    elif index.lower() == 'ndbi':
                        calc_image = image.normalizedDifference([mapping['SWIR'], mapping['NIR']])
                    elif index.lower() == 'evi':
                        nir = image.select(mapping['NIR'])
                        red = image.select(mapping['RED'])
                        blue = image.select(mapping['BLUE'])
                        calc_image = nir.subtract(red).multiply(2.5).divide(
                            nir.add(red.multiply(6)).subtract(blue.multiply(7.5)).add(1)
                        )
                    elif index.lower() == 'savi':
                        nir = image.select(mapping['NIR'])
                        red = image.select(mapping['RED'])
                        calc_image = nir.subtract(red).multiply(1.5).divide(nir.add(red).add(0.5))
                    
                    vis_params = {
                        'min': idx_config['min'],
                        'max': idx_config['max'],
                        'palette': idx_config['palette']
                    }
                    vis = calc_image.visualize(**vis_params)
                else:
                    # Standard RGB visualization
                    if bands:
                        band_list = bands.split(',')
                    elif mapping:
                        band_list = [mapping['RED'], mapping['GREEN'], mapping['BLUE']]
                    else:
                        band_list = ['B4', 'B3', 'B2']  # Default S2
                    
                    vis_params = {'min': vis_min, 'max': vis_max}
                    vis = image.select(band_list).visualize(**vis_params)
                
                tile_url = get_tile_url(vis)
                
                frames.append({
                    'imageId': image_id,
                    'date': date,
                    'tileUrl': tile_url,
                    'index': index if index else 'rgb'
                })
                
            except Exception as img_error:
                frames.append({
                    'imageId': image_id,
                    'error': str(img_error)
                })
        
        return jsonify({
            'dataset': dataset,
            'frameCount': len(frames),
            'frames': frames
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Generic Dataset Tiles ==========
@app.route('/api/tiles/dataset')
def tiles_dataset():
    """
    GET /api/tiles/dataset - Flexible endpoint for any GEE ImageCollection
    
    Required params:
      - dataset: GEE collection ID (e.g., 'COPERNICUS/S2_SR_HARMONIZED')
      
    Optional params:
      - bands: comma-separated band names for RGB (e.g., 'B4,B3,B2')
      - min: visualization min (default 0)
      - max: visualization max (default 3000)
      - startDate: filter start (default: year-01-01)
      - endDate: filter end (default: year+1-01-01)
      - year: shorthand for startDate/endDate (default 2023)
      - cloudFilter: max cloud % for Sentinel/Landsat (default 20)
      - reducer: median|mean|mosaic|min|max (default median)
      - bbox: optional bounds filter (west,south,east,north)
      - palette: for single-band viz (e.g., 'viridis' or 'FF0000,00FF00,0000FF')
    
    Examples:
      Sentinel-2 RGB: ?dataset=COPERNICUS/S2_SR_HARMONIZED&bands=B4,B3,B2&max=3000
      Landsat 8: ?dataset=LANDSAT/LC08/C02/T1_L2&bands=SR_B4,SR_B3,SR_B2&min=7000&max=20000
      MODIS NDVI: ?dataset=MODIS/061/MOD13A1&bands=NDVI&min=0&max=9000&palette=brown,yellow,green
      DEM: ?dataset=USGS/SRTMGL1_003&bands=elevation&min=0&max=4000&palette=terrain
    """
    try:
        dataset = request.args.get('dataset')
        if not dataset:
            return jsonify({'error': 'dataset parameter required'}), 400
        
        # Parse parameters
        bands = request.args.get('bands', '').split(',') if request.args.get('bands') else None
        vis_min = float(request.args.get('min', 0))
        vis_max = float(request.args.get('max', 3000))
        year = request.args.get('year', '2023')
        start_date = request.args.get('startDate', f'{year}-01-01')
        end_date = request.args.get('endDate', f'{int(year) + 1}-01-01')
        cloud_filter = float(request.args.get('cloudFilter', 20))
        reducer = request.args.get('reducer', 'median')
        bbox = request.args.get('bbox', '')
        palette = request.args.get('palette', '')
        
        # Cache key
        cache_key = _cache_key('dataset', dataset, str(bands), vis_min, vis_max, 
                               start_date, end_date, cloud_filter, reducer, bbox, palette)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})
        
        # Check if it's an Image or ImageCollection
        # Known single-image datasets
        single_image_datasets = [
            'USGS/SRTMGL1_003', 'NASA/NASADEM_HGT/001', 'CGIAR/SRTM90_V4',
            'WWF/HydroSHEDS', 'MERIT/DEM/v1_0_3', 'JAXA/ALOS/AW3D30/V3_2'
        ]
        
        is_single_image = any(d in dataset for d in single_image_datasets)
        
        if is_single_image:
            # Handle as single Image
            image = ee.Image(dataset)
        else:
            # Handle as ImageCollection
            collection = ee.ImageCollection(dataset)
            
            # Apply date filter
            collection = collection.filterDate(start_date, end_date)
            
            # Apply bbox filter if provided
            if bbox:
                coords = [float(x) for x in bbox.split(',')]
                bounds = ee.Geometry.Rectangle(coords)
                collection = collection.filterBounds(bounds)
            
            # Apply cloud filter for known collections
            if 'S2' in dataset or 'COPERNICUS' in dataset:
                collection = collection.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_filter))
            elif 'LANDSAT' in dataset:
                collection = collection.filter(ee.Filter.lt('CLOUD_COVER', cloud_filter))
            
            # Apply reducer
            if reducer == 'median':
                image = collection.median()
            elif reducer == 'mean':
                image = collection.mean()
            elif reducer == 'min':
                image = collection.min()
            elif reducer == 'max':
                image = collection.max()
            elif reducer == 'mosaic':
                image = collection.mosaic()
            else:
                image = collection.median()
        
        # Build visualization params
        vis_params = {'min': vis_min, 'max': vis_max}
        
        if bands and bands[0]:
            image = image.select(bands)
            if len(bands) == 1 and palette:
                # Single band with palette
                if ',' in palette:
                    vis_params['palette'] = palette.split(',')
                else:
                    # Named palettes
                    palettes = {
                        'viridis': ['440154', '414487', '2a788e', '22a884', '7ad151', 'fde725'],
                        'terrain': ['006600', '90EE90', 'FFFF00', 'FFA500', 'FF0000', 'FFFFFF'],
                        'ndvi': ['CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901', '66A000', '529400', '3E8601', '207401', '056201'],
                        'temperature': ['0000FF', '00FFFF', '00FF00', 'FFFF00', 'FF0000'],
                    }
                    vis_params['palette'] = palettes.get(palette, palette.split(','))
        
        vis = image.visualize(**vis_params)
        tile_url = get_tile_url(vis)
        
        _set_cached(cache_key, tile_url)
        return jsonify({
            'tileUrl': tile_url, 
            'cached': False,
            'dataset': dataset,
            'bands': bands,
            'dateRange': [start_date, end_date]
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: List Available Datasets ==========
@app.route('/api/datasets')
def list_datasets():
    """Returns commonly used GEE datasets with example parameters"""
    datasets = [
        {
            'id': 'COPERNICUS/S2_SR_HARMONIZED',
            'name': 'Sentinel-2 Surface Reflectance',
            'example': '?dataset=COPERNICUS/S2_SR_HARMONIZED&bands=B4,B3,B2&max=3000',
            'bands': ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'],
        },
        {
            'id': 'LANDSAT/LC08/C02/T1_L2',
            'name': 'Landsat 8 Collection 2',
            'example': '?dataset=LANDSAT/LC08/C02/T1_L2&bands=SR_B4,SR_B3,SR_B2&min=7000&max=20000',
            'bands': ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
        },
        {
            'id': 'MODIS/061/MOD13A1',
            'name': 'MODIS Vegetation Indices',
            'example': '?dataset=MODIS/061/MOD13A1&bands=NDVI&min=0&max=9000&palette=ndvi',
            'bands': ['NDVI', 'EVI'],
        },
        {
            'id': 'USGS/SRTMGL1_003',
            'name': 'SRTM Digital Elevation',
            'example': '?dataset=USGS/SRTMGL1_003&bands=elevation&min=0&max=4000&palette=terrain',
            'bands': ['elevation'],
        },
        {
            'id': 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG',
            'name': 'VIIRS Nighttime Lights',
            'example': '?dataset=NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG&bands=avg_rad&min=0&max=60',
            'bands': ['avg_rad'],
        },
        {
            'id': 'NASA/NASADEM_HGT/001',
            'name': 'NASADEM Elevation',
            'example': '?dataset=NASA/NASADEM_HGT/001&bands=elevation&min=0&max=3000&palette=terrain',
            'bands': ['elevation'],
        },
    ]
    return jsonify({'datasets': datasets})


# ========== Endpoint: Clustering Tiles ==========
@app.route('/api/tiles/clustering')
def tiles_clustering():
    try:
        year = request.args.get('year', '2023')
        lat = float(request.args.get('lat', '12.45'))
        lng = float(request.args.get('lng', '76.52'))
        zoom = int(request.args.get('zoom', '10'))
        n_clusters = int(request.args.get('clusters', '5'))
        n_clusters = max(2, min(15, n_clusters))

        degrees = 2.0 * (2 ** (10 - zoom))
        degrees = max(0.1, min(degrees, 10))

        cache_key = _cache_key('clustering', year, round(lat, 2), round(lng, 2), zoom, n_clusters)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        mosaic = get_embedding_mosaic(year)
        all_bands = [f'A{i:02d}' for i in range(64)]
        emb_image = mosaic.select(all_bands)

        region = ee.Geometry.Rectangle([
            lng - degrees, lat - degrees,
            lng + degrees, lat + degrees
        ])

        training = emb_image.sample(region=region, scale=4000, numPixels=5000, seed=42)
        clusterer = ee.Clusterer.wekaKMeans(n_clusters).train(training)
        clustered = emb_image.cluster(clusterer)

        palette = [
            '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
            '#ffff33', '#a65628', '#f781bf', '#999999', '#66c2a5',
            '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f'
        ]
        vis = clustered.visualize(min=0, max=n_clusters - 1, palette=palette[:n_clusters])

        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False, 'clusters': n_clusters})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Change Detection Tiles ==========
@app.route('/api/tiles/change')
def tiles_change():
    try:
        year1 = request.args.get('year1', '2020')
        year2 = request.args.get('year2', '2023')
        bands = request.args.get('bands', 'A01,A16,A09').split(',')

        if len(bands) != 3:
            return jsonify({'error': 'Exactly 3 bands required'}), 400

        cache_key = _cache_key('change', year1, year2, tuple(bands))
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        mosaic1 = get_embedding_mosaic(year1)
        mosaic2 = get_embedding_mosaic(year2)
        diff = mosaic2.select(bands).subtract(mosaic1.select(bands))

        vis = diff.visualize(min=-0.3, max=0.3)
        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)

        return jsonify({'tileUrl': tile_url, 'cached': False, 'year1': year1, 'year2': year2})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Similarity Tiles ==========
@app.route('/api/tiles/similarity')
def tiles_similarity():
    try:
        year = request.args.get('year', '2023')
        lat = float(request.args.get('lat', '42.0'))
        lng = float(request.args.get('lng', '-93.5'))
        radius = float(request.args.get('radius', '500000'))

        cache_key = _cache_key('similarity', year, round(lat, 4), round(lng, 4), radius)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        mosaic = get_embedding_mosaic(year)
        all_bands = [f'A{i:02d}' for i in range(64)]
        emb_image = mosaic.select(all_bands)

        point = ee.Geometry.Point([lng, lat])
        ref_result = emb_image.reduceRegion(
            reducer=ee.Reducer.first(), geometry=point, scale=4000
        )

        ref_image = ee.Image.constant([ref_result.get(b) for b in all_bands]).rename(all_bands)

        dot_product = emb_image.multiply(ref_image).reduce(ee.Reducer.sum())
        norm_emb = emb_image.pow(2).reduce(ee.Reducer.sum()).sqrt()
        norm_ref = ref_image.pow(2).reduce(ee.Reducer.sum()).sqrt()
        similarity = dot_product.divide(norm_emb.multiply(norm_ref))

        vis = similarity.visualize(
            min=0.5, max=1.0,
            palette=['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd',
                     '#ffd60a', '#fca311', '#e76f51']
        )

        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Point Info ==========
@app.route('/api/info')
def point_info():
    try:
        year = request.args.get('year', '2023')
        lat = float(request.args.get('lat', '42.0'))
        lng = float(request.args.get('lng', '-93.5'))

        mosaic = get_embedding_mosaic(year)
        all_bands = [f'A{i:02d}' for i in range(64)]
        emb_image = mosaic.select(all_bands)

        point = ee.Geometry.Point([lng, lat])
        result = emb_image.reduceRegion(
            reducer=ee.Reducer.first(), geometry=point, scale=4000
        ).getInfo()

        if result is None or all(v is None for v in result.values()):
            return jsonify({'error': 'No embedding data at this location', 'lat': lat, 'lng': lng, 'year': year}), 404

        embedding = [result.get(b, 0) or 0 for b in all_bands]
        land_cover = classify_embedding(embedding)

        return jsonify({
            'embedding': embedding, 'year': year, 'lat': lat, 'lng': lng,
            'bands': all_bands, 'landCover': land_cover
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def classify_embedding(embedding):
    import math
    mean_val = sum(embedding) / len(embedding)
    std_val = math.sqrt(sum((v - mean_val) ** 2 for v in embedding) / len(embedding))
    max_val = max(embedding)
    min_val = min(embedding)
    pos_count = sum(1 for v in embedding if v > 0)
    neg_count = sum(1 for v in embedding if v < 0)

    a00 = embedding[0] if len(embedding) > 0 else 0
    a01 = embedding[1] if len(embedding) > 1 else 0

    categories = []
    if std_val < 0.05:
        categories.append(('Water/Ocean', 0.7))
    if a00 > 0.1 and pos_count > 40:
        categories.append(('Vegetation/Forest', 0.6))
    if mean_val < -0.05:
        categories.append(('Urban/Built-up', 0.5))
    if std_val > 0.15 and a01 > 0:
        categories.append(('Cropland', 0.5))
    if mean_val > 0 and std_val < 0.1:
        categories.append(('Desert/Barren', 0.4))
    if not categories:
        categories.append(('Mixed/Unknown', 0.3))

    categories.sort(key=lambda x: -x[1])
    return {
        'type': categories[0][0], 'confidence': categories[0][1],
        'alternatives': [{'type': c[0], 'confidence': c[1]} for c in categories[1:3]],
        'stats': {
            'mean': round(mean_val, 4), 'std': round(std_val, 4),
            'max': round(max_val, 4), 'min': round(min_val, 4),
            'positiveAxes': pos_count, 'negativeAxes': neg_count
        }
    }


@app.route('/api/years')
def available_years():
    return jsonify({'years': list(range(2017, 2025)), 'default': 2023})


@app.route('/api/bands')
def band_info():
    bands = [f'A{i:02d}' for i in range(64)]
    presets = {
        'Default RGB': 'A01,A16,A09',
        'Vegetation Focus': 'A00,A03,A07',
        'Urban Detection': 'A02,A10,A20',
        'Water Bodies': 'A05,A15,A30',
        'Change Sensitive': 'A01,A08,A32',
    }
    return jsonify({'bands': bands, 'totalBands': 64, 'presets': presets})


# ═══════════════════════════════════════════════════════════════════════
# SNOW TRACKER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.route('/api/snow/tiles/snodas')
def snow_tiles_snodas():
    """GET /api/snow/tiles/snodas?date=YYYY-MM-DD&band=Snow_Depth"""
    try:
        date_str = request.args.get('date', '2024-02-15')
        band = request.args.get('band', 'Snow_Depth')
        ck = _cache_key('snodas_tile', date_str, band)
        cached = _get_cached(ck)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})
        col = ee.ImageCollection('projects/climate-engine/snodas/daily')
        img = col.filterDate(date_str, ee.Date(date_str).advance(1, 'day')).first()
        vp = {
            'Snow_Depth': {'min': 0, 'max': 1.5, 'palette': ['#f7fbff','#c6dbef','#6baed6','#2171b5','#08306b','#4a148c','#e1bee7']},
            'SWE': {'min': 0, 'max': 500, 'palette': ['#f7fbff','#9ecae1','#3182bd','#08519c','#6a1b9a','#e91e63']},
            'Snowfall': {'min': 0, 'max': 50, 'palette': ['#f7fbff','#9ecae1','#4292c6','#08519c','#4a148c']},
        }.get(band, {'min': 0, 'max': 1.5, 'palette': ['#f7fbff','#08306b']})
        vis = img.select(band).visualize(**vp)
        tile_url = get_tile_url(vis)
        _set_cached(ck, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False, 'date': date_str, 'band': band})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/snow/tiles/era5')
def snow_tiles_era5():
    """GET /api/snow/tiles/era5?year=2023&month=01&band=snowfall_sum"""
    try:
        year = request.args.get('year', '2023')
        month = request.args.get('month', '01').zfill(2)
        band = request.args.get('band', 'snowfall_sum')
        ck = _cache_key('era5_tile', year, month, band)
        cached = _get_cached(ck)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})
        date_str = f'{year}-{month}-01'
        img = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR') \
            .filterDate(date_str, ee.Date(date_str).advance(1, 'month')).first()
        vp = {
            'snowfall_sum': {'min': 0, 'max': 0.5, 'palette': ['#0d1b2a','#1b263b','#415a77','#778da9','#93c5fd','#6366f1','#a855f7','#e9d5ff']},
            'snow_depth': {'min': 0, 'max': 1.5, 'palette': ['#0d1b2a','#1e3a5f','#3b82f6','#60a5fa','#93c5fd','#c8b4ff','#f3e8ff']},
            'snow_cover': {'min': 0, 'max': 100, 'palette': ['#0d1b2a','#1e3a5f','#60a5fa','#c8b4ff','#ffffff']},
        }.get(band, {'min': 0, 'max': 0.5, 'palette': ['#0d1b2a','#e9d5ff']})
        vis = img.select(band).visualize(**vp)
        tile_url = get_tile_url(vis)
        _set_cached(ck, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False, 'year': year, 'month': month, 'band': band})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/snow/stats/snodas')
def snow_stats_snodas():
    """GET /api/snow/stats/snodas?lat=40&lon=-105&start=2023-10-01&end=2024-04-01&band=Snow_Depth"""
    try:
        lat = float(request.args.get('lat', '40'))
        lon = float(request.args.get('lon', '-105'))
        start = request.args.get('start', '2023-10-01')
        end = request.args.get('end', '2024-04-01')
        band = request.args.get('band', 'Snow_Depth')
        point = ee.Geometry.Point([lon, lat])
        col = ee.ImageCollection('projects/climate-engine/snodas/daily') \
            .filterDate(start, end).select(band)

        def extract(img):
            val = img.reduceRegion(reducer=ee.Reducer.first(), geometry=point, scale=1000).get(band)
            return ee.Feature(None, {'date': img.date().format('YYYY-MM-dd'), 'value': val})

        series = col.map(extract).getInfo()
        results = [{'date': f['properties']['date'], 'value': round(f['properties']['value'], 4)}
                   for f in series.get('features', []) if f.get('properties', {}).get('value') is not None]
        return jsonify({'series': results, 'lat': lat, 'lon': lon, 'band': band})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/snow/stats/era5')
def snow_stats_era5():
    """GET /api/snow/stats/era5?lat=60&lon=10&start=2015-01&end=2024-12&band=snowfall_sum"""
    try:
        lat = float(request.args.get('lat', '60'))
        lon = float(request.args.get('lon', '10'))
        start = request.args.get('start', '2015-01')
        end = request.args.get('end', '2024-12')
        band = request.args.get('band', 'snowfall_sum')
        point = ee.Geometry.Point([lon, lat])
        start_date = f'{start}-01'
        end_parts = end.split('-')
        end_date = ee.Date(f'{end_parts[0]}-{end_parts[1]}-01').advance(1, 'month')
        col = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR') \
            .filterDate(start_date, end_date).select(band)

        def extract(img):
            val = img.reduceRegion(reducer=ee.Reducer.first(), geometry=point, scale=11000).get(band)
            return ee.Feature(None, {'date': img.date().format('YYYY-MM'), 'value': val})

        series = col.map(extract).getInfo()
        results = [{'date': f['properties']['date'], 'value': round(f['properties']['value'], 6)}
                   for f in series.get('features', []) if f.get('properties', {}).get('value') is not None]
        return jsonify({'series': results, 'lat': lat, 'lon': lon, 'band': band})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/snow/animation/snodas')
def snow_animation_snodas():
    """GET /api/snow/animation/snodas?start=2024-01-01&end=2024-04-01&band=Snow_Depth&interval=7"""
    try:
        start = request.args.get('start', '2024-01-01')
        end = request.args.get('end', '2024-04-01')
        band = request.args.get('band', 'Snow_Depth')
        interval = int(request.args.get('interval', '7'))
        vp = {
            'Snow_Depth': {'min': 0, 'max': 1.5, 'palette': ['#f7fbff','#c6dbef','#6baed6','#2171b5','#08306b','#4a148c','#e1bee7']},
            'SWE': {'min': 0, 'max': 500, 'palette': ['#f7fbff','#9ecae1','#3182bd','#08519c','#6a1b9a','#e91e63']},
            'Snowfall': {'min': 0, 'max': 50, 'palette': ['#f7fbff','#9ecae1','#4292c6','#08519c','#4a148c']},
        }.get(band, {'min': 0, 'max': 1.5, 'palette': ['#f7fbff','#08306b']})
        col = ee.ImageCollection('projects/climate-engine/snodas/daily').select(band)
        start_date = ee.Date(start)
        end_date = ee.Date(end)
        n_frames = min(int(end_date.difference(start_date, 'day').divide(interval).ceil().getInfo()), 60)
        frames = []
        for i in range(n_frames):
            d = start_date.advance(i * interval, 'day')
            d_str = d.format('YYYY-MM-dd').getInfo()
            ck = _cache_key('snodas_anim', d_str, band)
            cached_url = _get_cached(ck)
            if cached_url:
                frames.append({'date': d_str, 'tileUrl': cached_url}); continue
            img = col.filterDate(d, d.advance(1, 'day')).first()
            vis = img.visualize(**vp)
            tile_url = get_tile_url(vis)
            _set_cached(ck, tile_url)
            frames.append({'date': d_str, 'tileUrl': tile_url})
        return jsonify({'frames': frames, 'band': band, 'interval': interval})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/snow/animation/era5')
def snow_animation_era5():
    """GET /api/snow/animation/era5?startYear=2015&endYear=2024&month=01&band=snowfall_sum"""
    try:
        start_year = int(request.args.get('startYear', '2015'))
        end_year = int(request.args.get('endYear', '2024'))
        month = request.args.get('month', '01').zfill(2)
        band = request.args.get('band', 'snowfall_sum')
        vp = {
            'snowfall_sum': {'min': 0, 'max': 0.5, 'palette': ['#0d1b2a','#1b263b','#415a77','#778da9','#93c5fd','#6366f1','#a855f7','#e9d5ff']},
            'snow_depth': {'min': 0, 'max': 1.5, 'palette': ['#0d1b2a','#1e3a5f','#3b82f6','#60a5fa','#93c5fd','#c8b4ff','#f3e8ff']},
            'snow_cover': {'min': 0, 'max': 100, 'palette': ['#0d1b2a','#1e3a5f','#60a5fa','#c8b4ff','#ffffff']},
        }.get(band, {'min': 0, 'max': 0.5, 'palette': ['#0d1b2a','#e9d5ff']})
        col = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR').select(band)
        frames = []
        for year in range(start_year, end_year + 1):
            ck = _cache_key('era5_anim', year, month, band)
            cached_url = _get_cached(ck)
            if cached_url:
                frames.append({'year': year, 'tileUrl': cached_url}); continue
            date_str = f'{year}-{month}-01'
            img = col.filterDate(date_str, ee.Date(date_str).advance(1, 'month')).first()
            vis = img.visualize(**vp)
            tile_url = get_tile_url(vis)
            _set_cached(ck, tile_url)
            frames.append({'year': year, 'tileUrl': tile_url})
        return jsonify({'frames': frames, 'band': band, 'month': month})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Run ==========
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f'🌍 GEE Tile Proxy starting on port {port}...')
    print(f'   Service account: {creds_data["client_email"]}')
    print(f'   Project: {creds_data["project_id"]}')
    print(f'   Snow endpoints: /api/snow/tiles/*, /api/snow/stats/*, /api/snow/animation/*')
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
