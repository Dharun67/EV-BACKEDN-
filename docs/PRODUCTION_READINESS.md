# GridWise Production Readiness Guide

This document defines the configuration and operational readiness required to deploy GridWise into a production environment.

## 1. Environment Configuration
To run GridWise in production, the `.env` configuration files MUST be configured correctly across all 3 services (Frontend, Backend, ML Service).

- **Backend:** 
  - `NODE_ENV=production` must be set to ensure Express uses optimized caching and error masking.
  - `JWT_SECRET` must be set to a high entropy 256-bit key.
  - `CORS_ORIGIN` must be explicitly set to the Frontend domain.
- **Frontend:**
  - `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_ML_API_URL` must point to the production hostnames.

## 2. Dependencies & Build
- `npm audit` returned 0 vulnerabilities, ensuring clean dependencies.
- Frontend must be compiled using `npm run build` and served via an edge CDN (e.g. Vercel, CloudFront) or a static file server like NGINX.
- Backend must be executed securely without memory leaks using the optimized TS compilation.

## 3. Database Indexes & Caching
- **MongoDB:** All critical queries (such as those filtering by `stationId`, `chargerId`, `status`, and `timestamp`) have standard B-Tree indexes applied directly in Mongoose schema configurations.
- **Redis:** Used efficiently with Lazy Connection configuration. It also holds TTL-based queues for ML caching and WebSockets pub/sub.

## 4. Graceful Shutdown
The Node backend supports `SIGTERM` and `SIGINT`. Upon receiving these signals:
1. The HTTP Express server ceases accepting new connections.
2. Existing requests are given a brief window to complete.
3. MongoDB connections are explicitly terminated.
4. Redis connections are explicitly closed.
5. The application exits safely. (Fallback forced exit occurs after 10s if dangling connections persist).

## 5. Endpoints
The platform exposes production status probes:
- `/api/health`: Provides a simple 200 OK + MongoDB status response for standard Load Balancers.
- `/api/ready`: A deep-probe for orchestration platforms to verify both MongoDB and Redis are actively connected.
