# GridWise Mock Data Audit

This document identifies all potential mock, dummy, fake, or hardcoded data in the application.

## FRONTEND
### `components/booking/BookingConfirmation.tsx`
- Line 17: `const total = booking.estimatedCost + 10 + 35; // including mock fees`

### `components/booking/BookingSuccess.tsx`
- Line 58: `<QRCodePlaceholder bookingId={bookingId} />`

### `components/booking/DurationSelector.tsx`
- Line 3: `const mockDurations: any[] = [];`
- Line 20: `{mockDurations.map(dur => {`

### `components/booking/QRCodePlaceholder.tsx`
- Line 3: `interface QRCodePlaceholderProps {`
- Line 7: `const QRCodePlaceholder: React.FC<QRCodePlaceholderProps> = ({ bookingId }) => {`
- Line 11: `{/* Mock QR pattern */}`
- Line 28: `export default QRCodePlaceholder;`

### `components/community/CommunityChargerMap.tsx`
- Line 12: `// Deterministic mock positions for the map`
- Line 39: `{/* Mock Roads */}`
- Line 45: `{/* Mock Parks/Water */}`

### `components/community/CommunityInsights.tsx`
- Line 5: `const mockCommunityInsights: any[] = [];`
- Line 14: `value={`₹${mockCommunityInsights.averagePrice ?? 14}/kWh`}`
- Line 21: `value={`${mockCommunityInsights.averageRating ?? 4.8} ★`}`
- Line 27: `value={(mockCommunityInsights.availableChargers ?? 24).toString()}`
- Line 34: `value={`${mockCommunityInsights.averagePower ?? 7.2} kW`}`

### `components/community/CommunitySearch.tsx`
- Line 27: `placeholder="Search location, landmark or area..."`

### `components/community/ListChargerModal.tsx`
- Line 49: `<input required type="text" placeholder="e.g. My Home EV Charger" className="w-full bg-slate-50 bord...`
- Line 64: `<input required type="number" min="1" step="0.1" placeholder="e.g. 7.4" className="w-full bg-slate-5...`
- Line 70: `<input required type="text" placeholder="Street, City, Postal Code" className="w-full bg-slate-50 bo...`
- Line 79: `<option value="CHAdeMO">CHAdeMO</option>`
- Line 84: `<input required type="number" min="0" step="0.5" placeholder="e.g. 12" className="w-full bg-slate-50...`
- Line 90: `<input type="text" placeholder="e.g. Parking, Wi-Fi, Restroom" className="w-full bg-slate-50 border ...`

### `components/demand/DemandFactors.tsx`
- Line 35: `These are simulated demand inputs for demonstration.`

### `components/demand/DemandForecastChart.tsx`
- Line 80: `{/* Visual Chart Placeholder for History vs Predicted */}`

### `components/demand/DemandHeatmap.tsx`
- Line 33: `{/* Fake Map Background using SVG */}`

### `components/demand/QueueAnalysis.tsx`
- Line 21: `const MOCK_VEHICLE_ID = 'V-USER-999'; // Simulating the logged in user`
- Line 49: `if (data.vehicleId === MOCK_VEHICLE_ID) setMyPosition(data.position + 1);`
- Line 69: `const res = await postApi<any>('/queue/join', { stationId, vehicleId: MOCK_VEHICLE_ID });`
- Line 76: `await postApi<any>('/queue/leave', { stationId, vehicleId: MOCK_VEHICLE_ID });`

### `components/infrastructure/InfrastructureFilters.tsx`
- Line 11: `placeholder="Search zone or corridor..."`

### `components/infrastructure/InfrastructureMap.tsx`
- Line 32: `{/* Fake Map Background using SVG */}`

### `components/layout/AppLayout.tsx`
- Line 178: `placeholder="Search stations, fleets, users..."`

### `components/layout/Header.tsx`
- Line 4: `const mockUser: any = {};`
- Line 52: `src={mockUser.avatarUrl}`
- Line 53: `alt={mockUser.name}`
- Line 57: `<p className="text-sm font-semibold text-slate-900 leading-tight">{mockUser.name}</p>`
- Line 58: `<p className="text-xs text-slate-500 leading-tight">{mockUser.role}</p>`

### `components/payments/AddMoneyModal.tsx`
- Line 86: `placeholder="Enter amount"`

### `components/payments/AddPaymentMethodModal.tsx`
- Line 33: `Use mock details only. This frontend does not process real payments or store real credentials.`
- Line 67: `<input type="text" placeholder="Mock Name" required className="w-full p-3 bg-slate-50 border border-...`
- Line 71: `<input type="text" placeholder="0000 0000 0000 0000" maxLength={19} required className="w-full p-3 b...`
- Line 76: `<input type="text" placeholder="MM/YY" maxLength={5} required className="w-full p-3 bg-slate-50 bord...`
- Line 80: `<input type="password" placeholder="***" maxLength={4} required className="w-full p-3 bg-slate-50 bo...`
- Line 89: `<input type="text" placeholder="mock@upi" required className="w-full p-3 bg-slate-50 border border-s...`
- Line 97: `<option value="">Choose mock bank</option>`
- Line 98: `<option value="sbi">Mock Bank 1</option>`
- Line 99: `<option value="hdfc">Mock Bank 2</option>`
- Line 100: `<option value="icici">Mock Bank 3</option>`

### `components/payments/PromoCard.tsx`
- Line 29: `placeholder="Enter promo code"`

### `components/payments/TransactionFilters.tsx`
- Line 31: `placeholder="Search transactions..."`

### `components/planner/LiveSessions.tsx`
- Line 32: `const progress = ((session.currentBattery - 20) / (session.targetBattery - 20)) * 100; // Mock calcu...`

### `components/planner/PlannerFilters.tsx`
- Line 34: `placeholder="Search station or charger..."`

### `components/planner/PlannerMap.tsx`
- Line 28: `{/* Fake Map Background using SVG pattern */}`
- Line 37: `{/* Fake roads */}`

### `components/rescue/RescueMap.tsx`
- Line 13: `{/* Mock Map Background */}`
- Line 63: `// Route from Rescue to Vehicle (Mock Path)`

### `components/rescue/RescueSuccess.tsx`
- Line 48: `onClick={() => navigate('/dashboard')} // Mocking /trips since it's not built yet (Step 9 maybe?)`

### `components/route/RouteInput.tsx`
- Line 31: `placeholder="Start Location"`
- Line 44: `placeholder="Destination"`

### `components/route/RouteMap.tsx`
- Line 25: `// Pick a couple of mock stations near the route`

### `components/shared/SearchBar.tsx`
- Line 5: `placeholder?: string;`
- Line 11: `const SearchBar: React.FC<SearchBarProps> = ({ placeholder = "Search...", value, onChange, className...`
- Line 17: `placeholder={placeholder}`

### `components/stations/StationDetailsModal.tsx`
- Line 93: `<p className="text-sm text-slate-500">CCS2 / CHAdeMO compatible</p>`

### `components/stations/StationMap.tsx`
- Line 13: `// Mock positions for the 8 stations (in percentages)`
- Line 14: `const mockPositions: Record<string, { top: string; left: string }> = {`
- Line 29: `{/* Mock Map Background Graphics */}`
- Line 36: `{/* Fake roads */}`
- Line 54: `const pos = mockPositions[station.id] || { top: '50%', left: '50%' };`

### `components/stations/StationSearch.tsx`
- Line 52: `className="block w-full h-full min-h-[56px] pl-12 pr-12 rounded-xl border border-slate-200 bg-white ...`
- Line 53: `placeholder="Search charging stations, locations or landmarks..."`

### `components/trips/TripCalendar.tsx`
- Line 8: `// Mock calendar generation (August 2026 starts on Saturday, 31 days)`

### `components/trips/TripRoutePreview.tsx`
- Line 35: `{/* Moving Car Mock */}`

### `components/trips/TripSearch.tsx`
- Line 18: `placeholder="Search trips by origin, destination or date..."`

### `pages/AdminDashboard.tsx`
- Line 11: `const mockAdminUsers: any[] = [];`
- Line 12: `const mockSystemHealth: any = {};`
- Line 42: `<SystemHealth health={mockSystemHealth} />`
- Line 60: `<UserTable users={mockAdminUsers} onView={setSelectedUser} />`

### `pages/AIInsights.tsx`
- Line 9: `const mockAIActivity: any[] = [];`
- Line 82: `{mockAIActivity.map(act => (`

### `pages/AIRecommendations.tsx`
- Line 34: `// Run the mock engine`
- Line 37: `}, []); // Run once for mock data`

### `pages/BatteryStatus.tsx`
- Line 4: `const mockBatteryStatus: any = { percentage: 0, energyAvailableKwh: 0, capacityKwh: 0, estimatedRang...`
- Line 5: `const mockChargingHistory: any[] = [];`
- Line 6: `const mockBatteryInsights: any[] = [];`
- Line 78: `<BatteryHero status={mockBatteryStatus} />`
- Line 81: `<BatteryDetails status={mockBatteryStatus} />`
- Line 101: `<ChargingHistory sessions={mockChargingHistory} />`
- Line 132: `<BatteryInsights insights={mockBatteryInsights} />`

### `pages/CommunityChargers.tsx`
- Line 4: `const mockCommunityChargers: any[] = [];`
- Line 5: `const mockCommunityHosts: any[] = [];`
- Line 6: `const mockCommunityActivity: any[] = [];`
- Line 28: `const filteredChargers = mockCommunityChargers.filter(charger => {`
- Line 50: `const selectedCharger = mockCommunityChargers.find(c => c.id === selectedChargerId);`
- Line 52: `? mockCommunityHosts.find(h => h.name.includes(selectedCharger.hostName)) || mockCommunityHosts[0]`
- Line 174: `<TopHosts hosts={mockCommunityHosts} />`
- Line 176: `<CommunityActivity activities={mockCommunityActivity} />`

### `pages/Dashboard.tsx`
- Line 14: `const mockUser: any = { name: "User" };`
- Line 15: `const mockBatteryStatus: any = { currentPercentage: 0, estimatedRangeKm: 0, capacityKwh: 0, statusTe...`
- Line 16: `const mockBooking: any = { stationName: "No Booking", date: "-", time: "-", connector: "-", duration...`
- Line 17: `const mockTripSummary: any = { distanceTravelledKm: 0, energyConsumedKwh: 0, chargingSessions: 0, av...`
- Line 74: `Good evening, {mockUser.name.split(' ')[0] || "User"} <span className="inline-block animate-[wave_2....`
- Line 90: `<StatCard title="Current Battery" value={`${mockBatteryStatus.currentPercentage}%`} icon={Battery} c...`
- Line 91: `<StatCard title="Estimated Range" value={`${mockBatteryStatus.estimatedRangeKm} km`} icon={Navigatio...`
- Line 92: `<StatCard title="Today's Distance" value={`${mockTripSummary.distanceTravelledKm} km`} icon={Route} ...`
- Line 100: `<BatteryCard battery={mockBatteryStatus} />`
- Line 130: `<BookingCard booking={mockBooking} />`
- Line 133: `<TripSummaryCard summary={mockTripSummary} />`

### `pages/DemandIntelligence.tsx`
- Line 4: `const mockDemandZones: any[] = [];`
- Line 5: `const mockHourlyDemand: any = {};`
- Line 6: `const mockDemandForecast: any = {};`
- Line 7: `const mockCapacityRecommendations: any[] = [];`
- Line 8: `const mockStationCongestion: any = [];`
- Line 9: `const mockDemandFactors: any[] = [];`
- Line 10: `const mockDemandAlerts: any[] = [];`
- Line 11: `const mockGrowthTrend: any = {};`
- Line 70: `setHourlyDemand(mappedTrends.length > 0 ? mappedTrends : mockHourlyDemand);`
- Line 71: `setDemandZones(mappedZones.length > 0 ? mappedZones : mockDemandZones);`
- Line 112: `<DemandForecast data={mockDemandForecast} />`
- Line 124: `<LowDemandZones zones={mockDemandZones} />`
- Line 130: `<ZoneCapacityTable recommendations={mockCapacityRecommendations} />`
- Line 134: `<DemandAlerts alerts={mockDemandAlerts} />`
- Line 137: `<StationCongestion stations={mockStationCongestion} />`
- Line 142: `<GrowthTrend data={mockGrowthTrend} />`
- Line 150: `<DemandFactors factors={mockDemandFactors} />`
- Line 151: `<DemandFactorImpact factors={mockDemandFactors} />`

### `pages/EmergencyRescue.tsx`
- Line 4: `const mockRescueUnits: any[] = [];`
- Line 5: `const mockNearestChargers: any[] = [];`
- Line 6: `const mockRescueHistory: any[] = [];`
- Line 50: `// Mock Complete`
- Line 102: `{mockRescueUnits.map(unit => (`
- Line 132: `(Mock) Simulate Arrival & Completion`
- Line 143: `<RescueMap rescueUnits={mockRescueUnits} status={mapStatusStr} />`
- Line 152: `<NearestChargers chargers={mockNearestChargers} />`
- Line 156: `<RescueHistory records={mockRescueHistory} />`

### `pages/FleetManagement.tsx`
- Line 8: `const mockFleetAlerts: any[] = [];`
- Line 68: `<FleetAlertsWidget alerts={mockFleetAlerts} />`

### `pages/HelpSupport.tsx`
- Line 44: `placeholder="Search for articles, questions, or topics..."`

### `pages/InfrastructureGap.tsx`
- Line 33: `const mockInfraZones: any[] = [];`
- Line 34: `const mockExpansionRecs: any[] = [];`
- Line 35: `const mockHighwayCorridors: any[] = [];`
- Line 36: `const mockChargingDeserts: any[] = [];`
- Line 37: `const mockChargerTypeGaps: any[] = [];`
- Line 38: `const mockPowerCapacity: any = {};`
- Line 39: `const mockInfraRisks: any[] = [];`
- Line 49: `const rec = mockExpansionRecs.find(r => r.zoneId === zoneId);`
- Line 78: `<InfrastructureMap zones={mockInfraZones} />`
- Line 96: `<ZoneGapTable zones={mockInfraZones} />`
- Line 100: `<UnderservedAreas zones={mockInfraZones} />`
- Line 112: `recommendations={mockExpansionRecs}`
- Line 127: `<PriorityMatrix zones={mockInfraZones} />`
- Line 128: `<DemandInfrastructureChart zones={mockInfraZones} />`
- Line 137: `<ChargingDeserts deserts={mockChargingDeserts} />`
- Line 140: `<HighwayCoverage corridors={mockHighwayCorridors} />`
- Line 146: `<ChargerTypeGap gaps={mockChargerTypeGaps} />`
- Line 147: `<PowerCapacityGap capacity={mockPowerCapacity} />`
- Line 148: `<RecommendedChargerMix recommendations={mockExpansionRecs} />`
- Line 167: `<ROIPriority recommendations={mockExpansionRecs} />`
- Line 174: `<InfrastructureRisks risks={mockInfraRisks} />`
- Line 180: `<InfrastructureReadiness zones={mockInfraZones} />`

### `pages/Login.tsx`
- Line 63: `className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm place...`
- Line 78: `className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm place...`

### `pages/Payments.tsx`
- Line 7: `const mockTransactions: any[] = [];`
- Line 8: `const mockMonthlySpendingChart: any = {};`
- Line 9: `const mockSpendingBreakdown: any = {};`
- Line 10: `const mockInitialPreferences: any = { lowBalanceAlerts: false };`
- Line 36: `const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);`
- Line 37: `const [prefs, setPrefs] = useState(mockInitialPreferences);`
- Line 117: `case 'Newest': /* Mock is already sorted */ break;`
- Line 225: `<MonthlySpending data={mockMonthlySpendingChart} />`
- Line 226: `<SpendingBreakdown data={mockSpendingBreakdown} />`

### `pages/PlannerDashboard.tsx`
- Line 5: `const mockPlannerStations: any[] = [];`
- Line 6: `const mockMaintenanceAlerts: any[] = [];`
- Line 7: `const mockChargingSessions: any[] = [];`
- Line 8: `const mockChargerUtilizationChart: any = {};`
- Line 9: `const mockRevenueAnalytics: any[] = [];`
- Line 10: `const mockEnergyAnalytics: any[] = [];`
- Line 11: `const mockCustomerSatisfaction: any = {};`
- Line 12: `const mockOperationsActivity: any[] = [];`
- Line 13: `const mockDemandRanking: any = {};`
- Line 14: `const mockCapacityRecommendations: any[] = [];`
- Line 95: `// Fallback safely to mock if needed, but we keep it empty on error for realism`
- Line 174: `<ChargerUtilization data={mockChargerUtilizationChart} />`
- Line 178: `<OperationsActivity activities={mockOperationsActivity} />`
- Line 183: `<RevenueAnalytics data={mockRevenueAnalytics} />`
- Line 184: `<EnergyAnalytics data={mockEnergyAnalytics} />`
- Line 197: `<MaintenanceAlerts alerts={mockMaintenanceAlerts} />`
- Line 207: `<DemandRanking data={mockDemandRanking} />`
- Line 210: `<CapacityRecommendations data={mockCapacityRecommendations} />`
- Line 222: `<CustomerSatisfaction data={mockCustomerSatisfaction} />`

### `pages/Register.tsx`
- Line 84: `className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm place...`
- Line 99: `className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm place...`
- Line 114: `className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm place...`
- Line 129: `className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm place...`

### `pages/RoutePlanner.tsx`
- Line 15: `const mockVehicle: any = {};`
- Line 115: `<VehicleSelector vehicle={mockVehicle} />`
- Line 176: `<ChargingStrategyCard route={selectedRoute} vehicle={mockVehicle} />`

### `pages/Settings.tsx`
- Line 147: `<input type="password" placeholder="Current Password" className="w-full px-4 py-2.5 bg-slate-50 bord...`
- Line 148: `<input type="password" placeholder="New Password" className="w-full px-4 py-2.5 bg-slate-50 border b...`

### `pages/TripHistory.tsx`
- Line 7: `const mockTrips: any[] = [];`
- Line 8: `const mockChargingSessions: any[] = [];`
- Line 9: `const mockTripSummary: any = {};`
- Line 10: `const mockMonthlyTravel: any = {};`
- Line 11: `const mockMonthlyChartData: any[] = [];`
- Line 12: `const mockWeeklyData: any[] = [];`
- Line 13: `const mockFavoriteRoutes: any[] = [];`
- Line 14: `const mockDrivingBehavior: any = {};`
- Line 63: `let result = [...mockTrips];`
- Line 88: `case 'Newest': /* Mock data already sorted somewhat */ break;`
- Line 153: `<TripSummaryCards summary={mockTripSummary} />`
- Line 161: `<TripAnalytics trips={mockTrips} />`
- Line 202: `<ChargingHistory sessions={mockChargingSessions} />`
- Line 214: `<FavoriteRoutes routes={mockFavoriteRoutes} />`
- Line 216: `<MonthlyTravel data={mockMonthlyTravel} chartData={mockMonthlyChartData} />`
- Line 217: `<WeeklyActivity data={mockWeeklyData} />`
- Line 220: `<DrivingBehavior behavior={mockDrivingBehavior} />`

### `types/route.ts`
- Line 4: `coordinates: { x: number; y: number }; // Percentage for mock map positioning`

### `utils/api.ts`
- Line 30: `const data = await response.json();`


## BACKEND
### `app.ts`
- Line 20: `app.use(express.json());`

### `controllers/adminController.ts`
- Line 25: `res.status(200).json({ success: true, users });`
- Line 28: `res.status(500).json({ success: false, message: 'Internal server error' });`
- Line 38: `res.status(400).json({ success: false, message: 'Invalid role provided' });`
- Line 44: `res.status(404).json({ success: false, message: 'User not found' });`
- Line 50: `res.status(200).json({ success: true, message: `User role updated to ${role}` });`
- Line 53: `res.status(500).json({ success: false, message: 'Internal server error' });`
- Line 60: `res.status(200).json({ success: true, logs });`
- Line 63: `res.status(500).json({ success: false, message: 'Internal server error' });`

### `controllers/authController.ts`
- Line 15: `res.status(401).json({ success: false, message: 'Unauthorized: Missing token' });`
- Line 22: `res.status(500).json({ success: false, message: 'Internal server error' });`
- Line 31: `res.status(400).json({ success: false, message: 'Email not found in Firebase token' });`
- Line 42: `res.status(400).json({ success: false, message: 'User already exists' });`
- Line 57: `res.status(201).json({`
- Line 70: `res.status(400).json({ success: false, message: 'Invalid input data', errors: (error as any).errors ...`
- Line 73: `res.status(500).json({ success: false, message: 'Internal server error' });`
- Line 81: `res.status(401).json({ success: false, message: 'Unauthorized' });`
- Line 90: `res.status(200).json({`
- Line 105: `res.status(500).json({ success: false, message: 'Internal server error' });`

### `controllers/fleetController.ts`
- Line 15: `// Mock response since we don't have a fleets collection`

### `controllers/notificationController.ts`
- Line 12: `res.status(400).json({ success: false, message: 'FCM token is required' });`
- Line 27: `res.status(200).json({ success: true, message: 'Device registered successfully' });`
- Line 30: `res.status(500).json({ success: false, message: 'Server error' });`
- Line 40: `res.status(400).json({ success: false, message: 'FCM token is required' });`
- Line 46: `res.status(200).json({ success: true, message: 'Device unregistered successfully' });`
- Line 49: `res.status(500).json({ success: false, message: 'Server error' });`
- Line 59: `res.status(404).json({ success: false, message: 'User not found' });`
- Line 63: `res.status(200).json({`
- Line 69: `res.status(500).json({ success: false, message: 'Server error' });`
- Line 79: `res.status(400).json({ success: false, message: 'Preferences object is required' });`
- Line 90: `res.status(404).json({ success: false, message: 'User not found' });`
- Line 94: `res.status(200).json({`
- Line 101: `res.status(500).json({ success: false, message: 'Server error' });`

### `middleware/authMiddleware.ts`
- Line 12: `res.status(401).json({ success: false, message: 'Unauthorized' });`
- Line 21: `res.status(500).json({ success: false, message: 'Internal server error' });`
- Line 32: `res.status(401).json({ success: false, message: 'Unauthorized: User profile not found' });`
- Line 37: `res.status(403).json({ success: false, message: 'Forbidden: Account is suspended or disabled' });`
- Line 45: `res.status(401).json({ success: false, message: 'Unauthorized: Token expired' });`
- Line 48: `res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });`
- Line 56: `res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });`
- Line 66: `res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });`

### `middleware/errorHandler.ts`
- Line 40: `res.status(statusCode).json({`

### `routes/chargingStations.ts`
- Line 13: `res.status(400).json({`
- Line 22: `res.status(200).json({`
- Line 28: `res.status(500).json({`

### `routes/geocoding.ts`
- Line 11: `res.status(400).json({`
- Line 20: `res.status(200).json({`
- Line 26: `res.status(500).json({`
- Line 39: `res.status(400).json({`
- Line 48: `res.status(200).json({`
- Line 54: `res.status(500).json({`

### `routes/incidentRoutes.ts`
- Line 143: `// For the demo, we would then execute the hard permanent deactivation script here...`

### `routes/index.ts`
- Line 55: `res.status(503).json({`
- Line 65: `res.json({`
- Line 80: `res.status(503).json({`
- Line 90: `res.json({`
- Line 112: `res.json({`
- Line 117: `res.status(500).json({`

### `routes/routingRoutes.ts`
- Line 14: `res.status(400).json({`
- Line 23: `res.status(200).json(result);`
- Line 26: `res.status(500).json({`
- Line 39: `res.status(400).json({`
- Line 48: `res.status(200).json({`
- Line 54: `res.status(500).json({`
- Line 66: `res.status(400).json({`
- Line 75: `res.status(200).json({`
- Line 81: `res.status(500).json({`

### `services/analyticsService.ts`
- Line 6: `return { status: 'Network Analytics Placeholder' };`
- Line 27: `return { status: 'Utilization Analytics Placeholder' };`
- Line 31: `return { status: 'Session Analytics Placeholder' };`
- Line 35: `return { status: 'Station Analytics Placeholder' };`

### `services/dashboardService.ts`
- Line 20: `// Example: Energy today (mocking today for demo using all sessions since data might be older)`
- Line 40: `highDemandZones: 5 // mock value for now, could be dynamic`

### `services/fleetService.ts`
- Line 18: `averageBattery: 65, // Example placeholder if real data doesn't provide current SOC for all`

### `services/infrastructureService.ts`
- Line 12: `// Mock logic since actual Infrastructure raw data doesn't exist yet`

### `services/openChargeMapService.ts`
- Line 95: `pricePerKwh: 0.45, // Placeholder as OCM doesn't consistently provide dynamic pricing`
- Line 96: `rating: 4.5, // Placeholder`
- Line 98: `amenities: ['WiFi', 'Restroom'], // Generic placeholder amenities`

### `utils/apiResponse.ts`
- Line 11: `return res.status(statusCode).json({`
- Line 18: `return res.status(statusCode).json({`
- Line 26: `return res.status(statusCode).json({`

### `workers/notificationQueue.ts`
- Line 23: `// We'll also just emit globally for demo purposes if the specific room fails`

