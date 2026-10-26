import { Router } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Python ML Server URL
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

router.post('/recommend', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${ML_URL}/recommend`, req.body);
    res.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('ML Recommendation Error:', error.message);
    res.status(503).json({ success: false, message: 'AI Recommendation service is currently unavailable.' });
  }
});

router.post('/predict-wait', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${ML_URL}/predict-wait`, req.body);
    res.json({ success: true, data: response.data });
  } catch (error: any) {
    res.status(503).json({ success: false, message: 'AI Wait prediction service is currently unavailable.' });
  }
});

router.post('/trip-plan', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${ML_URL}/trip-plan`, req.body);
    res.json({ success: true, data: response.data });
  } catch (error: any) {
    res.status(503).json({ success: false, message: 'AI Trip Planning service is currently unavailable.' });
  }
});

export default router;
