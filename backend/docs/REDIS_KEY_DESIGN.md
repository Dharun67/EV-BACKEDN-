# Redis Key Design

This document details the key structures used in Redis for the real-time queue management system.

## Keys

### 1. Queue (Sorted Set)
- **Key**: `queue:{stationId}`
- **Type**: `ZSET`
- **Member**: `vehicleId`
- **Score**: `timestamp` (Unix epoch in milliseconds)
- **Description**: Maintains the queue order for a station. Vehicles are popped based on the lowest score (oldest timestamp).

### 2. Station Availability (Hash)
- **Key**: `station:{stationId}:availability`
- **Type**: `HASH`
- **Fields**:
  - `totalChargers`
  - `availableChargers`
  - `occupiedChargers`
  - `faultedChargers`
  - `maintenanceChargers`
- **Description**: Stores live availability for quick lookup without hitting MongoDB.

### 3. Charger Status (String)
- **Key**: `charger:{chargerId}:status`
- **Type**: `STRING`
- **Values**: `AVAILABLE`, `OCCUPIED`, `FAULT`, `MAINTENANCE`, `OFFLINE`
- **Description**: Stores live status of individual chargers.

### 4. Active Sessions (String)
- **Key**: `session:{sessionId}:active`
- **Type**: `STRING`
- **Value**: JSON containing metadata.
- **Description**: Tracks active charging sessions in memory for quick reference.

### 5. Active Bookings (String)
- **Key**: `booking:{bookingId}:active`
- **Type**: `STRING`
- **Value**: JSON containing metadata.
- **Description**: Tracks active advanced bookings.

### 6. Queue Prediction Cache (String)
- **Key**: `prediction:{stationId}:queue`
- **Type**: `STRING`
- **Value**: JSON containing `predictedQueue`, `estimatedWaitingTime`, `riskLevel`
- **TTL**: 5 minutes
- **Description**: Caches ML model predictions to prevent overwhelming the Python service.

### 7. Waiting Time Prediction Cache (String)
- **Key**: `prediction:{stationId}:waiting-time`
- **Type**: `STRING`
- **Value**: Estimated wait time in minutes.
- **TTL**: 5 minutes

### 8. Resource Locks (String)
- **Key**: `lock:{resourceId}`
- **Type**: `STRING`
- **Value**: `1`
- **TTL**: 10 seconds
- **Description**: Used to prevent race conditions when assigning a charger or joining a queue.
