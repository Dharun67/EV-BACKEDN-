import axios from 'axios';
import { redisCacheService } from './redisCacheService';

const OCM_API_URL = 'https://api.openchargemap.io/v3/poi';
const CACHE_TTL = 300; // 5 minutes in seconds

export interface OCMStation {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  status: string;
  distance: number;
  chargingType: string;
  power: number;
  pricePerKwh: number;
  rating: number;
  connectors: string[];
  amenities: string[];
  operator: string;
}

export const fetchNearbyStations = async (
  lat: number,
  lng: number,
  distance: number = 10,
  maxResults: number = 50
): Promise<OCMStation[]> => {
  if (!process.env.OPENCHARGEMAP_API_KEY) {
    throw new Error('OPENCHARGEMAP_API_KEY is not defined in environment variables.');
  }

  // Create a cache key using rounded coordinates to improve cache hit rate for very close requests
  // Round to 3 decimal places (~111 meters precision)
  const roundCoord = (coord: number) => Math.round(coord * 1000) / 1000;
  const cacheKey = `ocm:stations:${roundCoord(lat)}:${roundCoord(lng)}:${distance}`;

  try {
    const cachedData = await redisCacheService.get<OCMStation[]>(cacheKey);
    if (cachedData) {
      console.log(`[OCM] Serving ${cacheKey} from cache`);
      return cachedData;
    }
  } catch (error) {
    console.warn('[OCM] Redis cache read failed, falling back to API:', error);
  }

  // 2. Fetch from Open Charge Map API
  console.log(`[OCM] Fetching fresh data from API for ${lat}, ${lng}`);
  
  try {
    const response = await axios.get(OCM_API_URL, {
      params: {
        output: 'json',
        latitude: lat,
        longitude: lng,
        distance,
        distanceunit: 'KM',
        maxresults: maxResults,
        key: process.env.OPENCHARGEMAP_API_KEY
      },
      timeout: 5000 // 5 seconds timeout
    });

    const rawStations = response.data;

    // 3. Map to GridWise expected format
    const mappedStations: OCMStation[] = rawStations.map((station: any) => {
      // Determine max power and types from connections
      let maxPower = 0;
      const connectors = new Set<string>();
      let hasDCFast = false;
      
      if (station.Connections && Array.isArray(station.Connections)) {
        station.Connections.forEach((conn: any) => {
          if (conn.PowerKW && conn.PowerKW > maxPower) {
            maxPower = conn.PowerKW;
          }
          if (conn.LevelID === 3) hasDCFast = true;
          if (conn.ConnectionType && conn.ConnectionType.Title) {
            connectors.add(conn.ConnectionType.Title);
          }
        });
      }

      return {
        id: `ocm-${station.ID}`,
        name: station.AddressInfo?.Title || 'Unknown Station',
        location: station.AddressInfo?.Town || station.AddressInfo?.StateOrProvince || 'Unknown Location',
        coordinates: [station.AddressInfo?.Latitude, station.AddressInfo?.Longitude],
        distance: station.AddressInfo?.Distance || 0,
        status: station.StatusType?.IsOperational === true ? 'Available' : 'In Use',
        chargingType: hasDCFast || maxPower > 50 ? 'DC Fast' : 'AC',
        power: maxPower || 22,
        pricePerKwh: 0.45, // Placeholder as OCM doesn't consistently provide dynamic pricing
        rating: 4.5, // Placeholder
        connectors: Array.from(connectors).length > 0 ? Array.from(connectors) : ['Type 2'],
        amenities: ['WiFi', 'Restroom'], // Generic placeholder amenities
        operator: station.OperatorInfo?.Title || 'Independent'
      };
    });

    const ttl = process.env.REDIS_STATION_CACHE_TTL_SECONDS ? parseInt(process.env.REDIS_STATION_CACHE_TTL_SECONDS, 10) : CACHE_TTL;
    await redisCacheService.set(cacheKey, mappedStations, ttl);

    return mappedStations;

  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.error('[OCM] API request timed out');
      throw new Error('Open Charge Map API request timed out');
    }
    console.error('[OCM] API fetch failed:', error.message);
    throw new Error('Failed to fetch from Open Charge Map API');
  }
};
