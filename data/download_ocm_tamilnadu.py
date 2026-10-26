import requests
import pandas as pd
import time

API_KEY = "7ca33e16-f998-4f63-b702-a3bda6f616ec"

OUTPUT_FILE = "02_tamil_nadu_openchargemap.csv"

# Tamil Nadu cities / regions
locations = {
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Tiruchirappalli": (10.7905, 78.7047),
    "Salem": (11.6643, 78.1460),
    "Tiruppur": (11.1085, 77.3411),
    "Erode": (11.3410, 77.7172),
    "Vellore": (12.9165, 79.1325),
    "Thoothukudi": (8.7642, 78.1348),
    "Tirunelveli": (8.7139, 77.7567),
    "Thanjavur": (10.7870, 79.1378),
    "Dindigul": (10.3673, 77.9803),
    "Hosur": (12.7409, 77.8253),
    "Karur": (10.9601, 78.0766),
    "Namakkal": (11.2194, 78.1677),
    "Cuddalore": (11.7480, 79.7714),
    "Kanchipuram": (12.8342, 79.7036),
    "Kumbakonam": (10.9602, 79.3845),
    "Nagercoil": (8.1833, 77.4119),
    "Ramanathapuram": (9.3639, 78.8395)
}

all_stations = []

for city, (lat, lon) in locations.items():

    print(f"\nDownloading: {city}")

    params = {
        "key": API_KEY,
        "output": "json",
        "countrycode": "IN",
        "latitude": lat,
        "longitude": lon,
        "distance": 75,
        "distanceunit": "KM",
        "maxresults": 1000,
        "compact": "false",
        "verbose": "false"
    }

    try:

        response = requests.get(
            "https://api.openchargemap.io/v3/poi/",
            params=params,
            timeout=60
        )

        response.raise_for_status()

        data = response.json()

        print(f"Stations received: {len(data)}")

        all_stations.extend(data)

        time.sleep(1)

    except Exception as e:

        print(f"ERROR in {city}: {e}")


# Remove duplicate stations using Open Charge Map ID
unique = {}

for station in all_stations:

    station_id = station.get("ID")

    if station_id:
        unique[station_id] = station


print("\n-------------------------")
print("Total downloaded:", len(all_stations))
print("Unique stations:", len(unique))
print("-------------------------")


rows = []

for station in unique.values():

    address = station.get("AddressInfo") or {}
    operator = station.get("OperatorInfo") or {}

    connections = station.get("Connections") or []

    # One row per charger/connection
    for connection in connections:

        connection_type = (
            connection.get("ConnectionType") or {}
        )

        rows.append({

            "station_id":
                station.get("ID"),

            "station_name":
                address.get("Title"),

            "operator":
                operator.get("Title"),

            "address":
                address.get("AddressLine1"),

            "city":
                address.get("Town"),

            "state":
                address.get("StateOrProvince"),

            "postcode":
                address.get("Postcode"),

            "latitude":
                address.get("Latitude"),

            "longitude":
                address.get("Longitude"),

            "country":
                (
                    address.get("Country") or {}
                ).get("Title"),

            "connector_type":
                connection_type.get("Title"),

            "charging_type":
                connection_type.get("FormalName"),

            "power_kw":
                connection.get("PowerKW"),

            "voltage":
                connection.get("Voltage"),

            "amps":
                connection.get("Amps"),

            "quantity":
                connection.get("Quantity"),

            "status":
                (
                    station.get("StatusType") or {}
                ).get("Title"),

            "usage_type":
                (
                    station.get("UsageType") or {}
                ).get("Title"),

            "access_comments":
                station.get("AccessComments"),

            "source":
                "Open Charge Map"
        })


df = pd.DataFrame(rows)

# Filter Tamil Nadu
df = df[
    df["state"]
    .fillna("")
    .str.lower()
    .str.contains("tamil")
]

df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\nFINAL FILE CREATED:")
print(OUTPUT_FILE)

print("\nRows:", len(df))
print("Stations:", df["station_id"].nunique())

print("\nConnector types:")
print(df["connector_type"].value_counts(dropna=False))

print("\nCharging types:")
print(df["charging_type"].value_counts(dropna=False))

print("\nPower statistics:")
print(df["power_kw"].describe())