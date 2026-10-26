# AI Decision & Automation Engine (Step 32)

## 1. Architecture
The AI Decision Engine acts as the central brain of GridWise, fusing real-time signals from various intelligent microservices (Queue, Demand, Maintenance, Incidents) to make deterministic, explainable automation decisions.

## 2. Components
- **Decision Engine (`decisionEngine.ts`)**: Evaluates `DecisionContext` using explicit deterministic rules. Calculates action and priority.
- **Action Executor (`actionExecutor.ts`)**: Applies safety checks. Safely executes decisions and requests admin approvals for sensitive operations.
- **Decision Queue (`decisionQueue.ts`)**: A BullMQ worker that async-processes AI evaluation events to offload the main Node thread.
- **Decision Center (`DecisionCenter.tsx`)**: A real-time React dashboard utilizing Socket.IO to visualize the history of decisions and allow Admins to approve/reject sensitive operations.

## 3. Decision Rules
- **Rule 1 (Charger Fault)**: `IF charger = OFFLINE or Health = CRITICAL -> MARK_CHARGER_UNAVAILABLE` (Priority: CRITICAL)
- **Rule 2 (Critical Incident Escalate)**: `IF Active Incidents contains CRITICAL -> ESCALATE_INCIDENT` (Priority: CRITICAL)
- **Rule 3 (Queue Risk)**: `IF Queue >= 5 or Wait > 30m -> CREATE_QUEUE_ALERT` (Priority: HIGH/CRITICAL)
- **Rule 4 (Capacity Shortage)**: `IF Demand = High AND Charger = OFFLINE -> CREATE_DEMAND_ALERT` (Priority: HIGH)
- **Rule 5 (Maintenance Risk)**: `IF Maintenance = HIGH -> CREATE_MAINTENANCE_ALERT` (Priority: MEDIUM/HIGH)

## 4. Safety & Idempotency
- Uses **Redis distributed locks** (`decision:lock:eventId`) to prevent duplicate evaluations for the same event trigger.
- Sensitive actions (like `MARK_CHARGER_UNAVAILABLE`) are placed in a `PENDING_APPROVAL` state. They are held until an Admin reviews the Evidence Context in the Decision Center UI.

## 5. Explainability
- Every decision strictly records `reason` (e.g., "Queue or waiting time exceeds safe thresholds.") and `evidence` (e.g., `["Current Queue: 8", "Estimated Wait Time: 45 mins"]`). This eliminates "black box" decisions.

## 6. Integrations
- **Queue**: Hooked via `queueService.ts`.
- **Demand & Maintenance**: Hooked via `predictionRoutes.ts` ML responses.
- **Incidents**: Hooked via `incidentDetectionService.ts`.
