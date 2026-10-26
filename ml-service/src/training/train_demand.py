import os
import json
import joblib
import pandas as pd
from datetime import datetime
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
os.makedirs(MODEL_DIR, exist_ok=True)
METADATA_FILE = os.path.join(MODEL_DIR, 'demand_metadata.json')

def train_demand_model():
    print("Loading real cleaned dataset...")
    csv_path = os.path.join(os.path.dirname(__file__), '../../../data/cleaned/ev_charging_sessions.csv')
    df_raw = pd.read_csv(csv_path)
    
    # Preprocess
    df_raw['connection_time'] = pd.to_datetime(df_raw['connection_time'])
    
    # 29.3 Time Aggregation
    print("Aggregating into 1-hour intervals...")
    df_raw['date_hour'] = df_raw['connection_time'].dt.floor('H')
    
    # Group by station and date_hour to get session counts
    demand_df = df_raw.groupby(['station_id', 'date_hour']).size().reset_index(name='charging_sessions')
    
    # We must fill missing hours with 0 to accurately represent low/no demand
    # Get all unique stations
    stations = demand_df['station_id'].unique()
    min_time = demand_df['date_hour'].min()
    max_time = demand_df['date_hour'].max()
    all_hours = pd.date_range(min_time, max_time, freq='H')
    
    idx = pd.MultiIndex.from_product([stations, all_hours], names=['station_id', 'date_hour'])
    demand_df = demand_df.set_index(['station_id', 'date_hour']).reindex(idx, fill_value=0).reset_index()
    
    # Feature Engineering
    demand_df['hour'] = demand_df['date_hour'].dt.hour
    demand_df['day_of_week'] = demand_df['date_hour'].dt.dayofweek
    demand_df['day_of_month'] = demand_df['date_hour'].dt.day
    demand_df['month'] = demand_df['date_hour'].dt.month
    demand_df['is_weekend'] = demand_df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
    
    # Generate lag feature safely per station
    demand_df = demand_df.sort_values(by=['station_id', 'date_hour'])
    demand_df['previous_demand'] = demand_df.groupby('station_id')['charging_sessions'].shift(1).fillna(0)
    
    # 29.4 Prevent Data Leakage - Chronological Split
    demand_df = demand_df.sort_values(by=['date_hour'])
    split_idx = int(len(demand_df) * 0.8)
    train_df = demand_df.iloc[:split_idx]
    test_df = demand_df.iloc[split_idx:]
    
    features = ['station_id', 'hour', 'day_of_week', 'day_of_month', 'month', 'is_weekend', 'previous_demand']
    target = 'charging_sessions'
    
    X_train = train_df[features]
    y_train = train_df[target]
    X_test = test_df[features]
    y_test = test_df[target]
    
    # 29.5 Baseline: Historical average demand for the same station & hour
    print("Calculating baseline...")
    # Calculate historical average from training set
    historical_avg = train_df.groupby(['station_id', 'hour'])['charging_sessions'].mean().reset_index(name='hist_avg')
    
    # Merge into test set
    test_baseline = test_df.merge(historical_avg, on=['station_id', 'hour'], how='left')
    # If a station/hour combo wasn't in training, fallback to overall training mean
    overall_mean = y_train.mean()
    y_pred_baseline = test_baseline['hist_avg'].fillna(overall_mean)
    
    baseline_mae = mean_absolute_error(y_test, y_pred_baseline)
    baseline_rmse = mean_squared_error(y_test, y_pred_baseline) ** 0.5
    
    print(f"Baseline MAE:  {baseline_mae:.4f}")
    print(f"Baseline RMSE: {baseline_rmse:.4f}")
    
    # 29.6 ML Model
    print("Training ML model...")
    categorical_features = ['station_id']
    numeric_features = ['hour', 'day_of_week', 'day_of_month', 'month', 'is_weekend', 'previous_demand']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', SimpleImputer(strategy='median'), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', GradientBoostingRegressor(n_estimators=100, random_state=42))
    ])
    
    model.fit(X_train, y_train)
    
    # 29.7 Model Evaluation
    y_pred = model.predict(X_test)
    ml_mae = mean_absolute_error(y_test, y_pred)
    ml_rmse = mean_squared_error(y_test, y_pred) ** 0.5
    ml_r2 = r2_score(y_test, y_pred)
    
    print(f"ML MAE:  {ml_mae:.4f}")
    print(f"ML RMSE: {ml_rmse:.4f}")
    print(f"ML R²:   {ml_r2:.4f}")
    
    # Save Model
    print("Saving model and metadata...")
    model_path = os.path.join(MODEL_DIR, 'demand_model.joblib')
    joblib.dump(model, model_path)
    
    # Demand distribution for thresholding
    non_zero = demand_df[demand_df['charging_sessions'] > 0]['charging_sessions']
    p50 = int(non_zero.quantile(0.50)) if not non_zero.empty else 1
    p75 = int(non_zero.quantile(0.75)) if not non_zero.empty else 2
    p90 = int(non_zero.quantile(0.90)) if not non_zero.empty else 3
    
    metadata = {
        'model_name': 'EV_Charging_Demand_Forecast',
        'model_version': '1.0.0',
        'training_date': datetime.utcnow().isoformat(),
        'dataset': 'ev_charging_sessions.csv',
        'features': features,
        'target': target,
        'training_rows': len(train_df),
        'testing_rows': len(test_df),
        'metrics': {
            'mae': float(ml_mae),
            'rmse': float(ml_rmse),
            'r2': float(ml_r2),
            'baseline_mae': float(baseline_mae),
            'baseline_rmse': float(baseline_rmse)
        },
        'thresholds': {
            'LOW_MAX': p50,
            'MEDIUM_MAX': p75,
            'HIGH_MAX': p90
        }
    }
    
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print("Done! Demand forecasting model ready.")

if __name__ == '__main__':
    train_demand_model()
