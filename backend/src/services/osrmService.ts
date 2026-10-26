import axios from 'axios';
import { redisCacheService } from './redisCacheService';

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const USER_AGENT = 'GridWise-EV-Mobility/1.0';
const CACHE_TTL = 86400; // 24 hours in seconds

export interface RouteOptions {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

const validateCoordinates = (lat: number, lng: number): void => {
  if (isNaN(lat) || isNaN(lng)) throw new Error('Coordinates must be valid numbers');
  if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
  if (lng < -180 || lng > 180) throw new Error('Longitude must be between -180 and 180');
};

export const getRoute = async ({ fromLat, fromLng, toLat, toLng }: RouteOptions) => {
  validateCoordinates(fromLat, fromLng);
  validateCoordinates(toLat, toLng);

  const cacheKey = `osrm:route:${fromLat},${fromLng}:${toLat},${toLng}`;

  try {
    const cached = await redisCacheService.get(cacheKey);
    if (cached) {
      console.log(`[OSRM] Serving route from cache: ${cacheKey}`);
      return cached;
    }
  } catch (err) {
    console.warn('[OSRM] Redis cache read failed:', err);
  }

  console.log(`[OSRM] Fetching route from API: ${cacheKey}`);
  try {
    // Note: OSRM uses {lng},{lat} order!
    const coordinates = `${fromLng},${fromLat};${toLng},${toLat}`;
    const response = await axios.get(`${OSRM_BASE_URL}/route/v1/driving/${coordinates}`, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: 'true',
        alternatives: 'true'
      },
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 10000
    });

    if (response.data.code !== 'Ok') {
      throw new Error(`OSRM API Error: ${response.data.code}`);
    }

    const route = response.data.routes[0];
    
    const result = {
      success: true,
      distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
      durationMinutes: Math.ceil(route.duration / 60),
      routes: response.data.routes,
      geometry: route.geometry,
      waypoints: response.data.waypoints
    };

    const ttl = process.env.REDIS_ROUTE_CACHE_TTL_SECONDS ? parseInt(process.env.REDIS_ROUTE_CACHE_TTL_SECONDS, 10) : CACHE_TTL;
    await redisCacheService.set(cacheKey, result, ttl);

    return result;
  } catch (error: any) {
    console.error('[OSRM] Route request failed:', error.message);
    throw new Error('Failed to fetch route from OSRM API: ' + error.message);
  }
};

export const getNearest = async (lat: number, lng: number) => {
  validateCoordinates(lat, lng);
  const cacheKey = `osrm:nearest:${lat},${lng}`;

  try {
    const cached = await redisCacheService.get(cacheKey);
    if (cached) return cached;
  } catch (err) {}

  try {
    const response = await axios.get(`${OSRM_BASE_URL}/nearest/v1/driving/${lng},${lat}`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    if (response.data.code !== 'Ok') {
      throw new Error(`OSRM API Error: ${response.data.code}`);
    }

    const ttl = process.env.REDIS_ROUTE_CACHE_TTL_SECONDS ? parseInt(process.env.REDIS_ROUTE_CACHE_TTL_SECONDS, 10) : CACHE_TTL;
    await redisCacheService.set(cacheKey, response.data, ttl);

    return response.data;
  } catch (error: any) {
    console.error('[OSRM] Nearest request failed:', error.message);
    throw new Error('Failed to fetch nearest point from OSRM API');
  }
};

export const getTable = async (coordinatesString: string) => {
  // coordinatesString should be in format "lng1,lat1;lng2,lat2;..."
  const cacheKey = `osrm:table:${coordinatesString}`;

  try {
    const cached = await redisCacheService.get(cacheKey);
    if (cached) return cached;
  } catch (err) {}

  try {
    const response = await axios.get(`${OSRM_BASE_URL}/table/v1/driving/${coordinatesString}`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000
    });

    if (response.data.code !== 'Ok') {
      throw new Error(`OSRM API Error: ${response.data.code}`);
    }

    const ttl = process.env.REDIS_ROUTE_CACHE_TTL_SECONDS ? parseInt(process.env.REDIS_ROUTE_CACHE_TTL_SECONDS, 10) : CACHE_TTL;
    await redisCacheService.set(cacheKey, response.data, ttl);

    return response.data;
  } catch (error: any) {
    console.error('[OSRM] Table request failed:', error.message);
    throw new Error('Failed to fetch distance table from OSRM API');
  }
};
