import {
  EvidenceSchema,
  type Evidence,
  type ProviderManifestEntry,
  type DataMode,
  type SpatialContext,
  type Completeness,
} from '@invisible-city/contracts';

export interface EvidenceInput {
  mode: DataMode;
  method: string;
  spatial: SpatialContext;
  completeness: Completeness;
  limitations?: string[];
  retrievedAt?: string;
  cacheAgeSeconds?: number;
  observedAt?: string;
  forecastIssuedAt?: string;
  validAt?: string;
  publishedAt?: string;
  sourceTimeRaw?: string;
}

/**
 * Build a validated Evidence record from a provider-manifest entry.
 * Provider identity, license and attribution always come from the manifest —
 * adapters cannot invent or drop them.
 */
export function makeEvidence(provider: ProviderManifestEntry, input: EvidenceInput): Evidence {
  const evidence: Evidence = {
    providerId: provider.providerId,
    providerName: provider.displayName,
    institution: provider.institution,
    sourceUrl: provider.originalSourceUrl,
    license: provider.license,
    attribution: provider.attributionText,
    mode: input.mode,
    method: input.method,
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
    spatial: input.spatial,
    completeness: input.completeness,
    limitations: [...provider.knownLimitations, ...(input.limitations ?? [])],
    schemaVersion: provider.validationSchemaVersion,
    ...(input.cacheAgeSeconds !== undefined ? { cacheAgeSeconds: input.cacheAgeSeconds } : {}),
    ...(input.observedAt !== undefined ? { observedAt: input.observedAt } : {}),
    ...(input.forecastIssuedAt !== undefined ? { forecastIssuedAt: input.forecastIssuedAt } : {}),
    ...(input.validAt !== undefined ? { validAt: input.validAt } : {}),
    ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
    ...(input.sourceTimeRaw !== undefined ? { sourceTimeRaw: input.sourceTimeRaw } : {}),
  };
  return EvidenceSchema.parse(evidence);
}

/** Mark evidence as served from cache, preserving everything else. */
export function withCacheAge(evidence: Evidence, cacheAgeSeconds: number): Evidence {
  return { ...evidence, cacheAgeSeconds };
}

/**
 * A cached response is "stale" once its age exceeds the provider TTL.
 * Stale data may only be shown visibly labelled with its age (§3.1.J).
 */
export function isStale(cacheAgeSeconds: number | undefined, ttlSeconds: number): boolean {
  if (cacheAgeSeconds === undefined) return false;
  return cacheAgeSeconds > ttlSeconds;
}
