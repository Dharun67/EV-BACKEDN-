# EV Charging Demand Forecasting System (Step 29)

## Overview

The GridWise platform now includes a predictive demand forecasting system for electric vehicle charging stations. It utilizes a `GradientBoostingRegressor` to predict the number of charging sessions expected in the next hour at any given station.

This system is crucial for:
1. Identifying stations likely to experience high demand (congestion).
2. Warning users about high demand at their selected booking slot.
3. Enabling smart rebooking to less congested nearby stations.

## Architecture

1. **Python ML Service (`ml-service`)**
   - **Data**: Reads directly from `data/cleaned/ev_charging_sessions.csv`. (No fake data is generated).
   - **Training Script** (`src/training/train_demand.py`):
     - Aggregates sparse raw session data into robust **1-hour intervals** by station.
     - Performs strict **chronological train/test splitting** to prevent data leakage.
     - Evaluates against a strong baseline (historical mean for that specific station and hour).
     - Trains a pipeline containing a SimpleImputer, OneHotEncoder for stations, and a GradientBoostingRegressor.
     - Saves the model (`demand_model.joblib`) and metadata (`demand_metadata.json`).
   - **Predictor module** (`src/prediction/demand_predictor.py`): Loads the model, structures incoming feature vectors correctly, and outputs a formatted prediction along with a demand severity level (`LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`).
   - **API Endpoint**: Serves `POST /predict/demand` returning the prediction and metadata.

2. **Node.js Backend (`backend`)**
   - **Service Integration** (`src/services/mlService.ts`): Acts as a bridge, querying the ML Service and persisting predictions to MongoDB (`AIPrediction`).
   - **Caching strategy**: Wraps predictions with Redis (`GET /api/predictions/demand/:stationId`), storing the results for 10 minutes to minimize repetitive inference load on the Python ML service.
   - **API Routes** (`src/routes/predictionRoutes.ts`): Exposes prediction status and direct demand fetches to the frontend.

3. **React Frontend (`frontend`)**
   - **Visual Component**: Added `DemandForecastChart.tsx` that visually displays the prediction horizon, severity level, and historical vs. current trends.
   - **Booking Integration**: The `SlotBooking.tsx` page now embeds the Demand Forecast Chart directly into the booking summary sidebar. Users receive active visual context about expected demand for their chosen station before confirming their slots.

## Dataset Constraints and Fallbacks
The historical data in `ev_charging_sessions.csv` was highly zero-inflated (approx. 796 sessions across 51 stations over 15 days). To handle this gracefully:
- We bucket the data into 1-hour slots.
- The model treats intervals with 0 sessions natively.
- "High Demand" is defined probabilistically via 50th/75th/90th percentile thresholds automatically derived from the non-zero dataset portions.
- A fallback baseline calculation ensures we have realistic historical averages for missing timestamps.

## API Usage

**Endpoint:** `GET /api/predictions/demand/:stationId`
**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "stationId": "ST-001",
    "predictedDemand": 1,
    "demandLevel": "MEDIUM",
    "predictionHorizon": "1 hour",
    "modelVersion": "1.0.0",
    "timestamp": "2026-09-01T06:21:45.313886"
  }
}
```
