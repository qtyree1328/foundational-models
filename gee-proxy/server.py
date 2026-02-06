"""
GEE Tile Proxy Server for Foundational Models Dashboard
Serves Google Earth Engine tile URLs for AlphaEarth Foundation embeddings.
Runs on port 3013.
"""

import ee
import json
import time
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

# ========== Initialize Earth Engine ==========
SA_PATH = '/Users/hutchbot/.config/gee/service-account.json'

with open(SA_PATH) as f:
    creds_data = json.load(f)

credentials = ee.ServiceAccountCredentials(
    creds_data['client_email'],
    SA_PATH
)
ee.Initialize(credentials, project=creds_data['project_id'])

# ========== Flask App ==========
app = Flask(__name__)
CORS(app, origins=[
    'http://127.0.0.1:3003',
    'http://localhost:3003',
    'http://100.68.227.27:3003',
])

# ========== Tile URL Cache ==========
# GEE tile URLs expire after ~2 hours; cache for 90 minutes
_tile_cache = {}
CACHE_TTL = 90 * 60  # 90 minutes


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
    # Evict old entries
    now = time.time()
    expired = [k for k, (_, ts) in _tile_cache.items() if now - ts > CACHE_TTL]
    for k in expired:
        del _tile_cache[k]


# ========== Helper: Get Embedding Mosaic ==========
def get_embedding_mosaic(year):
    """Get the annual embedding mosaic for a given year."""
    start = f'{year}-01-01'
    end = f'{int(year) + 1}-01-01'
    collection = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL') \
        .filter(ee.Filter.date(start, end))
    return collection.mosaic()


def get_tile_url(image):
    """Get XYZ tile URL from an ee.Image."""
    map_id = image.getMapId()
    return map_id['tile_fetcher'].url_format


# ========== Health Check ==========
@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'gee-proxy', 'port': 3013})


# ========== Endpoint: Embedding RGB Tiles ==========
@app.route('/api/tiles/embeddings')
def tiles_embeddings():
    """
    GET /api/tiles/embeddings?year=2023&bands=A01,A16,A09&min=-0.3&max=0.3
    Returns XYZ tile URL for RGB visualization of embedding bands.
    """
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


# ========== Endpoint: Optical (Sentinel-2) Tiles ==========
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


# ========== Endpoint: Clustering Tiles ==========
@app.route('/api/tiles/clustering')
def tiles_clustering():
    """
    GET /api/tiles/clustering?year=2023&lat=12.45&lng=76.52&zoom=10&clusters=5
    K-means clustering on embeddings in a region.
    """
    try:
        year = request.args.get('year', '2023')
        lat = float(request.args.get('lat', '12.45'))
        lng = float(request.args.get('lng', '76.52'))
        zoom = int(request.args.get('zoom', '10'))
        n_clusters = int(request.args.get('clusters', '5'))
        n_clusters = max(2, min(15, n_clusters))

        # Compute region size based on zoom
        # At zoom 10, ~100km; scale accordingly
        degrees = 2.0 * (2 ** (10 - zoom))
        degrees = max(0.1, min(degrees, 10))

        cache_key = _cache_key('clustering', year, round(lat, 2), round(lng, 2), zoom, n_clusters)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        mosaic = get_embedding_mosaic(year)

        # Select all 64 embedding bands
        all_bands = [f'A{i:02d}' for i in range(64)]
        emb_image = mosaic.select(all_bands)

        # Define region for training
        region = ee.Geometry.Rectangle([
            lng - degrees, lat - degrees,
            lng + degrees, lat + degrees
        ])

        # Run K-means clustering
        training = emb_image.sample(
            region=region,
            scale=4000,  # ~4km resolution for training
            numPixels=5000,
            seed=42
        )

        clusterer = ee.Clusterer.wekaKMeans(n_clusters).train(training)
        clustered = emb_image.cluster(clusterer)

        # Visualize with a palette
        palette = [
            '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
            '#ffff33', '#a65628', '#f781bf', '#999999', '#66c2a5',
            '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f'
        ]
        vis = clustered.visualize(
            min=0,
            max=n_clusters - 1,
            palette=palette[:n_clusters]
        )

        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False, 'clusters': n_clusters})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Change Detection Tiles ==========
@app.route('/api/tiles/change')
def tiles_change():
    """
    GET /api/tiles/change?year1=2020&year2=2023&bands=A01,A16,A09
    Change detection between two years using embedding difference.
    """
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

        # Compute difference for the selected bands
        diff = mosaic2.select(bands).subtract(mosaic1.select(bands))

        # RGB difference visualization (directional change)
        vis = diff.visualize(min=-0.3, max=0.3)
        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)

        return jsonify({
            'tileUrl': tile_url,
            'cached': False,
            'year1': year1,
            'year2': year2
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Similarity Tiles ==========
@app.route('/api/tiles/similarity')
def tiles_similarity():
    """
    GET /api/tiles/similarity?year=2023&lat=42.0&lng=-93.5&radius=50000
    Finds areas similar to a clicked point using cosine similarity.
    """
    try:
        year = request.args.get('year', '2023')
        lat = float(request.args.get('lat', '42.0'))
        lng = float(request.args.get('lng', '-93.5'))
        radius = float(request.args.get('radius', '500000'))  # meters

        cache_key = _cache_key('similarity', year, round(lat, 4), round(lng, 4), radius)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        mosaic = get_embedding_mosaic(year)
        all_bands = [f'A{i:02d}' for i in range(64)]
        emb_image = mosaic.select(all_bands)

        # Get reference embedding at the point
        point = ee.Geometry.Point([lng, lat])
        ref_result = emb_image.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=4000
        )

        # Build reference image from point values
        ref_image = ee.Image.constant([ref_result.get(b) for b in all_bands]) \
            .rename(all_bands)

        dot_product = emb_image.multiply(ref_image).reduce(ee.Reducer.sum())
        norm_emb = emb_image.pow(2).reduce(ee.Reducer.sum()).sqrt()
        norm_ref = ref_image.pow(2).reduce(ee.Reducer.sum()).sqrt()

        similarity = dot_product.divide(norm_emb.multiply(norm_ref))

        # Visualize: high similarity = warm colors
        vis = similarity.visualize(
            min=0.5,
            max=1.0,
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
    """
    GET /api/info?year=2023&lat=42.0&lng=-93.5
    Returns the actual 64-dim embedding vector at a point.
    """
    try:
        year = request.args.get('year', '2023')
        lat = float(request.args.get('lat', '42.0'))
        lng = float(request.args.get('lng', '-93.5'))

        mosaic = get_embedding_mosaic(year)
        all_bands = [f'A{i:02d}' for i in range(64)]
        emb_image = mosaic.select(all_bands)

        point = ee.Geometry.Point([lng, lat])

        # Use reduceRegion which is more reliable than sample for single points
        result = emb_image.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=4000
        ).getInfo()

        if result is None or all(v is None for v in result.values()):
            return jsonify({
                'error': 'No embedding data at this location',
                'lat': lat,
                'lng': lng,
                'year': year
            }), 404

        embedding = [result.get(b, 0) or 0 for b in all_bands]

        # Simple land cover classification based on embedding patterns
        land_cover = classify_embedding(embedding)

        return jsonify({
            'embedding': embedding,
            'year': year,
            'lat': lat,
            'lng': lng,
            'bands': all_bands,
            'landCover': land_cover
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def classify_embedding(embedding):
    """
    Simple heuristic classification based on embedding values.
    Returns a guess at land cover type with confidence.
    """
    import math

    # Compute some basic statistics
    mean_val = sum(embedding) / len(embedding)
    std_val = math.sqrt(sum((v - mean_val) ** 2 for v in embedding) / len(embedding))
    max_val = max(embedding)
    min_val = min(embedding)
    pos_count = sum(1 for v in embedding if v > 0)
    neg_count = sum(1 for v in embedding if v < 0)

    # Use first few principal embedding axes for rough classification
    # These are heuristics - real classification would use a trained model
    a00 = embedding[0] if len(embedding) > 0 else 0
    a01 = embedding[1] if len(embedding) > 1 else 0
    a02 = embedding[2] if len(embedding) > 2 else 0

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

    # Sort by confidence
    categories.sort(key=lambda x: -x[1])

    return {
        'type': categories[0][0],
        'confidence': categories[0][1],
        'alternatives': [{'type': c[0], 'confidence': c[1]} for c in categories[1:3]],
        'stats': {
            'mean': round(mean_val, 4),
            'std': round(std_val, 4),
            'max': round(max_val, 4),
            'min': round(min_val, 4),
            'positiveAxes': pos_count,
            'negativeAxes': neg_count
        }
    }


# ========== Endpoint: Deforestation Gradient (Process Vector) ==========
@app.route('/api/tiles/deforestation')
def tiles_deforestation():
    """
    GET /api/tiles/deforestation?year=2023&bbox=-63.5,-11,-62.5,-10
    Returns XYZ tile URL for deforestation degradation index using process vector approach.
    Based on Guneet Mutreja's "Geospatial Calculus" methodology.
    """
    try:
        year = request.args.get('year', '2023')
        bbox = request.args.get('bbox', '-63.5,-11.0,-62.5,-10.0')

        cache_key = _cache_key('deforestation', year, bbox)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        # Parse bbox
        coords = [float(x) for x in bbox.split(',')]
        region = ee.Geometry.Rectangle(coords)

        # Load Hansen Global Forest Change for anchor definitions
        gfc = ee.Image('UMD/hansen/global_forest_change_2022_v1_10')
        
        # Define "pristine forest": high canopy (>80%) in 2000, zero loss
        pristine_mask = gfc.select('treecover2000').gt(80).And(gfc.select('loss').eq(0))
        
        # Define "deforested": was dense forest, lost in recent years (lossyear >= 18 = 2018+)
        deforested_mask = gfc.select('treecover2000').gt(80).And(gfc.select('lossyear').gte(18))

        # Get embeddings for the requested year
        mosaic = get_embedding_mosaic(year)
        all_bands = [f'A{i:02d}' for i in range(64)]
        emb_image = mosaic.select(all_bands)

        # Calculate mean embedding for pristine forest in the region
        mean_pristine = emb_image.updateMask(pristine_mask).reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=1000,
            maxPixels=1e8
        )

        # Calculate mean embedding for deforested land in the region
        mean_deforested = emb_image.updateMask(deforested_mask).reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=1000,
            maxPixels=1e8
        )

        # Create constant images from the mean vectors
        pristine_image = ee.Image.constant([mean_pristine.get(b) for b in all_bands]).rename(all_bands)
        deforested_image = ee.Image.constant([mean_deforested.get(b) for b in all_bands]).rename(all_bands)

        # Compute deforestation vector: deforested - pristine
        deforestation_vector = deforested_image.subtract(pristine_image)

        # Normalize the vector
        norm = deforestation_vector.pow(2).reduce(ee.Reducer.sum()).sqrt()
        deforestation_vector_normalized = deforestation_vector.divide(norm)

        # Project every pixel onto this deforestation axis (dot product)
        degradation_index = emb_image.multiply(deforestation_vector_normalized).reduce(ee.Reducer.sum())

        # Only show forested areas (>30% tree cover)
        forest_mask = gfc.select('treecover2000').gt(30)
        degradation_index = degradation_index.updateMask(forest_mask)

        # Visualize: green = healthy forest, red = degraded/deforested
        vis = degradation_index.visualize(
            min=-0.5,
            max=0.5,
            palette=['#1a9850', '#91cf60', '#d9ef8b', '#ffffbf', '#fee08b', '#fc8d59', '#d73027']
        )

        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: CDL (Cropland Data Layer) Tiles ==========
@app.route('/api/tiles/cdl')
def tiles_cdl():
    """
    GET /api/tiles/cdl?year=2023
    Returns XYZ tile URL for USDA Cropland Data Layer visualization.
    """
    try:
        year = request.args.get('year', '2023')

        cache_key = _cache_key('cdl', year)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        # CDL is available from 2008-2023
        cdl = ee.ImageCollection('USDA/NASS/CDL') \
            .filter(ee.Filter.calendarRange(int(year), int(year), 'year')) \
            .first() \
            .select('cropland')

        # CDL has its own color palette - use the built-in visualization
        # We'll use a simplified visualization
        vis = cdl.visualize(
            min=0,
            max=255,
            palette=[
                '#ffd300', '#ff2626', '#00a8e2', '#ff9e0a', '#267000',
                '#ffff00', '#70a500', '#00af49', '#dda50a', '#dda50a',
                '#7cd3ff', '#e2007c', '#896054', '#d8b56b', '#a57000',
                '#d69ebc', '#707000', '#aa007c', '#a05989', '#700049',
                '#d69ebc', '#d1ff00', '#7c99ff', '#d6d600', '#d1ff00'
            ]
        )

        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Burn Severity (dNBR) ==========
@app.route('/api/tiles/burn')
def tiles_burn():
    """
    GET /api/tiles/burn?before_year=2019&after_year=2021&bbox=-119.6,37.0,-119.0,37.5
    Returns XYZ tile URL for burn severity visualization using dNBR.
    """
    try:
        before_year = request.args.get('before_year', '2019')
        after_year = request.args.get('after_year', '2021')
        bbox = request.args.get('bbox', '')

        cache_key = _cache_key('burn', before_year, after_year, bbox)
        cached = _get_cached(cache_key)
        if cached:
            return jsonify({'tileUrl': cached, 'cached': True})

        # Get Sentinel-2 before and after fire
        def get_s2_composite(year):
            return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
                .filterDate(f'{year}-06-01', f'{year}-09-30') \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
                .median()

        before = get_s2_composite(before_year)
        after = get_s2_composite(after_year)

        # Calculate NBR = (NIR - SWIR) / (NIR + SWIR)
        # Sentinel-2: NIR = B8, SWIR = B12
        def calc_nbr(img):
            return img.normalizedDifference(['B8', 'B12']).rename('NBR')

        nbr_before = calc_nbr(before)
        nbr_after = calc_nbr(after)

        # dNBR = NBR_before - NBR_after (positive = burned)
        dnbr = nbr_before.subtract(nbr_after).rename('dNBR')

        # Visualize with burn severity palette
        vis = dnbr.visualize(
            min=-0.25,
            max=0.66,
            palette=['#2166ac', '#67a9cf', '#d1e5f0', '#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b']
        )

        tile_url = get_tile_url(vis)
        _set_cached(cache_key, tile_url)
        return jsonify({'tileUrl': tile_url, 'cached': False})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== Endpoint: Available Years ==========
@app.route('/api/years')
def available_years():
    """Returns available years for the embedding dataset."""
    return jsonify({
        'years': list(range(2017, 2025)),
        'default': 2023
    })


# ========== Endpoint: Band Info ==========
@app.route('/api/bands')
def band_info():
    """Returns info about available embedding bands."""
    bands = [f'A{i:02d}' for i in range(64)]
    # Suggest good default RGB combos
    presets = {
        'Default RGB': 'A01,A16,A09',
        'Vegetation Focus': 'A00,A03,A07',
        'Urban Detection': 'A02,A10,A20',
        'Water Bodies': 'A05,A15,A30',
        'Change Sensitive': 'A01,A08,A32',
    }
    return jsonify({
        'bands': bands,
        'totalBands': 64,
        'presets': presets
    })


# ========== Run ==========
if __name__ == '__main__':
    print('🌍 GEE Tile Proxy starting on port 3013...')
    print(f'   Service account: {creds_data["client_email"]}')
    print(f'   Project: {creds_data["project_id"]}')
    app.run(host='0.0.0.0', port=3013, debug=False, threaded=True)
