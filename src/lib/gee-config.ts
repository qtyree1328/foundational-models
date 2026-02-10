/**
 * Shared GEE Proxy Configuration
 * 
 * Uses Cloud Run GEE proxy for all environments.
 * Always available, works from anywhere.
 */

// Cloud Run GEE proxy - always use this
const GEE_BASE = 'https://gee-proxy-787413290356.us-east1.run.app'

/**
 * Get the GEE proxy base URL
 */
export function getGeeProxyUrl(): string {
  return GEE_BASE
}

/**
 * Check if the GEE proxy is available
 */
export async function checkGeeProxyHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getGeeProxyUrl()}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * GEE Proxy endpoints
 */
export const GeeEndpoints = {
  health: () => `${getGeeProxyUrl()}/api/health`,
  tilesOptical: (year: string, bbox: string) => 
    `${getGeeProxyUrl()}/api/tiles/optical?year=${year}&bbox=${bbox}`,
  tilesLandsat: (year: string, bbox: string) => 
    `${getGeeProxyUrl()}/api/tiles/landsat?year=${year}&bbox=${bbox}`,
  tilesEmbeddings: (year: string, bands: string, min: number, max: number) =>
    `${getGeeProxyUrl()}/api/tiles/embeddings?year=${year}&bands=${bands}&min=${min}&max=${max}`,
  tilesClustering: (year: string, nClusters: number) =>
    `${getGeeProxyUrl()}/api/tiles/clustering?year=${year}&n_clusters=${nClusters}`,
  tilesChange: (year1: string, year2: string, bands: string) =>
    `${getGeeProxyUrl()}/api/tiles/change?year1=${year1}&year2=${year2}&bands=${bands}`,
  sample: (year: string, bbox: string, numPoints: number) =>
    `${getGeeProxyUrl()}/api/sample?year=${year}&bbox=${bbox}&numPoints=${numPoints}`,
  pointInfo: (lat: number, lng: number, year: string) =>
    `${getGeeProxyUrl()}/api/info?lat=${lat}&lng=${lng}&year=${year}`,
}
