# Predictive Maintenance Data Analysis

## Dataset Details
- **Dataset Name**: `ev_charging_sessions.csv`
- **Location**: `data/cleaned/ev_charging_sessions.csv`
- **Row Count**: 796 records
- **Unique Stations**: 51 stations

## Available Relevant Columns
1. `station_id` (string)
2. `connection_time` (timestamp)
3. `disconnect_time` (timestamp)
4. `charging_start_time` (timestamp)
5. `charging_end_time` (timestamp)
6. `charging_duration_min` (numeric)
7. `connection_duration_min` (numeric)
8. `energy_consumed_kwh` (numeric)

## Missing Values
- `user_id`: 794 missing
- `requested_*` (energy, range, departure_time): 794 missing
- `minutes_available`: 794 missing
- `payment_required`: 794 missing
- `charging_end_time`: 1 missing
- `charging_duration_min`: 1 missing

## Target Variable Limitations
**CRITICAL FINDING**: The dataset does **not** contain any explicit labels for:
- maintenance events
- fault codes
- charger failures
- temperature, voltage, or current readings
- downtime periods

Because there is no supervised target variable for "failure" or "maintenance required", the dataset **does not support supervised machine learning for failure prediction.**

## Proposed Approach: Unsupervised Charger Health Scoring
As per project directives, we will *not* fabricate a fake label. Instead, we will implement an explainable, data-driven **Charger Health Score** (0-100) based on actual operational indicators:

1. **Abnormal Usage Patterns**: Sessions where `connection_duration_min` is significantly longer than `charging_duration_min` but `energy_consumed_kwh` is abnormally low.
2. **Zero-Energy Sessions (Proxy for Failures)**: Sessions where a user connected but `energy_consumed_kwh` was 0.
3. **Usage Intensity**: Total energy delivered and total sessions handled by the station over the dataset's timeframe (wear and tear proxy).

### Risk Classification Thresholds
Based on the health score:
- **HEALTHY**: Score 80 - 100
- **MONITOR**: Score 60 - 79
- **WARNING**: Score 40 - 59
- **CRITICAL**: Score 0 - 39
