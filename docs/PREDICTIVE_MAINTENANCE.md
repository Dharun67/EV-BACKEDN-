# Predictive Maintenance System (Step 30)

## 1. Problem & Architecture
The goal of this step was to implement a Predictive Maintenance system for EV charging stations using the actual collected dataset. 
- **Frontend**: React (Maintenance Management Dashboard)
- **Backend**: Node.js + Express (Gateway and MongoDB persistence)
- **ML**: Python (Data processing and inference)
- **Cache**: Redis

## 2. Dataset Limitations & Findings
- **Dataset used**: `data/cleaned/ev_charging_sessions.csv` (796 rows)
- **Limitation**: The dataset does **NOT** contain any explicit failure, fault, or maintenance event labels. It also lacks physical sensor readings (temperature, current, voltage).
- **Compliance**: As per the rules (do not generate fake data, do not invent fake targets), we cannot build a supervised machine learning model (e.g., Random Forest or Gradient Boosting) because there is no ground truth `target` variable to train against.

## 3. Unsupervised Charger Health Score
To fulfill the requirements, an unsupervised **Charger Health Score (0-100)** was implemented based on available operational indicators.

### Feature Engineering
1. **Usage Intensity**: Wear and tear approximation derived from `total_sessions` and `total_energy_consumed`.
2. **Zero-Energy Rate**: Sessions where `energy_consumed_kwh` == 0 despite a connection, acting as a strong proxy for failed charging sessions or immediate hardware disconnects.
3. **Abnormal Idle Ratio**: Sessions where `connection_duration_min` > (2 * `charging_duration_min`) and `energy_consumed_kwh` < 5. This indicates a car was plugged in for a long time but received barely any charge (potential communication fault).

### Baseline Scoring Logic
- Base score is `100`.
- Deduct `(sessions_count / 100) + (total_energy / 5000)` for wear and tear.
- Deduct `(zero_energy_rate * 40) + (abnormal_rate * 20)` for operational faults.

### Risk Classification
- **HEALTHY**: Score 80 - 100 (Priority: LOW)
- **MONITOR**: Score 60 - 79 (Priority: LOW)
- **WARNING**: Score 40 - 59 (Priority: MEDIUM)
- **CRITICAL**: Score 0 - 39 (Priority: URGENT)

## 4. API Endpoints
- **Python ML**: `POST /predict/maintenance` (Returns `healthScore`, `riskLevel`, `recommendedAction`, `maintenancePriority`).
- **Node.js**: `GET /api/predictions/maintenance/:chargerId` (Proxies Python, caches in Redis, logs to Mongo).

## 5. Persistence & Integration
- **Redis**: Predictions are cached for 30 minutes (`prediction:{chargerId}:maintenance`) to prevent overloading the ML service.
- **MongoDB**: Results are logged in the `AIPrediction` collection.
- **Frontend**: `MaintenanceManagement.tsx` actively fetches predictions for a batch of known chargers and dynamically renders the `AssetHealthBars`, `PredictiveMaintenanceAI` alerts, and `MaintenanceTable` based on the real calculated risk levels.
