import { Router, Request, Response, NextFunction } from 'express';
import Station from '../models/Station';

const router = Router();

router.get('/nearby', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
    const distanceKm = req.query.distance ? parseFloat(req.query.distance as string) : 10;
    
    if (isNaN(lat) || isNaN(lng) || isNaN(distanceKm)) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters. lat, lng, and distance must be numbers.'
      });
      return;
    }

    const stations = await Station.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: distanceKm * 1000 // Convert km to meters
        }
      }
    }).limit(20);

    res.status(200).json({
      success: true,
      data: stations.map(st => ({
        id: st.stationId,
        name: st.name,
        lat: st.location.coordinates[1],
        lng: st.location.coordinates[0],
        maxPowerKw: st.powerCapacityKw,
        status: st.status
      }))
    });
  } catch (error: any) {
    console.error('Error fetching nearby charging stations from DB:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch charging stations'
    });
  }
});

export default router;
