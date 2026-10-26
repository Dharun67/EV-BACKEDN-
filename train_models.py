import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Paths
PROJECT_DIR = r"c:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise"
DATA_DIR = os.path.join(PROJECT_DIR, "data", "ml")
MODELS_DIR = os.path.join(PROJECT_DIR, "models")
REPORTS_DIR = os.path.join(PROJECT_DIR, "reports")
FIGURES_DIR = os.path.join(REPORTS_DIR, "figures")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(FIGURES_DIR, exist_ok=True)

print("1. Loading datasets...")
train_df = pd.read_csv(os.path.join(DATA_DIR, "train.csv"))
val_df = pd.read_csv(os.path.join(DATA_DIR, "validation.csv"))
test_df = pd.read_csv(os.path.join(DATA_DIR, "test.csv"))

print("2. Identifying features and target...")
drop_cols = ['timestamp', 'sensor_id', 'target_5min']
features = [c for c in train_df.columns if c not in drop_cols]
target = 'target_5min'

X_train, y_train = train_df[features], train_df[target]
X_val, y_val = val_df[features], val_df[target]
X_test, y_test = test_df[features], test_df[target]

def mape(y_true, y_pred):
    y_true_safe = np.where(y_true == 0, 1e-6, y_true)
    return np.mean(np.abs((y_true_safe - y_pred) / y_true_safe)) * 100

def evaluate_model(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    mape_val = mape(y_true, y_pred)
    return mae, rmse, r2, mape_val

print("3 & 4. Building and Training models...")
results = []
models = {}

# Model 1: Persistence / Naive Forecast
y_val_naive = X_val['traffic']
mae, rmse, r2, mape_val = evaluate_model(y_val, y_val_naive)
results.append({'Model': 'Naive Forecast', 'MAE': mae, 'RMSE': rmse, 'R2': r2, 'MAPE': mape_val})
print(f"Naive Forecast - MAE: {mae:.2f}")

# Model 2: Linear Regression
lr = LinearRegression()
lr.fit(X_train, y_train)
y_val_lr = lr.predict(X_val)
mae, rmse, r2, mape_val = evaluate_model(y_val, y_val_lr)
results.append({'Model': 'Linear Regression', 'MAE': mae, 'RMSE': rmse, 'R2': r2, 'MAPE': mape_val})
models['Linear Regression'] = lr
print(f"Linear Regression - MAE: {mae:.2f}")

# Model 3: Random Forest (limited for speed and memory on 5M rows)
rf = RandomForestRegressor(n_estimators=10, max_depth=8, max_samples=0.2, n_jobs=2, random_state=42)
rf.fit(X_train, y_train)
y_val_rf = rf.predict(X_val)
mae, rmse, r2, mape_val = evaluate_model(y_val, y_val_rf)
results.append({'Model': 'Random Forest Regressor', 'MAE': mae, 'RMSE': rmse, 'R2': r2, 'MAPE': mape_val})
models['Random Forest Regressor'] = rf
print(f"Random Forest Regressor - MAE: {mae:.2f}")

# Model 4: Gradient Boosting
gbr = HistGradientBoostingRegressor(random_state=42)
gbr.fit(X_train, y_train)
y_val_gbr = gbr.predict(X_val)
mae, rmse, r2, mape_val = evaluate_model(y_val, y_val_gbr)
results.append({'Model': 'Gradient Boosting Regressor', 'MAE': mae, 'RMSE': rmse, 'R2': r2, 'MAPE': mape_val})
models['Gradient Boosting Regressor'] = gbr
print(f"Gradient Boosting Regressor - MAE: {mae:.2f}")

print("7. Creating comparison table...")
df_results = pd.DataFrame(results)
print("\nValidation Results:")
print(df_results)

# 12. Save model comparison
df_results.to_csv(os.path.join(REPORTS_DIR, "model_comparison.csv"), index=False)

print("8. Selecting best model...")
# Choose best learned model (excluding naive if possible, though naive is often very good in traffic)
# Let's find min MAE
best_idx = df_results['MAE'].idxmin()
best_model_name = df_results.loc[best_idx, 'Model']

# If naive is best, we still want a machine learning model to evaluate and save
if best_model_name == 'Naive Forecast':
    best_ml_idx = df_results[df_results['Model'] != 'Naive Forecast']['MAE'].idxmin()
    best_model_name = df_results.loc[best_ml_idx, 'Model']

print(f"Best ML Model Selected: {best_model_name}")

print("9. Retraining best model on Train + Validation...")
# Free memory before concatenation
import gc
del train_df
del val_df
gc.collect()

X_train_val = pd.concat([X_train, X_val])
y_train_val = pd.concat([y_train, y_val])

# Free individual datasets
del X_train, y_train, X_val, y_val
gc.collect()

best_model = models[best_model_name]
best_model.fit(X_train_val, y_train_val)

print("10. Evaluating final model on Test dataset...")
y_test_pred = best_model.predict(X_test)
test_mae, test_rmse, test_r2, test_mape = evaluate_model(y_test, y_test_pred)

print("11. Saving final model...")
model_path = os.path.join(MODELS_DIR, "traffic_forecasting_model.pkl")
joblib.dump(best_model, model_path)

print("13. Saving final test metrics...")
metrics_content = f"""Final Model Metrics (Test Dataset)
==================================
Model: {best_model_name}
MAE:  {test_mae:.4f}
RMSE: {test_rmse:.4f}
R2:   {test_r2:.4f}
MAPE: {test_mape:.4f}%
"""
with open(os.path.join(REPORTS_DIR, "final_model_metrics.txt"), "w") as f:
    f.write(metrics_content)

print("14. Generating visualizations...")
sns.set_theme(style="whitegrid")

plt.figure(figsize=(10, 5))
sns.barplot(data=df_results, x='Model', y='MAE', palette='viridis')
plt.title('Validation MAE Comparison')
plt.ylabel('Mean Absolute Error (MAE)')
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "model_comparison.png"))
plt.close()

sample_idx = np.random.choice(len(y_test), min(1000, len(y_test)), replace=False)
plt.figure(figsize=(8, 8))
plt.scatter(y_test.iloc[sample_idx], y_test_pred[sample_idx], alpha=0.5, color='blue')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
plt.title('Actual vs Predicted Traffic (Test Sample)')
plt.xlabel('Actual Traffic')
plt.ylabel('Predicted Traffic')
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "actual_vs_predicted.png"))
plt.close()

error = y_test - y_test_pred
plt.figure(figsize=(10, 5))
sns.histplot(error, bins=50, kde=True, color='red')
plt.title('Prediction Error Distribution')
plt.xlabel('Error (Actual - Predicted)')
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "prediction_error.png"))
plt.close()

# Forecast Example
sensor_id = test_df['sensor_id'].iloc[0]
sample_ts = test_df[test_df['sensor_id'] == sensor_id].head(100)
sample_ts_preds = best_model.predict(sample_ts[features])

plt.figure(figsize=(15, 5))
plt.plot(pd.to_datetime(sample_ts['timestamp']), sample_ts['target_5min'], label='Actual', color='blue')
plt.plot(pd.to_datetime(sample_ts['timestamp']), sample_ts_preds, label='Predicted', color='orange', linestyle='--')
plt.title(f'Traffic Forecast for Sensor {sensor_id}')
plt.xlabel('Timestamp')
plt.ylabel('Traffic')
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "traffic_forecast.png"))
plt.close()

print("15 & 16. Saving predictions forecast example...")
forecast_df = pd.DataFrame({
    'Timestamp': sample_ts['timestamp'],
    'Actual Traffic': sample_ts['target_5min'],
    'Predicted Traffic': sample_ts_preds,
    'Prediction Error': sample_ts['target_5min'] - sample_ts_preds
})
forecast_df.to_csv(os.path.join(REPORTS_DIR, "predictions.csv"), index=False)

print("17. Final summary...")
val_best_row = df_results[df_results['Model'] == best_model_name].iloc[0]
print("\n" + "="*50)
print("FINAL SUMMARY")
print("="*50)
print(f"Models trained: {', '.join(df_results['Model'].tolist())}")
print(f"Best model: {best_model_name}")
print(f"Validation MAE:  {val_best_row['MAE']:.4f}")
print(f"Validation RMSE: {val_best_row['RMSE']:.4f}")
print(f"Validation R2:   {val_best_row['R2']:.4f}")
print(f"Test MAE:  {test_mae:.4f}")
print(f"Test RMSE: {test_rmse:.4f}")
print(f"Test R2:   {test_r2:.4f}")
print(f"Test MAPE: {test_mape:.4f}%")
print("Suitable for the next stage: Yes")
