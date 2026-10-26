# OSRM Integration for GridWise

GridWise leverages the official [Open Source Routing Machine (OSRM)](http://project-osrm.org/) API to provide realistic routing capabilities without needing a commercial API key. This document details our integration strategy, architecture, and API endpoints.

## Purpose

OSRM is used across the GridWise platform to calculate:
- **Routes to Charging Stations:** Finding the best path, driving time, and exact road geometry between the user and EV stations.
- **Distance Tables:** Comparing multiple stations to find the legitimately closest one, not just as-the-crow-flies distance.
- **Nearest Roads:** Snapping user GPS locations to the nearest valid road geometry.

## Architecture & Policy Compliance

To comply with OSRM's public API usage policies:
1. **Never Call Directly from Frontend:** The React frontend must never call `router.project-osrm.org` directly. Doing so exposes us to CORS issues and breaks usage policies.
2. **Backend Proxy:** All requests are routed through our Node.js backend proxy.
3. **User-Agent Header:** The backend injects a strict `User-Agent: GridWise-EV-Mobility/1.0` to identify our application to the OSRM administrators.
4. **Redis Caching:** We heavily cache routing requests using a 24-hour TTL in Redis. Since physical roads do not change often, this drastically cuts down on API requests.

## Environment Variables

- `OSRM_BASE_URL` (Required): Should be set to `https://router.project-osrm.org`. This must exist in the backend `.env`.

> [!WARNING]
> Do NOT expose `OSRM_BASE_URL` to the frontend via Vite variables.

## Endpoints

All routing functions are exposed at `GET /api/routing/...`.

### 1. Get Route
Calculates a route between two points.

`GET /api/routing/route?fromLat={lat}&fromLng={lng}&toLat={lat}&toLng={lng}`

**Example:**
`GET /api/routing/route?fromLat=13.0827&fromLng=80.2707&toLat=13.0475&toLng=80.2209`

**Response:**
Returns GeoJSON geometry, duration in minutes, distance in kilometers, and turn-by-turn steps.

> [!IMPORTANT]
> **Coordinate Order Notice:** Internally, the OSRM API expects `longitude,latitude`. Our backend proxy handles this conversion automatically. Your frontend requests should always pass `lat` and `lng` as named query parameters to prevent confusion!

### 2. Get Nearest
Finds the nearest road to a given coordinate.

`GET /api/routing/nearest?lat={lat}&lng={lng}`

### 3. Get Distance Table
Calculates a matrix of travel times between multiple coordinates.

`GET /api/routing/table?coordinates={lng1},{lat1};{lng2},{lat2}`

> Note: The table endpoint expects coordinates as a semicolon-separated string of `lng,lat` pairs.

## Error Handling

The backend implements automatic input validation (checking that latitude falls between -90 and 90, etc.). If the OSRM API goes down, the backend will gracefully timeout after 10-15 seconds and return a `500` error to the frontend.

## Testing

You can verify the backend is successfully proxying requests and that Redis is caching them by running:
```bash
curl -s 'http://localhost:5000/api/routing/route?fromLat=13.0827&fromLng=80.2707&toLat=13.0475&toLng=80.2209'
```
