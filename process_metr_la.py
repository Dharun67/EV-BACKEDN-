import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Directories
PROJECT_DIR = r"c:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise"
DATA_DIR = os.path.join(PROJECT_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
REPORTS_DIR = os.path.join(PROJECT_DIR, "reports")
FIGURES_DIR = os.path.join(REPORTS_DIR, "figures")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(FIGURES_DIR, exist_ok=True)

# 1. Load data
INPUT_FILE = os.path.join(DATA_DIR, "METR-LA.csv")
print(f"Loading {INPUT_FILE}...")
df = pd.read_csv(INPUT_FILE)
original_row_count = len(df)
original_col_count = len(df.columns)

# 2. Rename column
if "Unnamed: 0" in df.columns:
    df.rename(columns={"Unnamed: 0": "timestamp"}, inplace=True)

# 3. Convert timestamp to datetime
df["timestamp"] = pd.to_datetime(df["timestamp"], errors='coerce')

# 4. Sort chronologically
df.sort_values(by="timestamp", inplace=True)
df.reset_index(drop=True, inplace=True)

# 5. Check and report
sensor_cols = [c for c in df.columns if c != "timestamp"]
num_sensors = len(sensor_cols)

# Missing values
missing_total = df[sensor_cols].isnull().sum().sum()
missing_by_sensor = df[sensor_cols].isnull().sum()

# Duplicate rows
duplicate_rows = df.duplicated().sum()

# Duplicate timestamps
duplicate_timestamps = df["timestamp"].duplicated().sum()

# Zero values
zero_values = (df[sensor_cols] == 0).sum().sum()

# Invalid/Outlier values (Speed typically between 0 and 85 mph. Negative or >100 is invalid)
negative_values = (df[sensor_cols] < 0).sum().sum()
extreme_high_values = (df[sensor_cols] > 100).sum().sum()

# Range & interval
start_time = df["timestamp"].min()
end_time = df["timestamp"].max()
if len(df) > 1:
    interval = (df["timestamp"].iloc[1] - df["timestamp"].iloc[0]).total_seconds() / 60.0
else:
    interval = "N/A"

# 7. Handle missing sensor values
# Method: We will use linear interpolation which is appropriate for time series traffic data,
# followed by forward fill and backward fill for any remaining NaNs at the edges.
df_clean = df.copy()
df_clean[sensor_cols] = df_clean[sensor_cols].interpolate(method='linear', limit_direction='both')

handled_missing = missing_total - df_clean[sensor_cols].isnull().sum().sum()

# 8. Detect outlier values
# Not removing them automatically to preserve genuine patterns, just capping negative values to 0 if they exist.
if negative_values > 0:
    df_clean[sensor_cols] = df_clean[sensor_cols].clip(lower=0)

# Remove duplicate timestamps if necessary (keep first)
if duplicate_timestamps > 0:
    df_clean.drop_duplicates(subset=["timestamp"], keep="first", inplace=True)

final_row_count = len(df_clean)

# 9. Create cleaned file
CLEANED_FILE = os.path.join(PROCESSED_DIR, "METR-LA-cleaned.csv")
df_clean.to_csv(CLEANED_FILE, index=False)

# 10. Create data-quality report
report_lines = [
    "METR-LA Data Quality Report",
    "===========================",
    f"Original shape: {original_row_count} rows, {original_col_count} columns",
    f"Number of sensors: {num_sensors}",
    f"Timestamp range: {start_time} to {end_time}",
    f"Sampling interval: {interval} minutes",
    "",
    f"Missing values (total): {missing_total}",
    f"Duplicate rows: {duplicate_rows}",
    f"Duplicate timestamps: {duplicate_timestamps}",
    f"Zero values (valid traffic): {zero_values}",
    f"Negative values (invalid): {negative_values}",
    f"Values > 100 (potential outliers): {extreme_high_values}",
    "",
    "Processing Actions Taken:",
    "- Renamed 'Unnamed: 0' to 'timestamp'.",
    "- Converted to datetime and sorted chronologically.",
    "- Handled missing values using linear interpolation (time-series appropriate) followed by edge-fill.",
    f"- Handled {handled_missing} missing values.",
    "- Capped any negative invalid values to 0 to preserve genuine traffic zero-states.",
    "- Preserved genuine high traffic values (if any) to not destroy true congestion/free-flow patterns.",
    f"- Dropped exact duplicate timestamps (kept first).",
    "",
    f"Final shape: {final_row_count} rows, {len(df_clean.columns)} columns"
]
REPORT_FILE = os.path.join(REPORTS_DIR, "metr_la_quality_report.txt")
with open(REPORT_FILE, "w") as f:
    f.write("\n".join(report_lines))

# 11 & 12. Create visualizations
sns.set_theme(style="whitegrid")

# a) Traffic trend over time (Mean across all sensors)
plt.figure(figsize=(15, 5))
mean_traffic = df_clean[sensor_cols].mean(axis=1)
plt.plot(df_clean["timestamp"], mean_traffic, label="Mean Speed", color="blue", linewidth=0.5)
plt.title("Overall Traffic Trend Over Time (Mean Speed)")
plt.xlabel("Time")
plt.ylabel("Mean Speed")
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "traffic_trend_over_time.png"))
plt.close()

# b) Sensor comparison (Subset of 5 sensors)
np.random.seed(42)
sample_sensors = np.random.choice(sensor_cols, 5, replace=False)
plt.figure(figsize=(12, 6))
sns.boxplot(data=df_clean[sample_sensors])
plt.title("Sensor Comparison (Sample of 5 Sensors)")
plt.xlabel("Sensor ID")
plt.ylabel("Speed Measurement")
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "sensor_comparison.png"))
plt.close()

# c) Missing-value analysis
plt.figure(figsize=(12, 5))
missing_by_sensor.sort_values(ascending=False).head(50).plot(kind="bar", color="salmon")
plt.title("Top 50 Sensors by Missing Values")
plt.xlabel("Sensor ID")
plt.ylabel("Missing Count")
plt.xticks(rotation=90)
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "missing_value_analysis.png"))
plt.close()

# d) Traffic distribution
plt.figure(figsize=(10, 6))
# Sample 100k data points to plot distribution quickly
all_vals = df_clean[sensor_cols].values.flatten()
sampled_vals = np.random.choice(all_vals, min(100000, len(all_vals)), replace=False)
sns.histplot(sampled_vals, bins=50, kde=True, color="purple")
plt.title("Traffic Measurement Distribution")
plt.xlabel("Speed")
plt.ylabel("Frequency")
plt.tight_layout()
plt.savefig(os.path.join(FIGURES_DIR, "traffic_distribution.png"))
plt.close()

# 15. Print clear summary
print("\n" + "="*50)
print("PREPROCESSING SUMMARY")
print("="*50)
print(f"- Rows changed from {original_row_count} to {final_row_count}")
print(f"- Sensors remain: {num_sensors}")
print(f"- Missing values handled: {handled_missing}")
print("- Duplicates removed: timestamps deduped.")
print("- Readiness: Dataset is clean, chronologically ordered, missing values imputed, ready for ML/model training.")
