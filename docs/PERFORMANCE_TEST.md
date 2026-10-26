# Performance Testing Results

## 1. Node.js Backend Latency

| Endpoint | Average Latency | Context |
|----------|-----------------|---------|
| `GET /api/stations` | ~780ms | Pulls active stations from MongoDB and calculates status. |
| `GET /api/queue/:id` | ~12ms | Highly optimized, direct read from Redis sorted sets. |
| `POST /api/bookings` | ~140ms | Involves ranking algorithm and ML predictions (if cached). |
| `GET /api/incidents` | ~85ms | Standard MongoDB aggregated fetch. |

## 2. ML Prediction Latency (FastAPI)

| Endpoint | Average Latency | Context |
|----------|-----------------|---------|
| `POST /predict/demand` | ~110ms | Real-time `XGBoost` pipeline scaling and inference. |
| `POST /predict/queue` | ~80ms | Scikit-learn random forest regressor output. |
| `POST /predict/maintenance` | ~60ms | Fast static metadata rules + statistical lookup. |

## 3. Real-time / Socket.IO Metrics

| Event | Delivery Time | Protocol |
|-------|---------------|----------|
| `queue:updated` | < 10ms | Websocket (Pub/Sub) |
| `incident:user-reroute` | < 15ms | Websocket + Redis BullMQ worker |
| `decision:executed` | < 25ms | Admin approval roundtrip |

*Measurements taken via native Windows powershell timings and internal middleware timers.*
