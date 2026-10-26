import os
import requests
import json
import pandas as pd
from datetime import datetime

# Define directories
PROJECT_DIR = r"c:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise"
DATASET5_DIR = os.path.join(PROJECT_DIR, "data", "raw", "dataset5")
os.makedirs(DATASET5_DIR, exist_ok=True)

# API details
API_KEY = "bb29c3e7-e7fe-4c1c-ab54-0fc58e63ae1b"
ENDPOINT = "https://api.openchargemap.io/v3/poi/"

print("1. Fetching data from Open Charge Map API for India...")
params = {
    "key": API_KEY,
    "output": "json",
    "countrycode": "IN",
    "maxresults": 100000,
    "compact": "false",
    "verbose": "false"
}

try:
    response = requests.get(ENDPOINT, params=params, timeout=120)
    response.raise_for_status()
    data = response.json()
except Exception as e:
    print(f"Error fetching data: {e}")
    exit(1)

# Save original API response
RAW_JSON_PATH = os.path.join(DATASET5_DIR, "charging_stations_raw.json")
with open(RAW_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Raw JSON saved to {RAW_JSON_PATH}")

# Parse into structured CSV
print("2. Parsing raw data into structured format...")
rows = []
for station in data:
    address_info = station.get("AddressInfo", {})
    operator_info = station.get("OperatorInfo", {})
    usage_type = station.get("UsageType", {})
    status_type = station.get("StatusType", {})
    data_provider = station.get("DataProvider", {})
    connections = station.get("Connections", [])

    base_record = {
        "station_id": station.get("ID"),
        "station_name": address_info.get("Title"),
        "latitude": address_info.get("Latitude"),
        "longitude": address_info.get("Longitude"),
        "country": address_info.get("Country", {}).get("Title"),
        "state": address_info.get("StateOrProvince"),
        "city": address_info.get("Town"),
        "address": address_info.get("AddressLine1"),
        "operator": operator_info.get("Title"),
        "usage_type": usage_type.get("Title") if usage_type else None,
        "operational_status": status_type.get("Title") if status_type else None,
        "number_of_stations": station.get("NumberOfPoints"),
        "data_provider": data_provider.get("Title") if data_provider else None
    }

    if not connections:
        # If no connections listed, still keep the station record with None for connection details
        record = base_record.copy()
        record.update({
            "connector_type": None,
            "charging_power_kw": None,
            "level": None
        })
        rows.append(record)
    else:
        # Expand into multiple rows per connection
        for conn in connections:
            conn_type = conn.get("ConnectionType", {})
            level = conn.get("Level", {})
            record = base_record.copy()
            record.update({
                "connector_type": conn_type.get("Title") if conn_type else None,
                "charging_power_kw": conn.get("PowerKW"),
                "level": level.get("Title") if level else None
            })
            rows.append(record)

df = pd.DataFrame(rows)

CSV_PATH = os.path.join(DATASET5_DIR, "charging_stations.csv")
df.to_csv(CSV_PATH, index=False, encoding="utf-8-sig")
print(f"Structured CSV saved to {CSV_PATH}")

# 3. Report
print("\n" + "="*50)
print("DATASET 5 REPORT")
print("="*50)
print(f"Number of charging locations (unique): {df['station_id'].nunique()}")
print(f"Number of stations/connectors (rows): {len(df)}")
print(f"Countries included: {df['country'].dropna().unique().tolist()}")
indian_locs = df[df['country'].astype(str).str.contains('India', case=False, na=False)]['station_id'].nunique()
print(f"Number of Indian locations: {indian_locs}")
print(f"Available columns: {df.columns.tolist()}")

print("\nMissing values per column:")
print(df.isnull().sum().to_string())

dup_stations = len(df) - len(df.drop_duplicates(subset=['station_id']))
print(f"\nDuplicate station IDs (due to multiple connectors): {dup_stations}")
print(f"Date/time of retrieval: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*50)
