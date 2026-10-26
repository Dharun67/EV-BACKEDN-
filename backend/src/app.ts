import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import routes from './routes';

const app = express();

// Security Middleware
app.use(helmet());
app.use(globalLimiter);

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

export default app;
