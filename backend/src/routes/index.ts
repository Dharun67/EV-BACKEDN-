import { Router } from 'express';
import mongoose from 'mongoose';

// Import models to get counts
import redisClient from '../config/redis';
import User from '../models/User';
import Station from '../models/Station';
import Charger from '../models/Charger';
import ChargingSession from '../models/ChargingSession';
import Vehicle from '../models/Vehicle';
import Maintenance from '../models/Maintenance';
import DemandData from '../models/DemandData';
import Recommendation from '../models/Recommendation';

import stationRoutes from './stations';
import chargerRoutes from './chargers';
import sessionRoutes from './sessions';
import demandRoutes from './demand';
import vehicleRoutes from './vehicles';
import fleetRoutes from './fleet';
import revenueRoutes from './revenue';
import maintenanceRoutes from './maintenance';
import infrastructureRoutes from './infrastructure';
import dashboardRoutes from './dashboard';
import cpoRoutes from './cpo';
import aiInsightsRoutes from './aiInsights';
import analyticsRoutes from './analytics';
import recommendationRoutes from './recommendations';
import usersRoutes from './users';
import paymentsRoutes from './payments';
import predictionRoutes from './predictionRoutes';
import queueRoutes from './queueRoutes';
import bookingRoutes from './bookingRoutes';
import incidentRoutes from './incidentRoutes';
import decisionRoutes from './decisionRoutes';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import notificationRoutes from './notificationRoutes';

import chargingStationsRoutes from './chargingStations';
import geocodingRoutes from './geocoding';
import routingRoutes from './routingRoutes';
import tripsRoutes from './trips';
import aiRoutes from './aiRoutes';
import rescueRoutes from './rescueRoutes';

import { rabbitMQService } from '../config/rabbitmq';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const isRedisConnected = redisClient.status === 'ready';
  const isRabbitMQConnected = rabbitMQService.status === 'ready';
  
  if (!isConnected) {
    res.status(503).json({
      success: false,
      message: 'Database is disconnected',
      mongodb: 'disconnected',
      redis: isRedisConnected ? 'connected' : 'disconnected',
      rabbitmq: isRabbitMQConnected ? 'connected' : 'disconnected'
    });
    return;
  }

  res.json({
    success: true,
    message: 'GridWise API is running',
    mongodb: 'connected',
    redis: isRedisConnected ? 'connected' : 'disconnected',
    rabbitmq: isRabbitMQConnected ? 'connected' : 'disconnected'
  });
});

router.get('/ready', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const isRedisConnected = redisClient.status === 'ready';
  const isRabbitMQConnected = rabbitMQService.status === 'ready';

  if (!isConnected) {
    res.status(503).json({
      success: false,
      message: 'GridWise API is not ready',
      mongodb: 'disconnected',
      redis: isRedisConnected ? 'connected' : 'disconnected',
      rabbitmq: isRabbitMQConnected ? 'connected' : 'disconnected'
    });
    return;
  }

  res.json({
    success: true,
    message: 'GridWise API is fully ready',
    mongodb: 'connected',
    redis: isRedisConnected ? 'connected' : 'disconnected',
    rabbitmq: isRabbitMQConnected ? 'connected' : 'disconnected'
  });
});

router.get('/stats/database', async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      stations: await Station.countDocuments(),
      chargers: await Charger.countDocuments(),
      sessions: await ChargingSession.countDocuments(),
      vehicles: await Vehicle.countDocuments(),
      maintenance: await Maintenance.countDocuments(),
      demandRecords: await DemandData.countDocuments(),
      recommendations: await Recommendation.countDocuments()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics'
    });
  }
});

router.use('/auth', authRoutes);
router.use('/stations', stationRoutes);
router.use('/charging-stations', chargingStationsRoutes);
router.use('/geocoding', geocodingRoutes);
router.use('/routing', routingRoutes);
router.use('/chargers', chargerRoutes);
router.use('/charging-sessions', sessionRoutes);
router.use('/demand', demandRoutes);
router.use('/vehicles', authenticate, vehicleRoutes);
router.use('/trips', tripsRoutes);
router.use('/ai', aiRoutes);
router.use('/rescue', rescueRoutes);

// ADMIN Protected Routes
const adminMiddleware = [authenticate, requireRole('ADMIN')];

router.use('/fleet', adminMiddleware, fleetRoutes);
router.use('/revenue', adminMiddleware, revenueRoutes);
router.use('/maintenance', adminMiddleware, maintenanceRoutes);
router.use('/infrastructure', adminMiddleware, infrastructureRoutes);
router.use('/cpo', adminMiddleware, cpoRoutes);
router.use('/ai-insights', adminMiddleware, aiInsightsRoutes);
router.use('/analytics', adminMiddleware, analyticsRoutes);
router.use('/users', adminMiddleware, usersRoutes);
router.use('/admin', adminMiddleware, adminRoutes);

// Shared or Custom Authenticated Routes
router.use('/dashboard', dashboardRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/payments', paymentsRoutes);
router.use('/predictions', predictionRoutes);
router.use('/predict', predictionRoutes);
router.use('/queue', queueRoutes);
router.use('/bookings', bookingRoutes);
router.use('/incidents', incidentRoutes);
router.use('/decision', decisionRoutes);
router.use('/notifications', notificationRoutes);

export default router;
