/**
 * DWD pollen hazard index (opendata.dwd.de s31fg.json, CC BY 4.0).
 *
 * The index is published per LARGE forecast partregion. Reality rules:
 *  - the selected place is assigned via its Bundesland (text match against the
 *    source region names) — coverage semantics, never a point value;
 *  - when a Bundesland spans several partregions, ALL matching partregions are
 *    returned and labelled (no silent pick, no polygon guessing);
 *  - index strings ("0", "0-1" … "3") are kept verbatim with the source legend.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type PollenContext,
  type PollenPartregion,
  type PollenValue,
} from '@invisible-city/contracts';
import { makeEvidence } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const PollenEntry = z.object({
  today: z.string().optional(),
  tomorrow: z.string().optional(),
  dayafter_to: z.string().optional(),
});

const Region = z.object({
  region_id: z.number(),
  region_name: z.string(),
  partregion_id: z.number(),
  partregion_name: z.string(),
  Pollen: z.record(PollenEntry),
});

const PollenResponse = z.object({
  last_update: z.string().optional(),
  next_update: z.string().optional(),
  legend: z.record(z.unknown()).optional(),
  content: z.array(Region),
});

/** Source legend { id1: "0", id1_desc: "keine Belastung", … } → { "0": "keine Belastung" }. */
export function parseLegend(raw: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const [key, value] of Object.entries(raw)) {
    const m = /^id(\d+)$/.exec(key);
    if (!m) continue;
    const desc = raw[`${key}_desc`];
    if (typeof value === 'string' && typeof desc === 'string') out[value] = desc;
  }
  return out;
}

/** Case-insensitive Bundesland match against a source region name. */
export function regionMatchesState(regionName: string, state: string): boolean {
  return regionName.toLowerCase().includes(state.trim().toLowerCase());
}

export async function getPollenContext(
  state: string | null,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<PollenContext>> {
  const provider = getEffectiveProvider('dwd-pollen', ctx.config);
  try {
    if (!state || state.trim().length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Das Bundesland des gewählten Orts konnte nicht bestimmt werden; ohne Bundesland ist keine ehrliche Zuordnung zu einer Pollenflugregion möglich.',
        retrievedAt: new Date().toISOString(),
      };
    }

    const url = `${ctx.config.dwdHealthUrl}/s31fg.json`;
    const fingerprint = requestFingerprint({ resource: 'pollen-s31fg' });
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = PollenResponse.safeParse(result.raw);
    if (!parsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Antwort der Quelle entsprach nicht dem dokumentierten Schema und wurde verworfen.',
        retrievedAt: result.retrievedAt,
      };
    }

    const matched = parsed.data.content.filter((r) => regionMatchesState(r.region_name, state));
    const partregions: PollenPartregion[] = matched.map((r) => {
      const values: PollenValue[] = Object.entries(r.Pollen).map(([allergen, v]) => ({
        allergen,
        today: v.today ?? null,
        tomorrow: v.tomorrow ?? null,
        dayAfterTomorrow: v.dayafter_to ?? null,
        mode: 'forecast' as const,
      }));
      return {
        partregionId: r.partregion_id,
        partregionName: r.partregion_name.length > 0 ? r.partregion_name : null,
        regionName: r.region_name,
        values,
      };
    });

    const evidence = makeEvidence(provider, {
      mode: 'forecast',
      method:
        'DWD Pollenflug-Gefahrenindex je Vorhersage-Teilregion, zugeordnet über das Bundesland des gewählten Orts. Regionale Belastungsklassen — kein Ortswert, keine Konzentration.',
      spatial: {
        kind: 'coverage',
        description: `Pollenflugregion(en) für ${state} (Zuordnung über Bundesland, nicht punktgenau)`,
      },
      completeness: partregions.length === 1 ? 'complete' : 'partial',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
      ...(parsed.data.last_update ? { sourceTimeRaw: parsed.data.last_update } : {}),
      limitations:
        partregions.length > 1
          ? [
              `${state} umfasst ${partregions.length} Teilregionen; ohne amtliche Regionspolygone werden alle angezeigt.`,
            ]
          : [],
    });

    if (partregions.length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [evidence],
        limitations: provider.knownLimitations,
        statusDetail: `Für „${state}“ wurde keine Pollenflugregion im Quelldatensatz gefunden.`,
        retrievedAt: result.retrievedAt,
      };
    }

    const data: PollenContext = {
      state,
      partregions,
      legend: parseLegend(parsed.data.legend),
      lastUpdateRaw: parsed.data.last_update ?? null,
      nextUpdateRaw: parsed.data.next_update ?? null,
    };

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data,
      evidence: [evidence],
      limitations: provider.knownLimitations,
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<PollenContext>(err, provider.knownLimitations);
  }
}
