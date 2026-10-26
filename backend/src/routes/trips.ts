import { Router, Request, Response, NextFunction } from 'express';
import { forwardGeocode } from '../services/geocodingService';
import { getRoute } from '../services/osrmService';
import Station from '../models/Station';

const router = Router();

router.post('/plan', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start, destination, vehicle_id } = req.body;

    if (!start || !destination) {
      res.status(400).json({ success: false, message: 'Start and destination are required' });
      return;
    }

    // 1. Geocode Start and Destination
    const startLocs = await forwardGeocode(start);
    const destLocs = await forwardGeocode(destination);

    if (!startLocs.length || !destLocs.length) {
      res.status(400).json({ success: false, message: 'Could not resolve locations' });
      return;
    }

    const fromLat = startLocs[0].lat;
    const fromLng = startLocs[0].lng;
    const toLat = destLocs[0].lat;
    const toLng = destLocs[0].lng;

    // 2. Calculate Actual Route via OSRM
    const routeData = await getRoute({ fromLat, fromLng, toLat, toLng });
    const distanceKm = routeData.distanceKm;
    const drivingMinutes = routeData.durationMinutes;

    // 3. Simple EV Battery Simulation 
    // Assuming Tesla Model 3 SR+ has ~400km real world range. 1% = 4km
    const initial_battery = 78; 
    const rangePerPercent = 4.0;
    
    let batteryNeeded = distanceKm / rangePerPercent;
    let arrival_battery = Math.round(initial_battery - batteryNeeded);
    
    let charging_minutes = 0;
    let stops: any[] = [];
    
    // If we drop below 15% we need a charging stop
    if (arrival_battery < 15) {
      // Find a midpoint to search for a station
      const midLat = (fromLat + toLat) / 2;
      const midLng = (fromLng + toLng) / 2;

      // 4. Query MongoDB for real charging stations near the route's midpoint!
      const stations = await Station.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [midLng, midLat]
            },
            $maxDistance: 50000 // 50km radius from midpoint
          }
        }
      }).limit(1);

      let stationName = 'GridWise Partner Fast Charger';
      let stationLoc = { lat: midLat, lng: midLng };
      if (stations && stations.length > 0) {
        stationName = stations[0].name;
        stationLoc = { lat: stations[0].location.coordinates[1], lng: stations[0].location.coordinates[0] };
      }

      // Need to charge back up to 80% to reach comfortably
      const chargeNeeded = (15 - arrival_battery) + 50; 
      charging_minutes = Math.round(chargeNeeded * 0.5); // Assume 0.5 mins per % on DCFC
      
      const arriveBatteryAtStop = Math.max(10, Math.round(initial_battery - ((distanceKm/2) / rangePerPercent)));
      const leaveBatteryAtStop = Math.min(100, arriveBatteryAtStop + Math.round(chargeNeeded));

      stops.push({
        station_name: stationName,
        charge_time_minutes: charging_minutes,
        arrive_battery: arriveBatteryAtStop,
        leave_battery: leaveBatteryAtStop,
        lat: stationLoc.lat,
        lng: stationLoc.lng
      });
      
      arrival_battery = Math.round(leaveBatteryAtStop - ((distanceKm/2) / rangePerPercent));
    }

    const total_time_minutes = drivingMinutes + charging_minutes;

    res.status(200).json({
      success: true,
      data: {
        start: startLocs[0].displayName.split(',')[0],
        destination: destLocs[0].displayName.split(',')[0],
        total_distance_km: Math.round(distanceKm),
        total_time_minutes,
        driving_minutes: drivingMinutes,
        charging_minutes,
        initial_battery,
        arrival_battery: Math.max(0, arrival_battery),
        stops,
        geometry: routeData.geometry,
        coordinates: {
          start: { lat: fromLat, lng: fromLng },
          end: { lat: toLat, lng: toLng }
        }
      }
    });
  } catch (error: any) {
    console.error('Error planning trip:', error);
    res.status(500).json({ success: false, message: 'Failed to plan trip' });
  }
});

export default router;
