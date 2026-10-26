# GridWise Backend API Documentation

This document outlines the REST APIs created in Step 23, fully integrated with real MongoDB data.

All API responses follow a standardized format.

## Standard Responses

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated List
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 1. Stations API

**GET /api/stations**
- Purpose: Retrieve all stations with pagination, filtering, and sorting.
- Query Params: `page`, `limit`, `sort`, `order`, `zone`, `status`, `chargerType`, `minPower`

**GET /api/stations/search?q=value**
- Purpose: Search stations by name, address, or city.

**GET /api/stations/:id**
- Purpose: Get a single station by its `station_id`.

**GET /api/stations/:id/chargers**
- Purpose: Get all chargers for a specific station.

**GET /api/stations/:id/sessions**
- Purpose: Get all charging sessions for a specific station (paginated).

**GET /api/stations/:id/statistics**
- Purpose: Get aggregated usage statistics for a specific station.

---

## 2. Chargers API

**GET /api/chargers**
- Purpose: Retrieve chargers (paginated).
- Query Params: `status`, `type`, `stationId`

**GET /api/chargers/statistics**
- Purpose: Get global aggregated charger statuses (Total, Available, Occupied, Fault, Offline).

---

## 3. Charging Sessions API

**GET /api/charging-sessions**
- Purpose: Retrieve charging sessions (paginated).
- Query Params: `startDate`, `endDate`, `range` (e.g., '30d', '7d'), `stationId`, `vehicleId`

**GET /api/charging-sessions/statistics**
- Purpose: Get global aggregation (Total sessions, Energy delivered, Avg Duration, Avg Cost).

---

## 4. Demand API

**GET /api/demand**
- Purpose: Retrieve traffic demand data.

**GET /api/demand/summary**
- Purpose: Get network-wide demand averages and peaks.

**GET /api/demand/peak**
- Purpose: Retrieve the top 10 highest demand points historically.

**GET /api/demand/trend**
- Purpose: Get demand trends aggregated by day.

---

## 5. Revenue API

**GET /api/revenue/summary**
- Purpose: Calculate total network revenue directly from MongoDB session costs.

**GET /api/revenue/trend**
- Purpose: Get daily revenue aggregated over time.

**GET /api/revenue/by-station**
- Purpose: Get revenue segmented by station.

---

## 6. Dashboard APIs

**GET /api/dashboard/overview**
- Purpose: Combine metrics from multiple collections (Stations, Sessions, Chargers) into one unified payload.

**GET /api/cpo/overview**
- Purpose: Operator-specific overview metrics.

---

## 7. Vehicles & Fleet API

**GET /api/vehicles**
- Purpose: Get paginated vehicles.
- Query Params: `search`, `fleetId`

**GET /api/fleet/statistics**
- Purpose: Retrieve high-level fleet aggregation (Total, Active, Charging).

---

## 8. Maintenance API

**GET /api/maintenance**
- Purpose: Retrieve maintenance tickets.

**GET /api/maintenance/statistics**
- Purpose: Aggregation of open vs completed tasks.

---

## 9. AI Insights & Recommendations API

**GET /api/recommendations/top**
- Purpose: Rule-based recommendation of optimal new station locations based on demand scores.

**GET /api/ai-insights**
- Purpose: Generates real-time rule-based insights (e.g., if utilization > 85%, triggers High Demand alert). *Not ML yet.*

---

## Query Parsers
- `page`: default 1
- `limit`: default 20 (max 100)
- `sort`: default varies by controller (e.g., `-start_time`)
- `range`: supports `today`, `7d`, `30d`, `90d`, `6m`, `1y`
