import os
import pandas as pd
import numpy as np

# Directories
PROJECT_DIR = r"c:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise"
DATA_DIR = os.path.join(PROJECT_DIR, "data")
PROCESSED_FILE = os.path.join(DATA_DIR, "processed", "METR-LA-cleaned.csv")
ML_DIR = os.path.join(DATA_DIR, "ml")
REPORTS_DIR = os.path.join(PROJECT_DIR, "reports")

os.makedirs(ML_DIR, exist_ok=True)

print("1. Loading the cleaned dataset...")
# Read dataset
df_wide = pd.read_csv(PROCESSED_FILE)
df_wide['timestamp'] = pd.to_datetime(df_wide['timestamp'])

print("Melting dataset to long format for feature engineering...")
df = df_wide.melt(id_vars=['timestamp'], var_name='sensor_id', value_name='traffic')
df.sort_values(by=['sensor_id', 'timestamp'], inplace=True)
df.reset_index(drop=True, inplace=True)

original_shape = df.shape

print("2. Converting timestamp into useful time features...")
df['hour'] = df['timestamp'].dt.hour
df['minute'] = df['timestamp'].dt.minute
df['day_of_week'] = df['timestamp'].dt.dayofweek
df['day_of_month'] = df['timestamp'].dt.day
df['month'] = df['timestamp'].dt.month
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

# Peak hours: roughly 7-9 AM and 4-6 PM on weekdays
df['is_peak_hour'] = (
    ((df['hour'].isin([7, 8, 9]) | df['hour'].isin([16, 17, 18])) & (df['is_weekend'] == 0))
).astype(int)

print("3. Creating lag features...")
# Group by sensor to prevent leaking across sensors
g = df.groupby('sensor_id')['traffic']

df['lag_1'] = g.shift(1)
df['lag_3'] = g.shift(3)
df['lag_6'] = g.shift(6)
df['lag_12'] = g.shift(12)
df['lag_24'] = g.shift(24)
df['lag_288'] = g.shift(288)

print("4. Creating rolling features...")
df['rolling_mean_3'] = g.rolling(window=3, min_periods=1).mean().reset_index(level=0, drop=True)
df['rolling_mean_6'] = g.rolling(window=6, min_periods=1).mean().reset_index(level=0, drop=True)
df['rolling_mean_12'] = g.rolling(window=12, min_periods=1).mean().reset_index(level=0, drop=True)
df['rolling_mean_288'] = g.rolling(window=288, min_periods=1).mean().reset_index(level=0, drop=True)
df['rolling_std_12'] = g.rolling(window=12, min_periods=1).std().reset_index(level=0, drop=True)
df['rolling_std_288'] = g.rolling(window=288, min_periods=1).std().reset_index(level=0, drop=True)

print("5. Creating the forecasting target...")
df['target_5min'] = g.shift(-1)

print("Dropping NA values created by shifts...")
df.dropna(inplace=True)

final_shape = df.shape
features = df.columns.tolist()
num_features = len(features)

print("6 & 7. Chronological splitting...")
# To split chronologically without data leakage, we sort by timestamp
df.sort_values(by=['timestamp', 'sensor_id'], inplace=True)

n = len(df)
train_end = int(n * 0.70)
val_end = int(n * 0.85)

train_df = df.iloc[:train_end]
val_df = df.iloc[train_end:val_end]
test_df = df.iloc[val_end:]

print("8. Saving the processed datasets...")
train_df.to_csv(os.path.join(ML_DIR, "train.csv"), index=False)
val_df.to_csv(os.path.join(ML_DIR, "validation.csv"), index=False)
test_df.to_csv(os.path.join(ML_DIR, "test.csv"), index=False)

train_dates = f"{train_df['timestamp'].min()} to {train_df['timestamp'].max()}"
val_dates = f"{val_df['timestamp'].min()} to {val_df['timestamp'].max()}"
test_dates = f"{test_df['timestamp'].min()} to {test_df['timestamp'].max()}"

print("9. Saving feature engineering report...")
report_content = f"""Feature Engineering Report
==========================
Original Shape (long format): {original_shape}
Final Shape (after dropping NaNs from shifts): {final_shape}

Number of columns (features + target + id): {num_features}
Target Variable: target_5min

Features Created:
- Time features: hour, minute, day_of_week, day_of_month, month, is_weekend, is_peak_hour
- Lag features: lag_1, lag_3, lag_6, lag_12, lag_24, lag_288
- Rolling features: rolling_mean_3, rolling_mean_6, rolling_mean_12, rolling_mean_288, rolling_std_12, rolling_std_288

Data Splitting (Chronological Split Confirmed):
- Training dataset size: {len(train_df)} rows ({len(train_df)/n*100:.1f}%)
  Date range: {train_dates}
- Validation dataset size: {len(val_df)} rows ({len(val_df)/n*100:.1f}%)
  Date range: {val_dates}
- Test dataset size: {len(test_df)} rows ({len(test_df)/n*100:.1f}%)
  Date range: {test_dates}

Chronological Splitting Validation:
No random shuffling was used. Data was sorted by timestamp before splitting to ensure no future data leaks into the training set.
"""
with open(os.path.join(REPORTS_DIR, "feature_engineering_report.txt"), "w") as f:
    f.write(report_content)

print("10 & 11. Generating correlation analysis...")
# We correlate numeric features against target
numeric_cols = df.select_dtypes(include=[np.number]).columns
corr_matrix = df[numeric_cols].corr()
target_corr = corr_matrix[['target_5min']].sort_values(by='target_5min', ascending=False)
target_corr.to_csv(os.path.join(REPORTS_DIR, "traffic_feature_correlation.csv"))

print("12. Print final summary...")
print("="*50)
print("FEATURE ENGINEERING COMPLETED")
print("="*50)
print(f"Original shape (long format): {original_shape}")
print(f"Final shape (after drops): {final_shape}")
print(f"Total columns: {num_features}")
print(f"Train size: {len(train_df)} | Val size: {len(val_df)} | Test size: {len(test_df)}")
print("Data saved to data/ml/")
print("Reports saved to reports/")
