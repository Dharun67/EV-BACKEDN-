import os
import json
import joblib
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from src.utils.db import get_charging_sessions

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
os.makedirs(MODEL_DIR, exist_ok=True)
METADATA_FILE = os.path.join(MODEL_DIR, 'model_metadata.json')

def load_metadata():
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_metadata(metadata):
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

def train_revenue_model():
    print("Fetching real charging sessions data from MongoDB...")
    df = get_charging_sessions()
    
    if df.empty or len(df) < 20:
        print("Insufficient session data for revenue training.")
        return False
        
    print(f"Loaded {len(df)} charging sessions.")
    
    # Feature Engineering
    # Aggregate cost by date
    df['date'] = df['startTime'].dt.date
    daily_revenue = df.groupby('date').agg({'cost': 'sum', 'sessionId': 'count'}).reset_index()
    daily_revenue.rename(columns={'sessionId': 'sessions'}, inplace=True)
    daily_revenue = daily_revenue.sort_values('date')
    
    if len(daily_revenue) < 10:
        print("Not enough unique days of data for revenue forecasting.")
        return False
        
    # We will build a simple autoregressive model + time features
    daily_revenue['date'] = pd.to_datetime(daily_revenue['date'])
    daily_revenue['day_of_week'] = daily_revenue['date'].dt.dayofweek
    daily_revenue['month'] = daily_revenue['date'].dt.month
    daily_revenue['is_weekend'] = daily_revenue['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
    
    # Create lag features (e.g., revenue from the previous day)
    daily_revenue['lag_1_revenue'] = daily_revenue['cost'].shift(1)
    daily_revenue['lag_7_revenue'] = daily_revenue['cost'].shift(7)
    
    # Drop rows with NaN due to lag
    daily_revenue = daily_revenue.dropna()
    
    if len(daily_revenue) < 5:
        print("Not enough data after lag feature extraction.")
        return False

    features = ['day_of_week', 'month', 'is_weekend', 'lag_1_revenue', 'lag_7_revenue']
    target = 'cost'
    
    X = daily_revenue[features]
    y = daily_revenue[target]
    
    # Chronological Split
    split_idx = int(len(daily_revenue) * 0.8)
    if split_idx == 0:
        # If very small dataset, just use train=test for MVP
        split_idx = len(daily_revenue) - 1
        
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    if len(X_test) == 0:
        X_test = X_train
        y_test = y_train
        
    # Baseline: Predict the lag_1_revenue
    baseline_mae = mean_absolute_error(y_test, X_test['lag_1_revenue'])
    baseline_rmse = mean_squared_error(y_test, X_test['lag_1_revenue']) ** 0.5
    
    print(f"Baseline (Lag 1) MAE: {baseline_mae:.2f}")
    
    # Model: Random Forest Regressor
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = mean_squared_error(y_test, y_pred) ** 0.5
    r2 = r2_score(y_test, y_pred)
    
    print("Revenue Prediction Model Performance:")
    print(f"MAE:  {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²:   {r2:.2f}")
    
    # Save Model
    model_path = os.path.join(MODEL_DIR, 'revenue_model.joblib')
    joblib.dump(model, model_path)
    
    # Update Metadata
    metadata = load_metadata()
    metadata['revenue_model'] = {
        'version': '1.0.0',
        'last_trained': datetime.utcnow().isoformat(),
        'dataset': 'chargingsessions (aggregated daily)',
        'target': 'daily_revenue',
        'features': features,
        'training_rows': len(X_train),
        'test_rows': len(X_test),
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2),
            'baseline_mae': float(baseline_mae)
        }
    }
    save_metadata(metadata)
    
    print("Revenue model saved successfully.")
    return True

if __name__ == '__main__':
    train_revenue_model()
