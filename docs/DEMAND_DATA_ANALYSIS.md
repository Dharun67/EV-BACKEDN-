# Demand Data Analysis

## Dataset Overview
- **Dataset Name**: `data/cleaned/ev_charging_sessions.csv`
- **Rows**: 796
- **Columns**: `session_id`, `station_id`, `site_id`, `space_id`, `user_id`, `connection_time`, `charging_start_time`, `charging_end_time`, `disconnect_time`, `charging_duration_min`, `connection_duration_min`, `energy_consumed_kwh`, `timezone`, `requested_energy_kwh`, `requested_range_miles`, `requested_departure_time`, `minutes_available`, `payment_required`
- **Date Range**: 2018-04-25 11:08:04+00:00 to 2018-05-10 16:49:03+00:00 (approx. 15 days)
- **Station Count**: 51 unique stations

## Data Quality
- **Missing Values**:
  - `user_id`: 794 missing
  - `requested_energy_kwh`: 794 missing
  - `requested_range_miles`: 794 missing
  - `requested_departure_time`: 794 missing
  - `minutes_available`: 794 missing
  - `payment_required`: 794 missing
  - `charging_end_time`: 1 missing
  - `charging_duration_min`: 1 missing
- **Duplicate Records**: 0 duplicates found.

## Relevant Demand Columns
For demand forecasting, the following columns are relevant:
- `station_id`: To forecast demand per station.
- `connection_time`: To group by time interval and count the number of sessions.
- `energy_consumed_kwh`: (Optional) Can be used to forecast energy demand.

## Proposed Aggregation
Given 796 sessions over 15 days across 51 stations, the data is relatively sparse (~1 session/station/day on average). 
We will aggregate demand by **hour** and **station**.
Target: `charging_sessions` (Count of `session_id` per `station_id` per `hour`).
Missing intervals will be filled with `0`.
