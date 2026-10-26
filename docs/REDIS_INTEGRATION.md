# Redis Cloud Integration for GridWise

GridWise uses **Redis Cloud** as an extremely fast, ephemeral data store to manage temporary live state, caching, queueing, and distributed locks. It operates strictly alongside our permanent data store, **MongoDB**.

> [!CAUTION]
> **Architecture Rule:** MongoDB is the **permanent** source of record. Redis is **only** for fast, temporary, or live state. Do not duplicate the entire MongoDB database into Redis.

## Configuration & Environment Variables

The backend requires the following environment variables to securely connect to your Redis Cloud instance. These must be stored in the `.env` file and **never committed**.

- `REDIS_URL`: The full connection string for your Redis instance (e.g., `redis://default:password@host:port`).
- `REDIS_DEFAULT_TTL_SECONDS`: Fallback TTL (default 300).
- `REDIS_ROUTE_CACHE_TTL_SECONDS`: TTL for OSRM routes (default 300).
- `REDIS_STATION_CACHE_TTL_SECONDS`: TTL for Open Charge Map nearby stations (default 300).
- `REDIS_WAIT_TIME_CACHE_TTL_SECONDS`: TTL for ML queue predictions (default 60).
- `REDIS_BOOKING_LOCK_TTL_SECONDS`: TTL for concurrency booking locks (default 30).

> [!WARNING]
> Never expose `REDIS_URL` to the React frontend. It must remain securely on the Node.js backend.

## Redis Cache Service

We've centralized Redis interactions through a reusable `redisCacheService.ts` module. This provides standard typed `get`, `set`, `delete`, and `exists` operations, and gracefully catches errors so that a temporary Redis failure won't permanently crash the Node application.

## Core Features Using Redis

### 1. Caching

We cache frequently requested external API data:
- **OSRM Routes:** (`osrm:route:{fromLat},{fromLng}:{toLat},{toLng}`)
- **Open Charge Map:** (`ocm:stations:{lat}:{lng}:{radius}`)

### 2. Distributed Booking Locks

When a user attempts to book a charging slot, we place a distributed lock on that slot using `redisCacheService.set(..., true)` which utilizes Redis's atomic `NX` (Not Exists) operator.

Lock format: `gridwise:booking-lock:{stationId}:{chargerId}:{slot}`

If a lock is already active, the user's booking attempt is gracefully rejected with a concurrency warning, preventing overlapping appointments before we even hit MongoDB.

### 3. Real-Time Queues

Redis Sorted Sets are used to track live queues for drive-up chargers:
- **Queue Key:** `queue:{stationId}`
- **Operations:** We use `ZADD`, `ZREM`, `ZSCORE`, and `ZCARD` to immediately track users entering/leaving the queue and determining their live rank position.

## Failure Handling

If Redis becomes temporarily unavailable:
- Real-time queuing features will gracefully throw errors notifying the user that real-time features are degraded.
- Standard MongoDB bookings and features will continue to operate normally.
- The `redisCacheService` will fail-open (returning `null`) allowing external APIs to process requests directly if needed.

## Testing

The backend includes a health check at `/ready` that reports the status of both MongoDB and Redis independently. 

```json
{
  "success": true,
  "message": "GridWise API is fully ready",
  "mongodb": "connected",
  "redis": "connected"
}
```
