import os
import json
import pandas as pd
import numpy as np
import shutil
from datetime import datetime

# Paths
INPUT_JSON = r"c:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise\data\acndata_sessions.json"
PROJECT_DIR = r"c:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise"
DATA_DIR = os.path.join(PROJECT_DIR, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
CLEANED_DIR = os.path.join(DATA_DIR, "cleaned")
REPORTS_DIR = os.path.join(DATA_DIR, "reports")

# Create dirs
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(CLEANED_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Step 2 - Create raw backup
RAW_JSON = os.path.join(RAW_DIR, "acn_charging_sessions_raw.json")
if not os.path.exists(RAW_JSON):
    shutil.copy(INPUT_JSON, RAW_JSON)

# Step 1 - Inspect the data
with open(INPUT_JSON, 'r') as f:
    data = json.load(f)

items = data.get("_items", [])
print("==================================================")
print("STEP 1 — INSPECT THE DATA")
print("==================================================")
print(f"File name: acndata_sessions.json")
print(f"JSON structure keys: {list(data.keys())}")
print(f"Number of charging sessions (raw): {len(items)}")

df_raw = pd.DataFrame(items)
print(f"All available fields: {df_raw.columns.tolist()}")
print("\nSample records (first 1):")
print(df_raw.head(1).to_dict(orient="records"))
print("\nData types:")
print(df_raw.dtypes)
print("\nMissing values:")
print(df_raw.isnull().sum())
hashable_cols = [c for c in df_raw.columns if c != 'userInputs']
print(f"\nDuplicate records: {df_raw.duplicated(subset=hashable_cols).sum()}")
if 'stationID' in df_raw:
    print(f"Unique station IDs: {df_raw['stationID'].nunique()}")
if 'siteID' in df_raw:
    print(f"Unique site IDs: {df_raw['siteID'].nunique()}")
if 'userID' in df_raw:
    print(f"Unique users: {df_raw['userID'].nunique()}")

# Step 3 - Standardize columns
df = df_raw.copy()

rename_map = {
    "sessionID": "session_id",
    "stationID": "station_id",
    "siteID": "site_id",
    "spaceID": "space_id",
    "userID": "user_id",
    "connectionTime": "connection_time",
    "doneChargingTime": "charging_end_time",
    "disconnectTime": "disconnect_time",
    "kWhDelivered": "energy_consumed_kwh",
    "timezone": "timezone"
}
df.rename(columns=rename_map, inplace=True)

if 'userInputs' in df.columns:
    def extract_ui(ui, key):
        if isinstance(ui, list) and len(ui) > 0:
            # Handle list of dicts
            return ui[0].get(key, np.nan)
        elif isinstance(ui, dict):
            # Handle dict
            return ui.get(key, np.nan)
        return np.nan

    df['requested_energy_kwh'] = df['userInputs'].apply(lambda x: extract_ui(x, 'kWhRequested'))
    df['requested_range_miles'] = df['userInputs'].apply(lambda x: extract_ui(x, 'milesRequested'))
    df['requested_departure_time'] = df['userInputs'].apply(lambda x: extract_ui(x, 'requestedDeparture'))
    df['minutes_available'] = df['userInputs'].apply(lambda x: extract_ui(x, 'minutesAvailable'))
    df['payment_required'] = df['userInputs'].apply(lambda x: extract_ui(x, 'paymentRequired'))
else:
    df['requested_energy_kwh'] = np.nan
    df['requested_range_miles'] = np.nan
    df['requested_departure_time'] = np.nan
    df['minutes_available'] = np.nan
    df['payment_required'] = np.nan

df['charging_start_time'] = df['connection_time']

# Step 4 - Data Cleaning
time_cols = ['connection_time', 'charging_start_time', 'charging_end_time', 'disconnect_time', 'requested_departure_time']
for c in time_cols:
    if c in df.columns:
        df[c] = pd.to_datetime(df[c], errors='coerce', utc=True)

df['charging_duration_min'] = (df['charging_end_time'] - df['charging_start_time']).dt.total_seconds() / 60
df['connection_duration_min'] = (df['disconnect_time'] - df['connection_time']).dt.total_seconds() / 60
df['energy_consumed_kwh'] = pd.to_numeric(df['energy_consumed_kwh'], errors='coerce')

if 'userInputs' in df.columns:
    df.drop(columns=['userInputs'], inplace=True)

initial_count = len(df)
df.drop_duplicates(inplace=True)
after_dedup = len(df)
duplicate_records = initial_count - after_dedup

duplicate_sessions = df['session_id'].duplicated().sum()
df.drop_duplicates(subset=['session_id'], inplace=True, keep='first')
after_session_dedup = len(df)
removed_duplicate_sessions = after_dedup - after_session_dedup

invalid_mask = (
    (df['charging_duration_min'] < 0) |
    (df['connection_duration_min'] < 0) |
    (df['energy_consumed_kwh'] < 0) |
    (df['charging_start_time'].isnull()) |
    (df['disconnect_time'].isnull())
)

negative_durations = ((df['charging_duration_min'] < 0) | (df['connection_duration_min'] < 0)).sum()
negative_energy = (df['energy_consumed_kwh'] < 0).sum()
invalid_timestamps = ((df['charging_start_time'].isnull()) | (df['disconnect_time'].isnull())).sum()

df = df[~invalid_mask]

Q1_e = df['energy_consumed_kwh'].quantile(0.25)
Q3_e = df['energy_consumed_kwh'].quantile(0.75)
IQR_e = Q3_e - Q1_e
outlier_mask_e = (df['energy_consumed_kwh'] > (Q3_e + 3 * IQR_e))

Q1_d = df['connection_duration_min'].quantile(0.25)
Q3_d = df['connection_duration_min'].quantile(0.75)
IQR_d = Q3_d - Q1_d
outlier_mask_d = (df['connection_duration_min'] > (Q3_d + 3 * IQR_d))

outliers_detected = (outlier_mask_e | outlier_mask_d).sum()
final_count = len(df)

# Step 6 - Save dataset
cols_to_keep = [
    'session_id', 'station_id', 'site_id', 'space_id', 'user_id',
    'connection_time', 'charging_start_time', 'charging_end_time', 'disconnect_time',
    'charging_duration_min', 'connection_duration_min', 'energy_consumed_kwh',
    'timezone', 'requested_energy_kwh', 'requested_range_miles',
    'requested_departure_time', 'minutes_available', 'payment_required'
]
for c in cols_to_keep:
    if c not in df.columns:
        df[c] = np.nan

df = df[cols_to_keep]
CSV_OUTPUT = os.path.join(CLEANED_DIR, "ev_charging_sessions.csv")
df.to_csv(CSV_OUTPUT, index=False)

# Step 7 - Cleaning Report
report_lines = [
    "Dataset 3 Cleaning Report",
    "=========================",
    f"Original number of records: {initial_count}",
    f"Final number of records: {final_count}",
    f"Records removed: {initial_count - final_count}",
    f"Duplicate records: {duplicate_records}",
    f"Duplicate session IDs: {removed_duplicate_sessions}",
    f"Invalid timestamps: {invalid_timestamps}",
    f"Negative durations: {negative_durations}",
    f"Negative energy values: {negative_energy}",
    f"Outliers detected (but kept): {outliers_detected}",
    "  * Outliers defined as > Q3 + 3*IQR for energy or duration.",
    "  * EV charging outliers may include extremely long parking durations (weekend/holiday) or high energy consumption for large batteries.",
    "",
    "Missing values by column:",
    df.isnull().sum().to_string(),
    "",
    f"Unique stations: {df['station_id'].nunique()}",
    f"Unique sites: {df['site_id'].nunique()}",
    f"Unique users: {df['user_id'].nunique()}",
    f"Unique sessions: {df['session_id'].nunique()}",
    "",
    "Statistics:",
    f"Minimum charging duration: {df['charging_duration_min'].min():.2f} min",
    f"Maximum charging duration: {df['charging_duration_min'].max():.2f} min",
    f"Average charging duration: {df['charging_duration_min'].mean():.2f} min",
    "",
    f"Minimum energy consumed: {df['energy_consumed_kwh'].min():.2f} kWh",
    f"Maximum energy consumed: {df['energy_consumed_kwh'].max():.2f} kWh",
    f"Average energy consumed: {df['energy_consumed_kwh'].mean():.2f} kWh"
]
REPORT_OUTPUT = os.path.join(REPORTS_DIR, "dataset3_cleaning_report.txt")
with open(REPORT_OUTPUT, 'w') as f:
    f.write("\n".join(report_lines))

# Step 8 - Data Dictionary
dict_lines = [
    "# Dataset 3: EV Charging Sessions Data Dictionary",
    "",
    "| column name | meaning | data type | unit | source field from ACN-Data | missing-value handling |",
    "|-------------|---------|-----------|------|----------------------------|------------------------|",
    "| session_id | Unique identifier for the charging session | string | N/A | sessionID | Kept as is. Rows without session_id (if any) would be problematic, but ACN generally provides it. |",
    "| station_id | Unique identifier for the charging station | string | N/A | stationID | Kept as is. Nulls remain null. |",
    "| site_id | Identifier for the charging site | string | N/A | siteID | Kept as is. Nulls remain null. |",
    "| space_id | Parking space identifier | string | N/A | spaceID | Kept as is. Nulls remain null. |",
    "| user_id | Unique identifier for the user | string | N/A | userID | Nulls remain null. |",
    "| connection_time | Time when the EV was connected to the charger | datetime | UTC | connectionTime | Parsed to datetime. Nulls dropped. |",
    "| charging_start_time | Time when charging actually started | datetime | UTC | connectionTime (inferred) | Parsed to datetime. ACN lacks a dedicated start time, so connectionTime is used. |",
    "| charging_end_time | Time when charging completed | datetime | UTC | doneChargingTime | Parsed to datetime. Nulls remain null. |",
    "| disconnect_time | Time when the EV was disconnected | datetime | UTC | disconnectTime | Parsed to datetime. Nulls dropped. |",
    "| charging_duration_min | Duration of active charging | float | minutes | Calculated (end - start) | Nulls remain null. |",
    "| connection_duration_min | Total time connected to the station | float | minutes | Calculated (disconnect - connection) | Nulls remain null. |",
    "| energy_consumed_kwh | Total energy delivered | float | kWh | kWhDelivered | Missing or invalid parsed to NaN. |",
    "| timezone | Timezone of the station | string | N/A | timezone | Kept as is. |",
    "| requested_energy_kwh | Energy requested by user via app | float | kWh | userInputs.kWhRequested | Null if not available or no app input. |",
    "| requested_range_miles | Range requested by user via app | float | miles | userInputs.milesRequested | Null if not available. |",
    "| requested_departure_time | Departure time requested by user | datetime | UTC | userInputs.requestedDeparture | Null if not available. |",
    "| minutes_available | Minutes available as requested by user | float | minutes | userInputs.minutesAvailable | Null if not available. |",
    "| payment_required | Whether payment was required | boolean | N/A | userInputs.paymentRequired | Null if not available. |"
]
DICT_OUTPUT = os.path.join(REPORTS_DIR, "dataset3_data_dictionary.md")
with open(DICT_OUTPUT, 'w') as f:
    f.write("\n".join(dict_lines))

# Step 9 - Final verification print
print("\n==================================================")
print("STEP 9 — FINAL VERIFICATION")
print("==================================================")
print(f"1. Dataset shape: {df.shape}")
print(f"2. Column names: {df.columns.tolist()}")
print("\n3. First 10 rows:")
print(df.head(10).to_string())
print("\n4. Last 5 rows:")
print(df.tail(5).to_string())
print("\n5. Missing-value summary:")
print(df.isnull().sum())
print(f"\n6. Duplicate count: {df.duplicated().sum()}")
print("\n7. Descriptive statistics:")
print(df.describe())
print(f"\n8. Number of unique sessions: {df['session_id'].nunique()}")
print(f"9. Number of unique stations: {df['station_id'].nunique()}")
print(f"10. Number of unique sites: {df['site_id'].nunique()}")

# Step 10 - Compatibility Output
print("\n==================================================")
print("SUMMARY")
print("==================================================")
print(f"- Downloaded: {INPUT_JSON}")
print("- Cleaned: Extracted standard fields, calculated durations, handled types, removed negative/invalid values, and deduplicated.")
print(f"- Retained: {final_count} records (removed {initial_count - final_count}).")
print("- Created Columns: session_id, station_id, site_id, space_id, user_id, connection_time, charging_start_time, charging_end_time, disconnect_time, charging_duration_min, connection_duration_min, energy_consumed_kwh, timezone, requested_energy_kwh, requested_range_miles, requested_departure_time, minutes_available, payment_required")
print("- Unavailable Information: True 'charging_start_time' separate from 'connection_time' (used connection_time). User inputs were often null.")
print(f"- Final Dataset 3 file saved to: {CSV_OUTPUT}")
