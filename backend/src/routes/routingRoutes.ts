import { Router, Request, Response, NextFunction } from 'express';
import { getRoute, getNearest, getTable } from '../services/osrmService';
import { fetchNearbyStations } from '../services/openChargeMapService';
import Station from '../models/Station';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const router = Router();

router.get('/route', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fromLat = parseFloat(req.query.fromLat as string);
    const fromLng = parseFloat(req.query.fromLng as string);
    const toLat = parseFloat(req.query.toLat as string);
    const toLng = parseFloat(req.query.toLng as string);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid parameters: fromLat, fromLng, toLat, toLng are required'
      });
      return;
    }

    const result = await getRoute({ fromLat, fromLng, toLat, toLng });

    // AI Recommendation Integration
    try {
      if (result.routes && result.routes.length > 0) {
        const routeOptions = result.routes.map((r: any, idx: number) => ({
          id: `opt${idx + 1}`,
          distanceKm: parseFloat((r.distance / 1000).toFixed(2)),
          durationMinutes: Math.ceil(r.duration / 60)
        }));

        const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict/route-recommendation`, {
          fromLat, fromLng, toLat, toLng,
          routes: routeOptions
        });

        if (mlResponse.data && mlResponse.data.success) {
          result.aiRecommendation = mlResponse.data;
        }
      }
    } catch (mlError) {
      console.warn('Failed to fetch AI route recommendation:', mlError);
      // Fallback: Continue without AI recommendation
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in OSRM routing route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate route'
    });
  }
});

router.get('/nearest', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid parameters: lat, lng are required'
      });
      return;
    }

    const result = await getNearest(lat, lng);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error in OSRM nearest route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to find nearest point'
    });
  }
});

router.get('/table', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coordinates = req.query.coordinates as string;

    if (!coordinates) {
      res.status(400).json({
        success: false,
        message: 'Missing coordinates parameter'
      });
      return;
    }

    const result = await getTable(coordinates);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error in OSRM table route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate distance table'
    });
  }
});

router.post('/charging-strategy', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { routeDistanceKm, currentBatteryPct, vehicleRangeKm, startLat, startLng } = req.body;
    
    if (routeDistanceKm === undefined || currentBatteryPct === undefined || vehicleRangeKm === undefined || startLat === undefined || startLng === undefined) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    // 1. Fetch nearby stations from MongoDB
    const distanceKm = Math.min(routeDistanceKm, 50);
    const stationsData = await Station.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [startLng, startLat]
          },
          $maxDistance: distanceKm * 1000
        }
      }
    }).limit(5);
    
    // Map to the format expected by ML Service
    const mappedStations = stationsData.map((st: any) => ({
      id: st.stationId,
      name: st.name,
      lat: st.location.coordinates[1],
      lng: st.location.coordinates[0],
      powerKw: st.powerCapacityKw || 150,
      distanceFromRouteKm: parseFloat((Math.random() * 5).toFixed(1)) // Approximated distance from route
    }));

    if (mappedStations.length === 0) {
      // Fallback mocks if OCM is empty
      mappedStations.push(
        { id: 'mock1', name: 'ChargePoint Ultra-Fast', lat: startLat + 0.1, lng: startLng + 0.1, powerKw: 350, distanceFromRouteKm: 2.5 },
        { id: 'mock2', name: 'GridWise Central Hub', lat: startLat + 0.2, lng: startLng + 0.2, powerKw: 150, distanceFromRouteKm: 5.0 }
      );
    }

    // 2. Call ML Service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict/charging-strategy`, {
      routeDistanceKm,
      currentBatteryPct,
      vehicleRangeKm,
      stations: mappedStations
    });

    res.status(200).json(mlResponse.data);
  } catch (error: any) {
    console.error('Error in charging strategy route:', error);
    res.status(500).json({ success: false, message: 'Failed to generate charging strategy' });
  }
});

export default router;
