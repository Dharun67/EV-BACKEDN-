import axios from 'axios';
import redisClient from '../config/redis';

const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'GridWise-EV-Mobility/1.0';
const CACHE_TTL = 86400; // 24 hours in seconds

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export const forwardGeocode = async (query: string): Promise<GeocodeResult[]> => {
  if (!query) throw new Error('Query is required for forward geocoding');

  const cacheKey = `geocode:fwd:${query.toLowerCase().replace(/\s+/g, '')}`;

  try {
    if (redisClient.status === 'ready') {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[Nominatim] Serving forward geocode for "${query}" from cache`);
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    console.warn('[Nominatim] Redis cache read failed:', err);
  }

  console.log(`[Nominatim] Fetching forward geocode for "${query}"`);
  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: query,
        format: 'json',
        limit: 5
      },
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 15000
    });

    const results: GeocodeResult[] = response.data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name
    }));

    try {
      if (redisClient.status === 'ready') {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
      }
    } catch (err) {
      console.warn('[Nominatim] Redis cache write failed:', err);
    }

    return results;
  } catch (error: any) {
    console.error('[Nominatim] Forward geocoding failed:', error.message);
    throw new Error('Failed to fetch from Nominatim API');
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult> => {
  if (isNaN(lat) || isNaN(lng)) throw new Error('Valid lat and lng are required for reverse geocoding');

  // Round coordinates to 4 decimal places (~11 meters) for cache binning
  const roundCoord = (coord: number) => Math.round(coord * 10000) / 10000;
  const cacheKey = `geocode:rev:${roundCoord(lat)}:${roundCoord(lng)}`;

  try {
    if (redisClient.status === 'ready') {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[Nominatim] Serving reverse geocode for ${lat},${lng} from cache`);
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    console.warn('[Nominatim] Redis cache read failed:', err);
  }

  console.log(`[Nominatim] Fetching reverse geocode for ${lat},${lng}`);
  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        lat,
        lon: lng,
        format: 'json'
      },
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 15000
    });

    const item = response.data;
    if (item.error) {
       throw new Error(item.error);
    }

    const result: GeocodeResult = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name
    };

    try {
      if (redisClient.status === 'ready') {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      }
    } catch (err) {
      console.warn('[Nominatim] Redis cache write failed:', err);
    }

    return result;
  } catch (error: any) {
    console.error('[Nominatim] Reverse geocoding failed:', error.message);
    throw new Error('Failed to fetch from Nominatim API');
  }
};
