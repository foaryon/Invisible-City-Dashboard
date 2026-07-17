/**
 * DWD official warnings via the DWD GeoServer WFS
 * (https://maps.dwd.de/geoserver/dwd/ows, layer dwd:Warnungen_Gemeinden).
 * Warnings are source-defined areas/events — shown SEPARATELY from the
 * general forecast and never re-interpreted as local severity.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type WarningContext,
  type Warning,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence } from '@invisible-city/evidence';
import { getProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const RawFeature = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  properties: z.record(z.unknown()),
});

const WfsResponse = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(RawFeature),
});

function str(props: Record<string, unknown>, key: string): string | null {
  const v = props[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export async function getWarningContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<WarningContext>> {
  const provider = getProvider('dwd-warnings');
  const lat = coords.latitude.toFixed(4);
  const lon = coords.longitude.toFixed(4);
  // Geometry column name documented as THE_GEOM — re-verification tracked in the manifest.
  const cql = encodeURIComponent(`INTERSECTS(THE_GEOM, POINT(${lon} ${lat}))`);
  const url =
    'https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature' +
    `&typeName=dwd%3AWarnungen_Gemeinden&outputFormat=application%2Fjson&CQL_FILTER=${cql}`;
  const fingerprint = requestFingerprint({ layer: 'warnungen-gemeinden', lat, lon });

  try {
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = WfsResponse.safeParse(result.raw);
    if (!parsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die WFS-Antwort entsprach nicht dem dokumentierten Schema und wurde verworfen. Es werden keine Ersatzwerte erzeugt.',
        retrievedAt: new Date().toISOString(),
      };
    }

    const warnings: Warning[] = parsed.data.features.map((f, i) => {
      const p = f.properties;
      return {
        id: String(f.id ?? `warning-${i}`),
        event: str(p, 'EVENT') ?? 'Unbekanntes Ereignis',
        headline: str(p, 'HEADLINE'),
        description: str(p, 'DESCRIPTION'),
        severity: str(p, 'SEVERITY'),
        effectiveFrom: str(p, 'ONSET') ?? str(p, 'EFFECTIVE'),
        effectiveUntil: str(p, 'EXPIRES'),
        regionName: str(p, 'NAME'),
      };
    });

    // Preserve any embedded geometry license field (e.g. © GeoBasis-DE / BKG).
    const embeddedLicenses = [
      ...new Set(
        parsed.data.features
          .map((f) => str(f.properties, 'EC_LICENSE'))
          .filter((v): v is string => v !== null),
      ),
    ];

    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method:
        'Amtliche DWD-Warnungen auf Gemeindeebene (WFS dwd:Warnungen_Gemeinden), räumlich gefiltert auf den gewählten Punkt. Keine Warnung im Ergebnis bedeutet: keine amtliche Warnung für diese Gemeinde zum Abrufzeitpunkt.',
      spatial: { kind: 'geometry', geometryType: 'polygon' },
      completeness: 'complete',
      retrievedAt: result.retrievedAt,
      cacheAgeSeconds: result.cacheAgeSeconds,
      limitations:
        embeddedLicenses.length > 0
          ? [`Geometrie-Lizenzhinweis der Quelle: ${embeddedLicenses.join('; ')}`]
          : [],
    });

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: { warnings },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(result.stale
        ? {
            statusDetail: `Quelle aktuell nicht erreichbar — letzte gültige Antwort (Alter: ${Math.round(
              result.cacheAgeSeconds / 60,
            )} Min.) wird sichtbar gekennzeichnet angezeigt. Warnlage kann sich geändert haben.`,
          }
        : {}),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<WarningContext>(err, provider.knownLimitations);
  }
}
