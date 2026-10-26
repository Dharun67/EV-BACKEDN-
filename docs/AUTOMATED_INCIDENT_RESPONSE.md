# Automated Incident Response Engine (Step 31)

## Architecture Overview
The Automated Incident Response system is designed to handle live charger faults gracefully, minimizing downtime impacts on both Station Operators (Admins) and EV Drivers (Users).

### 1. Incident Detection & Classification
- Handled by `backend/src/services/incidentService.ts`.
- Events can be pushed into the system (e.g., from Predictive Maintenance ML or simulated via `POST /api/incidents/simulate`).
- Incidents are classified by severity (`Normal` or `Critical`). Critical incidents trigger the Automation Engine.

### 2. Automation Engine Actions (`automationService.ts`)
When a `Critical` incident is triggered, three synchronous actions occur:
1. **Disable Charger**: Real-time Redis state (`charger:{chargerId}:status`) is flipped to `OFFLINE`.
2. **Admin Notification**: A WebSocket event (`notification:admin`) is emitted globally to alert operators.
3. **User Re-routing**: 
   - The engine automatically queries the `recommendationService` to find the nearest valid alternative station.
   - A WebSocket event (`incident:user-reroute`) is broadcast to any active user currently booked for that charger.

### 3. Frontend Resiliency UI
- **Admin Dashboard**: `MaintenanceManagement.tsx` listens to `notification:admin`. When triggered, it displays an immediate Toast alert and injects the live fault into the Predictive Maintenance Risk table.
- **User Dashboard**: `ActiveBookingMonitor.tsx` listens to `incident:user-reroute`. When a user's booked charger goes offline, they are presented with a "Critical Incident Detected" modal. This modal intercepts their normal flow, provides a "Better Option", and allows them to execute a 1-click Auto-Rebook.

## Simulation & Testing
You can manually trigger an incident for end-to-end testing by hitting the Node.js API:

```bash
POST /api/incidents/simulate
{
  "chargerId": "CA-496",
  "stationId": "2-39-78-362",
  "eventType": "Hardware Fault",
  "severity": "Critical",
  "details": "Cooling fan failure detected"
}
```

If a user has `CA-496` booked in their ActiveBookingMonitor, they will instantly see the incident override popup and an alternative station recommendation.
