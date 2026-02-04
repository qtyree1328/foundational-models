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


# ========== Run ==========
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f'🌍 GEE Tile Proxy starting on port {port}...')
    print(f'   Service account: {creds_data["client_email"]}')
    print(f'   Project: {creds_data["project_id"]}')
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
