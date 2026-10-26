# Complete Workflow Audit

This document traces the entire data lifecycle in the GridWise EV Mobility application from user interaction down to the persistence layer.

## 1. Authentication Workflow
- **Frontend**: The user authenticates using Firebase Auth UI in `AuthContext.tsx`. The Firebase JWT is obtained.
- **API Boundary**: The JWT is attached to the `Authorization: Bearer <token>` header of every API request via `utils/api.ts`.
- **Backend Middleware**: `authMiddleware.ts` intercepts the request, decodes the JWT using `firebase-admin`, extracts the Firebase UID, and queries the MongoDB `User` collection.
- **Rejection/Acceptance**: If the token is missing, expired, or the user does not exist in MongoDB, a 401 Unauthorized is returned.

## 2. Real-Time Queue Workflow
- **User Joining**: The user clicks "Join Queue". `QueueAnalysis.tsx` fetches the real user's `vehicleId` and posts to `/api/queue/join`.
- **Deduplication**: `queueService.ts` checks the MongoDB `QueueEntry` collection. If the user is already waiting at this station, it skips adding them again. If not, a new `QueueEntry` is created and saved.
- **Sorted Set**: The `vehicleId` is added to a Redis Sorted Set (`zadd queue:<stationId>`) with a timestamp score.
- **ML Integration**: The queue length is queried. If cached waiting time is expired, `mlService.ts` makes an HTTP call to the FastAPI ML service for a real prediction. The response is cached in Redis with a TTL.
- **Event Dispatch**: `queueService.ts` emits Socket.IO events (`queue:joined`, `queue:updated`) to the frontend and publishes a persistent `queue.joined` event to RabbitMQ for data warehousing.

## 3. Booking Workflow
- **Initiation**: User selects a charger and time slot in `BookingModal.tsx`.
- **Feasibility Check**: `bookingService.ts` validates the queue congestion and station status (`ONLINE` vs `OFFLINE`). If heavily congested or offline, alternative nearby stations are suggested.
- **Lock Acquisition**: A Redis distributed lock (`redisCacheService.set`) is attempted for the specific `station:charger:timeslot`.
- **Collision Check**: If the lock is acquired, MongoDB is queried for any existing `CONFIRMED` bookings overlapping that time.
- **Persistence**: If clear, the `Booking` document is saved to MongoDB.
- **Eventing**: A `booking.created` event is published to RabbitMQ.

## 4. External Data Fetching (OSRM Routing)
- **Initiation**: `RouteMap.tsx` queries the `/api/routing/route` endpoint.
- **Cache Check**: `osrmService.ts` checks Redis for cached geometries to save bandwidth.
- **Strict API Call**: If missing, an HTTP call is made to the real OSRM engine. 
- **Failure Fallback**: If the real OSRM engine times out or returns a 500, a strict error is bubbled up to the frontend UI. Mock data is NO LONGER USED.
