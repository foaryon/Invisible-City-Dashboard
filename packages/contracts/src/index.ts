/**
 * @invisible-city/contracts
 *
 * Strict shared data contracts (TypeScript + Zod) used at every external boundary.
 * Reality policy (binding):
 *  - evidence is never removed during normalization,
 *  - incompatible source modes are never merged into one field without a mode discriminator,
 *  - unavailable data never yields a numeric default,
 *  - every API response exposes source status and limitations.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Data mode
// ---------------------------------------------------------------------------

export const DataModeSchema = z.enum([
  'observed',
  'forecast',
  'modelled',
  'mapped',
  'scheduled',
  'realtime',
  'partial',
  'cached',
  'unavailable',
  'demo',
  /**
   * Statutory annual declarations (e.g. PRTR emission reports): values reported
   * by the obligated party for a reporting year — neither a measurement at the
   * selected place nor a current condition.
   */
  'reported',
]);
export type DataMode = z.infer<typeof DataModeSchema>;

// ---------------------------------------------------------------------------
// Spatial context
// ---------------------------------------------------------------------------

export const SpatialContextSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('station'),
    stationId: z.string(),
    distanceMeters: z.number().nonnegative().optional(),
    stationType: z.string().optional(),
  }),
  z.object({
    kind: z.literal('grid'),
    resolutionKm: z.number().positive().optional(),
    gridId: z.string().optional(),
  }),
  z.object({
    kind: z.literal('geometry'),
    geometryType: z.enum(['point', 'line', 'polygon']),
  }),
  z.object({
    kind: z.literal('coverage'),
    description: z.string(),
  }),
  z.object({ kind: z.literal('unknown') }),
]);
export type SpatialContext = z.infer<typeof SpatialContextSchema>;

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export const CompletenessSchema = z.enum(['complete', 'partial', 'provisional', 'unknown']);
export type Completeness = z.infer<typeof CompletenessSchema>;

export const EvidenceSchema = z.object({
  providerId: z.string(),
  providerName: z.string(),
  institution: z.string(),
  sourceUrl: z.string().url().optional(),
  license: z.string().optional(),
  attribution: z.string().optional(),
  mode: DataModeSchema,
  method: z.string(),
  observedAt: z.string().datetime({ offset: true }).optional(),
  forecastIssuedAt: z.string().datetime({ offset: true }).optional(),
  validAt: z.string().datetime({ offset: true }).optional(),
  publishedAt: z.string().datetime({ offset: true }).optional(),
  retrievedAt: z.string().datetime({ offset: true }),
  cacheAgeSeconds: z.number().nonnegative().optional(),
  spatial: SpatialContextSchema,
  completeness: CompletenessSchema,
  limitations: z.array(z.string()),
  schemaVersion: z.string(),
  /**
   * Original, unmodified source timestamp string where the source uses
   * non-standard time semantics (e.g. UBA JSON API timestamps in CET/MEZ
   * without DST shift). Preserved verbatim for the Evidence Inspector.
   */
  sourceTimeRaw: z.string().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

// ---------------------------------------------------------------------------
// EvidenceValue
// ---------------------------------------------------------------------------

export const ValueStatusSchema = z.enum([
  'available',
  'partial',
  'stale',
  'unavailable',
  'error',
  'demo',
]);
export type ValueStatus = z.infer<typeof ValueStatusSchema>;

export interface EvidenceValue<T> {
  value: T | null;
  unit?: string;
  status: ValueStatus;
  evidence: Evidence[];
}

export function evidenceValueSchema<T extends z.ZodTypeAny>(value: T) {
  return z.object({
    value: value.nullable(),
    unit: z.string().optional(),
    status: ValueStatusSchema,
    evidence: z.array(EvidenceSchema),
  });
}

// ---------------------------------------------------------------------------
// Place & time
// ---------------------------------------------------------------------------

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const SelectedPlaceSchema = z.object({
  id: z.string(),
  label: z.string(),
  coordinates: CoordinatesSchema,
  locality: z.string().optional(),
  municipality: z.string().optional(),
  state: z.string().optional(),
  country: z.literal('DE'),
});
export type SelectedPlace = z.infer<typeof SelectedPlaceSchema>;

/** Comparison pin slots. */
export const PinSlotSchema = z.enum(['A', 'B', 'C']);
export type PinSlot = z.infer<typeof PinSlotSchema>;

// ---------------------------------------------------------------------------
// Transit coverage
// ---------------------------------------------------------------------------

export const TransitCoverageSchema = z.enum([
  'confirmed',
  'partial',
  'not-covered',
  'unknown',
  'temporarily-unavailable',
]);
export type TransitCoverage = z.infer<typeof TransitCoverageSchema>;

// ---------------------------------------------------------------------------
// Provider manifest
// ---------------------------------------------------------------------------

export const ProviderStatusSchema = z.enum(['proposed', 'verified', 'suspended', 'deprecated']);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

export const ProviderManifestEntrySchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  institution: z.string(),
  sourceCategory: z.enum([
    'federal-authority',
    'state-authority',
    'european-institution',
    'transport-association',
    'municipal',
    'cartographic-supplementary',
    'unofficial-access-layer',
  ]),
  originalSourceUrl: z.string().url(),
  technicalEndpoint: z.string(),
  accessMethod: z.string(),
  license: z.string(),
  attributionText: z.string(),
  coverage: z.string(),
  updateCadence: z.string(),
  supportedDataModes: z.array(DataModeSchema),
  geographicSemantics: z.array(z.string()),
  validationSchemaVersion: z.string(),
  cachePolicy: z.object({
    ttlSeconds: z.number().nonnegative(),
    rationale: z.string(),
  }),
  status: ProviderStatusSchema,
  reviewDate: z.string(),
  knownLimitations: z.array(z.string()),
  /** Facts that still need documented verification before/while this provider is live. */
  toVerify: z.array(z.string()),
});
export type ProviderManifestEntry = z.infer<typeof ProviderManifestEntrySchema>;

// ---------------------------------------------------------------------------
// Availability / coverage matrix (core feature)
// ---------------------------------------------------------------------------

export const AvailabilityStateSchema = z.enum([
  'available',
  'partial',
  'stale',
  'unavailable',
  'not-integrated',
  'configuration-required',
  'source-error',
  'demo',
]);
export type AvailabilityState = z.infer<typeof AvailabilityStateSchema>;

export const CoverageEntrySchema = z.object({
  key: z.string(),
  /** German UI label, e.g. "Wettervorhersage". */
  label: z.string(),
  state: AvailabilityStateSchema,
  /** Neutral, factual detail, e.g. "Station 18 km entfernt". */
  detail: z.string().optional(),
  providerId: z.string().optional(),
});
export type CoverageEntry = z.infer<typeof CoverageEntrySchema>;

export const CoverageMatrixSchema = z.object({
  place: SelectedPlaceSchema,
  generatedAt: z.string().datetime({ offset: true }),
  entries: z.array(CoverageEntrySchema),
});
export type CoverageMatrix = z.infer<typeof CoverageMatrixSchema>;

// ---------------------------------------------------------------------------
// API envelope — every module response carries status + limitations
// ---------------------------------------------------------------------------

export const ModuleStatusSchema = z.enum([
  'ok',
  'partial',
  'stale',
  'unavailable',
  'source-error',
  'configuration-required',
  'demo',
]);
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

export interface ModuleEnvelope<T> {
  status: ModuleStatus;
  /** True iff the payload comes from demo fixtures. Demo and live never mix. */
  demo: boolean;
  data: T | null;
  evidence: Evidence[];
  limitations: string[];
  /** Human-readable German explanation when data is missing/partial. */
  statusDetail?: string;
  retrievedAt: string;
}

export function moduleEnvelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    status: ModuleStatusSchema,
    demo: z.boolean(),
    data: data.nullable(),
    evidence: z.array(EvidenceSchema),
    limitations: z.array(z.string()),
    statusDetail: z.string().optional(),
    retrievedAt: z.string().datetime({ offset: true }),
  });
}

// ---------------------------------------------------------------------------
// Domain payloads (normalized, provider-agnostic, mode-discriminated)
// ---------------------------------------------------------------------------

export const WeatherValueSchema = z.object({
  parameter: z.enum(['temperature', 'precipitation', 'windSpeed', 'windGust', 'relativeHumidity']),
  value: z.number().nullable(),
  unit: z.string(),
  mode: DataModeSchema,
  validAt: z.string().datetime({ offset: true }),
});
export type WeatherValue = z.infer<typeof WeatherValueSchema>;

export const WeatherHourSchema = z.object({
  validAt: z.string().datetime({ offset: true }),
  mode: DataModeSchema,
  values: z.array(WeatherValueSchema),
  sourceStationId: z.string().optional(),
  sourceStationDistanceMeters: z.number().nonnegative().optional(),
});
export type WeatherHour = z.infer<typeof WeatherHourSchema>;

export const WeatherContextSchema = z.object({
  hours: z.array(WeatherHourSchema),
});
export type WeatherContext = z.infer<typeof WeatherContextSchema>;

export const WarningSchema = z.object({
  id: z.string(),
  event: z.string(),
  headline: z.string().nullable(),
  description: z.string().nullable(),
  severity: z.string().nullable(),
  effectiveFrom: z.string().nullable(),
  effectiveUntil: z.string().nullable(),
  regionName: z.string().nullable(),
});
export type Warning = z.infer<typeof WarningSchema>;

export const WarningContextSchema = z.object({
  warnings: z.array(WarningSchema),
});
export type WarningContext = z.infer<typeof WarningContextSchema>;

export const PollutantSchema = z.enum(['PM10', 'PM2', 'NO2', 'O3', 'SO2', 'CO']);
export type Pollutant = z.infer<typeof PollutantSchema>;

export const AirMeasurementSchema = z.object({
  pollutant: PollutantSchema,
  value: z.number().nullable(),
  unit: z.string(),
  mode: DataModeSchema,
  /** Normalized to ISO-8601 with offset (Europe/Berlin). */
  measuredAt: z.string().nullable(),
  /** Original UBA timestamp string (CET/MEZ, no DST) — preserved for evidence. */
  sourceTimeRaw: z.string().nullable(),
});
export type AirMeasurement = z.infer<typeof AirMeasurementSchema>;

export const AirStationSchema = z.object({
  stationId: z.string(),
  stationCode: z.string(),
  name: z.string(),
  coordinates: CoordinatesSchema,
  stationType: z.string().nullable(),
  distanceMeters: z.number().nonnegative(),
  measurements: z.array(AirMeasurementSchema),
});
export type AirStation = z.infer<typeof AirStationSchema>;

export const AirStationContextSchema = z.object({
  stations: z.array(AirStationSchema),
});
export type AirStationContext = z.infer<typeof AirStationContextSchema>;

export const AirModelValueSchema = z.object({
  pollutant: PollutantSchema,
  value: z.number().nullable(),
  unit: z.string(),
  mode: DataModeSchema,
  validAt: z.string().nullable(),
});
export type AirModelValue = z.infer<typeof AirModelValueSchema>;

/** CAMS regional model context — a grid cell (~10 km), never an address value. */
export const AirModelContextSchema = z.object({
  cellLatitude: z.number(),
  cellLongitude: z.number(),
  resolutionKm: z.number().nullable(),
  /** Distance from the selected point to the grid-cell centre. */
  offsetMeters: z.number().nonnegative(),
  values: z.array(AirModelValueSchema),
});
export type AirModelContext = z.infer<typeof AirModelContextSchema>;

export const PoiCategorySchema = z.enum([
  'park',
  'transit-stop',
  'pharmacy',
  'toilet',
  'drinking-water',
]);
export type PoiCategory = z.infer<typeof PoiCategorySchema>;

export const PoiSchema = z.object({
  id: z.string(),
  category: PoiCategorySchema,
  name: z.string().nullable(),
  coordinates: CoordinatesSchema,
  distanceMeters: z.number().nonnegative(),
  mode: DataModeSchema,
});
export type Poi = z.infer<typeof PoiSchema>;

export const PoiContextSchema = z.object({
  pois: z.array(PoiSchema),
});
export type PoiContext = z.infer<typeof PoiContextSchema>;

export const ScheduledDepartureSchema = z.object({
  departureTime: z.string(),
  routeName: z.string(),
  headsign: z.string(),
  mode: z.string(),
});
export type ScheduledDeparture = z.infer<typeof ScheduledDepartureSchema>;

export const TransitStopSchema = z.object({
  stopId: z.string(),
  name: z.string(),
  coordinates: CoordinatesSchema,
  distanceMeters: z.number().nonnegative(),
  /** Mapped-context source of the stop location: 'mapped' (OSM) or 'scheduled' (GTFS). */
  source: DataModeSchema,
  scheduledDepartures: z.array(ScheduledDepartureSchema),
});
export type TransitStop = z.infer<typeof TransitStopSchema>;

export const RealtimeStopUpdateSchema = z.object({
  stopId: z.string(),
  routeId: z.string().nullable(),
  delaySeconds: z.number().nullable(),
});
export type RealtimeStopUpdate = z.infer<typeof RealtimeStopUpdateSchema>;

export const RealtimeAlertSchema = z.object({
  headerText: z.string().nullable(),
  descriptionText: z.string().nullable(),
});
export type RealtimeAlert = z.infer<typeof RealtimeAlertSchema>;

export const TransitAvailabilitySchema = z.object({
  stopContext: z.object({
    coverage: TransitCoverageSchema,
    detail: z.string(),
  }),
  scheduled: z.object({
    coverage: TransitCoverageSchema,
    detail: z.string(),
  }),
  realtime: z.object({
    coverage: TransitCoverageSchema,
    detail: z.string(),
  }),
  /** Nearby stops (mapped and/or from the scheduled feed) with any scheduled departures. */
  stops: z.array(TransitStopSchema),
  /** Realtime updates/alerts that touch nearby stops (only within confirmed coverage). */
  realtimeUpdates: z.array(RealtimeStopUpdateSchema),
  realtimeAlerts: z.array(RealtimeAlertSchema),
  feedTimestamp: z.string().nullable(),
});
export type TransitAvailability = z.infer<typeof TransitAvailabilitySchema>;

export const GeocodeResultSchema = z.object({
  place: SelectedPlaceSchema,
  mode: DataModeSchema,
});
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;

// ---------------------------------------------------------------------------
// Water levels (PEGELONLINE / WSV) — gauge readings are point data at the
// gauge on its waterway; never transferable to other waters or places.
// ---------------------------------------------------------------------------

export const WaterReadingSchema = z.object({
  /** Source timeseries shortname, e.g. "W" (Wasserstand), "Q" (Abfluss). */
  parameter: z.string(),
  parameterName: z.string().nullable(),
  value: z.number().nullable(),
  unit: z.string(),
  mode: DataModeSchema,
  measuredAt: z.string().nullable(),
  /** Source-declared classification vs. mean low/high water, verbatim. */
  stateMnwMhw: z.string().nullable(),
});
export type WaterReading = z.infer<typeof WaterReadingSchema>;

export const WaterStationSchema = z.object({
  stationId: z.string(),
  name: z.string(),
  waterBody: z.string().nullable(),
  coordinates: CoordinatesSchema,
  distanceMeters: z.number().nonnegative(),
  readings: z.array(WaterReadingSchema),
});
export type WaterStation = z.infer<typeof WaterStationSchema>;

export const WaterLevelContextSchema = z.object({
  stations: z.array(WaterStationSchema),
  searchRadiusMeters: z.number().positive(),
});
export type WaterLevelContext = z.infer<typeof WaterLevelContextSchema>;

// ---------------------------------------------------------------------------
// Gamma dose rate (BfS ODL network) — probe-site point observations.
// ---------------------------------------------------------------------------

export const RadiationStationSchema = z.object({
  stationId: z.string(),
  name: z.string(),
  coordinates: CoordinatesSchema,
  distanceMeters: z.number().nonnegative(),
  /** Gamma ambient dose rate at the probe, µSv/h. */
  doseRate: z.number().nullable(),
  unit: z.string(),
  mode: DataModeSchema,
  measuredAt: z.string().nullable(),
  siteStatus: z.string().nullable(),
});
export type RadiationStation = z.infer<typeof RadiationStationSchema>;

export const RadiationContextSchema = z.object({
  stations: z.array(RadiationStationSchema),
});
export type RadiationContext = z.infer<typeof RadiationContextSchema>;

// ---------------------------------------------------------------------------
// Pollen forecast (DWD hazard index) — per LARGE forecast partregion,
// assigned via Bundesland; never a point value.
// ---------------------------------------------------------------------------

export const PollenValueSchema = z.object({
  allergen: z.string(),
  /** Source index strings ("0", "0-1", … "3") — kept verbatim, never numified. */
  today: z.string().nullable(),
  tomorrow: z.string().nullable(),
  dayAfterTomorrow: z.string().nullable(),
  mode: DataModeSchema,
});
export type PollenValue = z.infer<typeof PollenValueSchema>;

export const PollenPartregionSchema = z.object({
  partregionId: z.number(),
  partregionName: z.string().nullable(),
  regionName: z.string(),
  values: z.array(PollenValueSchema),
});
export type PollenPartregion = z.infer<typeof PollenPartregionSchema>;

export const PollenContextSchema = z.object({
  /** Bundesland used for region assignment (coverage semantics, not a point). */
  state: z.string(),
  partregions: z.array(PollenPartregionSchema),
  /** Source legend: index string → German description. */
  legend: z.record(z.string()),
  lastUpdateRaw: z.string().nullable(),
  nextUpdateRaw: z.string().nullable(),
});
export type PollenContext = z.infer<typeof PollenContextSchema>;

// ---------------------------------------------------------------------------
// UV index forecast (DWD) — published for a small set of reference locations.
// ---------------------------------------------------------------------------

export const UvDaySchema = z.object({
  /** Berlin-calendar date the maximum applies to (YYYY-MM-DD). */
  validOn: z.string(),
  value: z.number().nullable(),
  mode: DataModeSchema,
});
export type UvDay = z.infer<typeof UvDaySchema>;

export const UvContextSchema = z.object({
  cityName: z.string(),
  coordinates: CoordinatesSchema,
  distanceMeters: z.number().nonnegative(),
  days: z.array(UvDaySchema),
});
export type UvContext = z.infer<typeof UvContextSchema>;

// ---------------------------------------------------------------------------
// Precipitation radar (DWD RADOLAN composite) — 1-km grid cell, incl. a short
// nowcast; frames are mode-discriminated observed vs. forecast.
// ---------------------------------------------------------------------------

export const RadarFrameSchema = z.object({
  validAt: z.string(),
  mode: DataModeSchema,
  /** Precipitation in the grid cell containing the selected point, mm per 5 min. */
  precipitationMm: z.number().nullable(),
});
export type RadarFrame = z.infer<typeof RadarFrameSchema>;

export const RadarContextSchema = z.object({
  /** Source/product label as delivered (e.g. RADOLAN product line). */
  source: z.string().nullable(),
  resolutionKm: z.number().nullable(),
  frames: z.array(RadarFrameSchema),
});
export type RadarContext = z.infer<typeof RadarContextSchema>;

// ---------------------------------------------------------------------------
// Reported industrial releases (Thru.de / PRTR) — statutory ANNUAL declarations
// by facilities above thresholds; never a concentration or local air value.
// ---------------------------------------------------------------------------

export const EmitterReleaseSchema = z.object({
  pollutant: z.string(),
  /** Reported annual load in kilograms for the reporting year. */
  amountKg: z.number().nullable(),
  medium: z.string(),
  year: z.number(),
  mode: DataModeSchema,
});
export type EmitterRelease = z.infer<typeof EmitterReleaseSchema>;

export const EmitterFacilitySchema = z.object({
  facilityId: z.string(),
  name: z.string(),
  activity: z.string().nullable(),
  coordinates: CoordinatesSchema,
  distanceMeters: z.number().nonnegative(),
  releases: z.array(EmitterReleaseSchema),
});
export type EmitterFacility = z.infer<typeof EmitterFacilitySchema>;

export const EmitterContextSchema = z.object({
  facilities: z.array(EmitterFacilitySchema),
  searchRadiusMeters: z.number().positive(),
  reportingYears: z.array(z.number()),
});
export type EmitterContext = z.infer<typeof EmitterContextSchema>;
