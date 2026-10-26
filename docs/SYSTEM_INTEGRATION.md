# GridWise — Complete System Integration

## 1. Architecture Overview
GridWise is built entirely on the Node.js + MongoDB + Redis architecture with a Python FastAPI ML microservice. The frontend strictly uses React + Tailwind. No Docker is used. 

## 2. Data Flow
1. **IoT / Live Data**: Real operational data from chargers flows into the `incidentDetectionService.ts` and `queueService.ts`. 
2. **MongoDB Storage**: System state is persisted across `Stations`, `Chargers`, `Bookings`, and `Incidents`.
3. **Redis Cache & PubSub**: Fast-changing state (Live Queue Lengths, Decision Locks) is managed via `ioredis` in-memory.

## 3. ML Flow
- Node Backend passes context parameters (`stationId`, `current_queue`, `time`) to FastAPI `POST /predict/*`.
- Python utilizes real cleaned `XGBoost` & `scikit-learn` models to return predictions (Queue ETA, Demand, Maintenance Risk).
- Backend caches this output in Redis (5m TTL).

## 4. Real-time Flow
- `Socket.IO` manages `queue:updated`, `charger:statusChanged`, `incident:user-reroute`.
- The React dashboard (`AppLayout`, `IncidentDashboard`, `ActiveBookingMonitor`) listens globally and dynamically updates state without full page reloads.

## 5. Automation & Incident Flow
- **Incident Detection** dedupes charger alerts into MongoDB `Incident` models.
- BullMQ pushes an event to `decisionQueue.ts`.
- **Decision Engine** evaluates Rules against `DecisionContext`.
- If critical, `actionExecutor.ts` triggers Auto-Rebooking or flags for Admin Approval via `Socket.IO`.

## 6. Smart Booking & Rebooking Flow
1. User requests charging spot.
2. `recommendationService.ts` gathers Queue ML ETA + Maintenance Risk + Demand ML.
3. Ranks available stations.
4. If a confirmed booking's station goes OFFLINE, `ActiveBookingMonitor.tsx` detects the Incident and auto-suggests the next best alternative station for a 1-click rebook.

## 7. Security & Limitations
- **Security**: JWT Authentication, Role-based protections, No secrets in Git/`.env.example`.
- **Limitations**: Since we run no IoT edge hardware locally, we mock charger heartbeat faults directly through `postApi`. Real-time Socket scales to ~10k concurrent without Redis adapter clusters, which must be added for heavier production.
