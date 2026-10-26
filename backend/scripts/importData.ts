import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import Models
import Station from '../src/models/Station';
import Vehicle from '../src/models/Vehicle';
import ChargingSession from '../src/models/ChargingSession';
import DemandData from '../src/models/DemandData';

dotenv.config();

const DATA_DIR = path.join(__dirname, '../../data');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is undefined');
  await mongoose.connect(uri);
  console.log('MongoDB connected for Data Import.\n');
};

const processCSV = <T>(filePath: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().replace(/^[\uFEFF\u200B]+/, '')
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

const importStations = async () => {
  const data = await processCSV<any>(path.join(DATA_DIR, '02_tamil_nadu_openchargemap.csv'));
  
  let valid = 0, invalid = 0;

  for (const row of data) {
    if (!row.station_id || !row.latitude || !row.longitude) {
      invalid++;
      continue;
    }

    const stationData = {
      name: row.station_name || 'Unknown Station',
      location: {
        type: 'Point',
        coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
      },
      address: row.address || 'Unknown Address',
      city: row.city,
      state: row.state,
      postcode: row.postcode,
      zone: row.city || 'Chennai',
      zoneType: 'Urban',
      status: row.status || 'Operational',
      powerCapacityKw: parseFloat(row.power_kw) || 0,
      totalChargers: parseFloat(row.quantity) || 1,
      availableChargers: parseFloat(row.quantity) || 1,
      utilization: Math.floor(Math.random() * 50) + 10, // Simulated baseline
      rating: 4.5,
      uptime: 99.9
    };

    await Station.updateOne(
      { stationId: row.station_id },
      { $set: stationData },
      { upsert: true }
    );
    valid++;
  }
  return { total: data.length, valid, invalid };
};

const importVehicles = async () => {
  const data = await processCSV<any>(path.join(DATA_DIR, 'ev_vehicle_specs.csv'));
  
  let valid = 0, invalid = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row.brand || !row.model) {
      invalid++;
      continue;
    }

    // Creating unique ID since dataset doesn't have one
    const vehicleId = `VEH-${row.brand.substring(0,3).toUpperCase()}-${i.toString().padStart(4, '0')}`;
    
    const vehicleData = {
      brand: row.brand,
      vehicleModel: row.model,
      batteryCapacityKwh: parseFloat(row.battery_capacity_kWh) || 50,
      rangeKm: parseFloat(row.range_km) || 200,
      energyConsumption: parseFloat(row.efficiency_wh_per_km) || 150,
      status: 'ACTIVE'
    };

    await Vehicle.updateOne(
      { vehicleId },
      { $set: vehicleData },
      { upsert: true }
    );
    valid++;
  }
  return { total: data.length, valid, invalid };
};

const importSessions = async () => {
  const data = await processCSV<any>(path.join(DATA_DIR, 'cleaned', 'ev_charging_sessions.csv'));
  
  let valid = 0, invalid = 0;
  // Limit to 5000 to prevent long hanging if dataset is massive, but we should import all realistically.
  // The user prompt said to use upsert and print exactly the counts.

  for (const row of data) {
    if (!row.session_id || !row.station_id || !row.charging_start_time) {
      invalid++;
      continue;
    }

    const sessionData = {
      stationId: row.station_id,
      chargerId: row.space_id,
      userId: row.user_id || 'anonymous',
      startTime: new Date(row.charging_start_time),
      endTime: row.charging_end_time ? new Date(row.charging_end_time) : undefined,
      energyKwh: parseFloat(row.energy_consumed_kwh) || 0,
      durationMinutes: parseFloat(row.charging_duration_min) || 0,
      cost: (parseFloat(row.energy_consumed_kwh) || 0) * 15, // 15 INR per kWh
      status: 'COMPLETED'
    };

    await ChargingSession.updateOne(
      { sessionId: row.session_id },
      { $set: sessionData },
      { upsert: true }
    );
    valid++;
  }
  return { total: data.length, valid, invalid };
};

const importDemand = async () => {
  const data = await processCSV<any>(path.join(DATA_DIR, 'traffic.csv'));
  
  let valid = 0, invalid = 0;
  const bulkOps = [];

  for (const row of data) {
    if (!row.ID || !row.DateTime) {
      invalid++;
      continue;
    }

    const demandData = {
      location: `Junction-${row.Junction}`,
      zone: 'Central',
      timestamp: new Date(row.DateTime),
      demandScore: parseInt(row.Vehicles) || 0,
      sessions: Math.floor((parseInt(row.Vehicles) || 0) * 0.1),
      energyDemandKwh: (parseInt(row.Vehicles) || 0) * 2.5
    };

    bulkOps.push({
      updateOne: {
        filter: { location: demandData.location, timestamp: demandData.timestamp },
        update: { $set: demandData },
        upsert: true
      }
    });
    valid++;

    // Execute in batches of 5000 to avoid memory issues
    if (bulkOps.length === 5000) {
      await DemandData.bulkWrite(bulkOps);
      bulkOps.length = 0; // Clear the array
    }
  }

  // Execute remaining operations
  if (bulkOps.length > 0) {
    await DemandData.bulkWrite(bulkOps);
  }

  return { total: data.length, valid, invalid };
};

const runImport = async () => {
  try {
    await connectDB();
    console.log('GridWise Data Import\n====================\n');

    console.log('Importing Stations...');
    const stationStats = await importStations();
    console.log(`Stations:\n${stationStats.total} records (Valid: ${stationStats.valid}, Invalid: ${stationStats.invalid})\n`);

    console.log('Importing Vehicles...');
    const vehicleStats = await importVehicles();
    console.log(`Vehicles:\n${vehicleStats.total} records (Valid: ${vehicleStats.valid}, Invalid: ${vehicleStats.invalid})\n`);

    console.log('Importing Sessions...');
    const sessionStats = await importSessions();
    console.log(`Charging Sessions:\n${sessionStats.total} records (Valid: ${sessionStats.valid}, Invalid: ${sessionStats.invalid})\n`);

    console.log('Importing Demand Data...');
    const demandStats = await importDemand();
    console.log(`Demand Data:\n${demandStats.total} records (Valid: ${demandStats.valid}, Invalid: ${demandStats.invalid})\n`);

    console.log('Import completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Data import failed:', error);
    process.exit(1);
  }
};

runImport();
