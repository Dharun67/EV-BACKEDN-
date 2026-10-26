# GridWise System Inventory

This document catalogs all discovered frontend pages, backend routes, database models, services, and external integrations in the GridWise application.

## FRONTEND PAGES
Discovered in `frontend/src/pages`

### AdminDashboard.tsx
- **Path:** `pages/AdminDashboard.tsx`
- **Components used:** AdminKpis, PageHeader, SystemActivity, PermissionMatrix, RoleManagement, SecurityMetrics, SystemHealth, UserTable, AdminUser, UserPlus, ShieldCheck, UserDetailModal
- **API Calls Detected:** None

### AIInsights.tsx
- **Path:** `pages/AIInsights.tsx`
- **Components used:** PageHeader, DecisionSimulator, CrossDomainCorrelation, Check, TopRecommendationsList, AITopScore, AIBadge, InsightCardsList, Toast, BrainCircuit
- **API Calls Detected:** None

### AIRecommendations.tsx
- **Path:** `pages/AIRecommendations.tsx`
- **Components used:** SmartChargingStrategy, BatteryIntelligence, RefreshCw, TrafficETAImpact, AIAnalysisStatus, ComparisonTable, RecommendationScoreBreakdown, AlternativeRecommendations, Sparkles, CurrentJourneyCard, AIInsight, DecisionCenter, PrimaryRecommendation
- **API Calls Detected:** None

### BatteryStatus.tsx
- **Path:** `pages/BatteryStatus.tsx`
- **Components used:** RangePrediction, ChargingStatistics, BatteryHealthInsight, TripEnergyForecast, VehicleInformation, BatteryHealth, ChargingHistory, BatteryAlerts, BatteryTimeline, BatteryInsights, ChargingPattern, RefreshCw, BatteryHero, EnergyBreakdown, SmartChargingInsight, BatteryDetails, EnergyConsumption, Car, DrivingModeRange, BatteryTemperature
- **API Calls Detected:** None

### ComingSoon.tsx
- **Path:** `pages/ComingSoon.tsx`
- **Components used:** Construction
- **API Calls Detected:** None

### CommunityChargers.tsx
- **Path:** `pages/CommunityChargers.tsx`
- **Components used:** CommunitySearch, CommunityFilters, Search, CommunityActivity, TopHosts, CommunityChargerMap, BecomeHostCard, PlusCircle, CommunityInsights, CommunityHero, CommunityChargerDetailsModal, ListChargerModal, CommunityChargerCard
- **API Calls Detected:** None

### Dashboard.tsx
- **Path:** `pages/Dashboard.tsx`
- **Components used:** QuickActionCard, BookingCard, StatCard, Route, Zap, BatteryCard, TripSummaryCard, AIRecommendationCard, ActiveBookingMonitor, StationCard
- **API Calls Detected:** None

### DemandIntelligence.tsx
- **Path:** `pages/DemandIntelligence.tsx`
- **Components used:** DemandCapacityChart, DemandAlerts, DemandForecast, DemandFactorImpact, ZoneRanking, QueueAnalysis, ExpansionZones, ZoneCapacityTable, DemandHeatmap, DemandFactors, AIExpansionRecommendation, StationCongestion, DynamicPricingSimulation, CapacityGap, HourlyDemandChart, PeakDemand, RecommendationModal, DemandKpiCards, AIDemandInsight, ForecastSummary, GrowthTrend, LowDemandZones, DemandScenarios, DemandHeader
- **API Calls Detected:** None

### EmergencyRescue.tsx
- **Path:** `pages/EmergencyRescue.tsx`
- **Components used:** RescueStatus, CurrentLocationCard, RescueHistory, RescueSuccess, EmergencyContacts, RescueVehicleCard, BatteryRescueCalculator, NearestChargers, EmergencyHero, EmergencyOptions, RescueRequestModal, ShieldCheck, MobileChargingCard, SafetyChecklist, RescueMap, RescueUnitCard, SafetyCard
- **API Calls Detected:** None

### FleetManagement.tsx
- **Path:** `pages/FleetManagement.tsx`
- **Components used:** PageHeader, FleetDetailsModal, FleetTable, AIFleetInsight, FleetAnalytics, FleetAlertsWidget, Download, FleetKpis
- **API Calls Detected:** None

### HelpSupport.tsx
- **Path:** `pages/HelpSupport.tsx`
- **Components used:** Search, ChevronDown, Mail, FileText, Phone, ExternalLink, MessageCircle, Shield, Book
- **API Calls Detected:** None

### InfrastructureGap.tsx
- **Path:** `pages/InfrastructureGap.tsx`
- **Components used:** ExpansionPriorities, InfrastructureRisks, InfrastructureKpiCards, UnderservedAreas, PlanningQueueModal, InfrastructureFilters, CoverageByZone, DemandInfrastructureChart, PriorityMatrix, ChargingDesertAnalysis, InvestmentSimulation, InfrastructureReadiness, ZoneGapTable, PowerCapacityGap, CoverageScore, ChargingDeserts, ChargerTypeGap, PlanningQueueItem, InfrastructureMap, ExpansionScenarios, HighwayCoverage, InfrastructureHeader, EVGrowthAnalysis, FutureInfrastructureForecast, InfrastructureGapSummary, InfrastructureReliability, AIInfrastructureInsight, PlanningQueue, RecommendedChargerMix, ROIPriority
- **API Calls Detected:** None

### Login.tsx
- **Path:** `pages/Login.tsx`
- **Components used:** Link, Loader2, AlertCircle, Zap
- **API Calls Detected:** None

### MaintenanceManagement.tsx
- **Path:** `pages/MaintenanceManagement.tsx`
- **Components used:** MaintenanceTable, PageHeader, FaultAnalytics, Plus, MaintenanceAsset, PredictiveMaintenanceRisk, AssetHealthBars, IncidentDashboard, MaintenanceKpis, PredictiveMaintenanceAI, Toast
- **API Calls Detected:** None

### NearbyStations.tsx
- **Path:** `pages/NearbyStations.tsx`
- **Components used:** StationMap, StationCard, RouteIcon, StationSearch, StationFilters, StationDetailsModal, Map, FilterState
- **API Calls Detected:** None

### Payments.tsx
- **Path:** `pages/Payments.tsx`
- **Components used:** WalletStats, TransactionFilters, SpendingBreakdown, MonthlySpending, SavingsCard, PromoCard, AddPaymentMethodModal, AddMoneyModal, HTMLDivElement, WalletHero, TransactionDetailsModal, ReceiptPreview, PaymentAnalytics, PaymentMethodList, TransactionHistory, PaymentMethod, PaymentPreferences, PaymentSecurity, RewardsCard, PaymentInsight, QuickActions, Transaction
- **API Calls Detected:** None

### PlannerDashboard.tsx
- **Path:** `pages/PlannerDashboard.tsx`
- **Components used:** MaintenanceAlerts, OperationsActivity, DemandRanking, CapacityRecommendations, PlannerKpiCards, TopStations, NetworkEfficiency, PlannerQuickActions, PlannerHeader, DemandAnalysis, ChargerUtilization, PlannerFilters, MaintenancePriority, CustomerSatisfaction, NetworkHealth, LiveSessions, AttentionStations, NetworkStatus, PlannerMap, EnergyAnalytics, PredictiveMaintenance, AIDemandInsight, RevenueAnalytics, ChargerStatus, SessionDetailsModal
- **API Calls Detected:** None

### Register.tsx
- **Path:** `pages/Register.tsx`
- **Components used:** Link, Loader2, AlertCircle, Zap
- **API Calls Detected:** None

### RevenueAnalytics.tsx
- **Path:** `pages/RevenueAnalytics.tsx`
- **Components used:** PageHeader, RevenueTrendChart, RevenueInsights, CalendarDays, FileText, RevenueByStationTable, RevenueKpis
- **API Calls Detected:** None

### RoutePlanner.tsx
- **Path:** `pages/RoutePlanner.tsx`
- **Components used:** Navigation, Save, RouteOptions, TrafficCard, NavigationModal, Loader2, Car, RouteMap, AlertCircle, RouteInput, TripInsights, VehicleSelector, ChargingStrategyCard, RecentRoutes, AlternativeRouteCard, RouteSummary
- **API Calls Detected:** None

### Settings.tsx
- **Path:** `pages/Settings.tsx`
- **Components used:** User, CheckCircle2, Save, Globe, Icon
- **API Calls Detected:** None

### SlotBooking.tsx
- **Path:** `pages/SlotBooking.tsx`
- **Components used:** BookingSuccess, Booking, BookingConfirmation, ChargerSelector, DemandForecastChart, SmartBookingCard, DurationSelector, DateSelector, BookingSummary, BookingStepper, TimeSlotSelector, CalendarDays, Loader2, AlertTriangle, StationSelector, ActiveBookingMonitor, AvailabilityTimeline
- **API Calls Detected:** None

### StationRecommendation.tsx
- **Path:** `pages/StationRecommendation.tsx`
- **Components used:** StationCandidate, PageHeader, RefreshCw, SimulatedLocationMap, CandidateLocationsTable, FileText, RecommendationKpis, TopLocationCard, LocationDetailsModal, Toast
- **API Calls Detected:** None

### TripHistory.tsx
- **Path:** `pages/TripHistory.tsx`
- **Components used:** LongestTripCard, TripCard, ChargingStatistics, WeeklyActivity, EnergyEfficiency, FavoriteRoutes, TripSort, ChargingHistory, TripAnalytics, TripDetailsModal, EnvironmentalImpact, DrivingBehavior, ChevronDown, TripPagination, MonthlyTravel, TripSummaryCards, Download, Trip, TripSearch, TripInsight, TripCalendar, TripFilters, BestTripCard
- **API Calls Detected:** None

## DATABASE MODELS
Discovered in `backend/src/models`

- `AdminAuditLog`
- `AIPrediction`
- `AuditLog`
- `Booking`
- `Charger`
- `ChargingSession`
- `DecisionLog`
- `DemandData`
- `Fleet`
- `Incident`
- `Infrastructure`
- `Maintenance`
- `Notification`
- `Payment`
- `QueueHistory`
- `Recommendation`
- `Station`
- `User`
- `UserNotificationDevice`
- `Vehicle`

## BACKEND ROUTES
Discovered in `backend/src/routes`

### `adminRoutes.ts`
- **GET** `/users`
- **PATCH** `/users/:userId/role`
- **GET** `/audit-logs`

### `aiInsights.ts`
- **GET** `/`
- **GET** `/summary`

### `analytics.ts`
- **GET** `/network`
- **GET** `/energy`
- **GET** `/utilization`
- **GET** `/sessions`
- **GET** `/stations`

### `authRoutes.ts`
- **POST** `/register`
- **GET** `/me`

### `bookingRoutes.ts`
- **POST** `/feasibility`
- **POST** `/`
- **GET** `/user/:userId`
- **GET** `/:stationId/alternatives`
- **POST** `/:bookingId/rebook`

### `chargers.ts`
- **GET** `/statistics`
- **GET** `/`
- **GET** `/:chargerId`
- **PATCH** `/:chargerId/status`

### `chargingStations.ts`
- **GET** `/nearby`

### `cpo.ts`
- **GET** `/overview`

### `dashboard.ts`
- **GET** `/overview`

### `decisionRoutes.ts`
- **GET** `/history`
- **GET** `/pending`
- **POST** `/:id/approve`
- **POST** `/:id/reject`

### `demand.ts`
- **GET** `/summary`
- **GET** `/peak`
- **GET** `/by-zone`
- **GET** `/trend`
- **GET** `/`
- **GET** `/:location`

### `fleet.ts`
- **GET** `/statistics`
- **GET** `/`

### `geocoding.ts`
- **GET** `/search`
- **GET** `/reverse`

### `incidentRoutes.ts`
- **GET** `/`
- **GET** `/:incidentId`
- **POST** `/`
- **POST** `/simulate`
- **PATCH** `/:incidentId`
- **POST** `/:incidentId/resolve`
- **POST** `/:incidentId/approve-action`

### `index.ts`
- **GET** `/health`
- **GET** `/ready`
- **GET** `/stats/database`

### `infrastructure.ts`
- **GET** `/gaps`
- **GET** `/`

### `maintenance.ts`
- **GET** `/statistics`
- **GET** `/`
- **GET** `/:id`

### `notificationRoutes.ts`
- **POST** `/register-device`
- **DELETE** `/unregister-device`
- **GET** `/preferences`
- **PUT** `/preferences`

### `payments.ts`
- **GET** `/summary`
- **GET** `/by-method`
- **GET** `/`
- **GET** `/:id`

### `predictionRoutes.ts`
- **GET** `/queue/:stationId`
- **GET** `/waiting-time/:stationId`
- **GET** `/queue-risk/:stationId`
- **GET** `/demand/:stationId`
- **GET** `/maintenance/:chargerId`
- **GET** `/history`
- **GET** `/model-status`

### `queueRoutes.ts`
- **POST** `/join`
- **POST** `/leave`
- **POST** `/start-session`
- **POST** `/end-session`
- **GET** `/:stationId`
- **GET** `/:stationId/position/:vehicleId`
- **GET** `/:stationId/size`

### `recommendations.ts`
- **GET** `/top`
- **GET** `/`
- **GET** `/:id`

### `revenue.ts`
- **GET** `/summary`
- **GET** `/trend`
- **GET** `/by-station`
- **GET** `/`

### `routingRoutes.ts`
- **GET** `/route`
- **GET** `/nearest`
- **GET** `/table`

### `sessions.ts`
- **GET** `/statistics`
- **GET** `/`
- **GET** `/:id`
- **GET** `/station/:stationId`
- **GET** `/vehicle/:vehicleId`

### `stations.ts`
- **GET** `/search`
- **GET** `/`
- **GET** `/:id`
- **GET** `/:id/chargers`
- **GET** `/:id/sessions`
- **GET** `/:id/statistics`

### `users.ts`
- **GET** `/statistics`
- **GET** `/`
- **GET** `/:id`

### `vehicles.ts`
- **GET** `/`
- **GET** `/:id`
- **GET** `/:id/sessions`
- **GET** `/:id/energy`

## BACKEND SERVICES & CONFIG
Discovered in `backend/src/services` and `backend/src/config`

- `actionExecutor.ts`
- `aiInsightService.ts`
- `analyticsService.ts`
- `bookingService.ts`
- `chargerService.ts`
- `dashboardService.ts`
- `decisionEngine.ts`
- `demandService.ts`
- `eventService.ts`
- `firebaseNotificationService.ts`
- `fleetService.ts`
- `geocodingService.ts`
- `incidentAutomationService.ts`
- `incidentDetectionService.ts`
- `infrastructureService.ts`
- `maintenanceService.ts`
- `mlService.ts`
- `notificationService.ts`
- `openChargeMapService.ts`
- `osrmService.ts`
- `paymentService.ts`
- `queueService.ts`
- `recommendationService.ts`
- `redisCacheService.ts`
- `redisInitialization.ts`
- `revenueService.ts`
- `sessionService.ts`
- `stationService.ts`
- `userService.ts`
- `vehicleService.ts`
- `database.ts`
- `firebaseAdmin.ts`
- `rabbitmq.ts`
- `redis.ts`
