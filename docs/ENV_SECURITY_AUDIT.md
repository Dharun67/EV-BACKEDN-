# GridWise Environment & Security Audit

This document identifies all environment variables, `.env` files, and potential hardcoded secrets in the repository.

## Environment Files Discovered
- `backend/.env`
- `backend/.env.example`
- `frontend/.env`
- `frontend/.env.example`
- `ml-service/.env.example`

## Environment Variables Used
Found the following variables defined in `.env` files:
- `API_PORT`
- `CORS_ORIGIN`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_PROJECT_ID`
- `FRONTEND_URL`
- `JWT_EXPIRES_IN`
- `JWT_SECRET`
- `ML_SERVICE_URL`
- `MODEL_PATH`
- `MONGODB_URI`
- `NODE_ENV`
- `NOMINATIM_BASE_URL`
- `OPENCHARGEMAP_API_KEY`
- `OSRM_BASE_URL`
- `PORT`
- `RABBITMQ_URL`
- `REDIS_BOOKING_LOCK_TTL_SECONDS`
- `REDIS_DEFAULT_TTL_SECONDS`
- `REDIS_ROUTE_CACHE_TTL_SECONDS`
- `REDIS_STATION_CACHE_TTL_SECONDS`
- `REDIS_URL`
- `REDIS_WAIT_TIME_CACHE_TTL_SECONDS`
- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_VAPID_KEY`
- `VITE_SOCKET_URL`

## Security Audit (Hardcoded Secrets)
No hardcoded secrets found.