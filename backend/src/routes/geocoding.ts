import { Router, Request, Response, NextFunction } from 'express';
import { forwardGeocode, reverseGeocode } from '../services/geocodingService';

const router = Router();

router.get('/search', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
      return;
    }

    const results = await forwardGeocode(query);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Error in forward geocoding route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to perform geocoding search'
    });
  }
});

router.get('/reverse', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : NaN;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : NaN;
    
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        message: 'Valid "lat" and "lng" parameters are required'
      });
      return;
    }

    const result = await reverseGeocode(lat, lng);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error in reverse geocoding route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to perform reverse geocoding'
    });
  }
});

export default router;
