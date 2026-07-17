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
});
export type TransitAvailability = z.infer<typeof TransitAvailabilitySchema>;

export const GeocodeResultSchema = z.object({
  place: SelectedPlaceSchema,
  mode: DataModeSchema,
});
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;
