# Incident & Emergency Automation Engine (Step 31)

## 1. Incident Architecture
GridWise handles live operational faults using a centralized `incidentDetectionService` and `incidentAutomationService`. These services monitor data streams (Predictive Maintenance, Demand ML, Live Queue, Live Hardware Faults) and create `Incident` records in MongoDB.

## 2. Incident Types
The system detects and supports the following strictly controlled incident types based on REAL data:
- `CHARGER_FAULT`
- `CHARGER_OFFLINE`
- `STATION_UNAVAILABLE`
- `HIGH_QUEUE`
- `EXTREME_WAITING_TIME`
- `BOOKING_FAILURE`
- `MAINTENANCE_REQUIRED`
- `PREDICTED_CAPACITY_SHORTAGE`

## 3. Severity Levels
- **LOW / MEDIUM**: Generally logged or queued for later review.
- **HIGH**: Creates an operational warning, flags dashboards.
- **CRITICAL**: Engages the `incidentAutomationService` for immediate synchronous execution of mitigations.

## 4. Detection Rules
- **Queue**: Triggered if `liveQueue >= 5` vehicles or waiting times breach thresholds.
- **Capacity**: Triggered if Demand Prediction is `High / Very High` AND `offlineChargers >= 2`.
- **Maintenance**: Triggered directly by the ML engine if health falls into `CRITICAL` or `WARNING`.

## 5. Automation Rules & Actions
Safe actions are executed automatically:
- `MARK_CHARGER_UNAVAILABLE` (Temporary cache level)
- `FIND_ALTERNATIVE_STATION`
- `CREATE_REBOOKING_RECOMMENDATION`
- `CREATE_MAINTENANCE_ALERT`
- `NOTIFY_ADMIN`
- `NOTIFY_USER`
- `UPDATE_QUEUE`

## 6. Human Approval Flow
**DANGEROUS** or irreversible actions (like permanently marking a charger out of commission in the main database or dispatching physical technicians) are halted by the automation engine. The Incident status is set to `ACTION_REQUIRED` and is surfaced in the Admin Incident Dashboard. An admin must explicitly click "Approve Action" to proceed.

## 7. BullMQ Background Processing
All incidents are pushed to a `incidentProcessing` BullMQ queue backed by Redis.
- **Deduplication**: Prevents alert fatigue. If an active incident for the same charger/type exists, new alerts are swallowed.
- **Retries**: Configured with exponential backoff (`attempts: 3` for incidents, `attempts: 5` for notifications) to ensure transient network failures do not drop critical alerts.

## 8. WebSockets (Socket.IO)
Events emitted include:
- `incident:created`, `incident:updated`, `incident:resolved`
- `charger:fault`
- `notification:admin`
- `incident:user-reroute`

## 9. Security & Audit Logs
- Only Admins can approve actions or mark incidents resolved.
- Every automated action creates an `AuditLog` entry in MongoDB under the `actor = SYSTEM`. Human interventions log under `actor = ADMIN`.

## 10. Limitations
- Does not automatically reset physical hardware breakers (requires physical presence).
- Deduplication relies heavily on active state; manually closing an incident prematurely could cause it to refire if the underlying ML model is still detecting the fault.
