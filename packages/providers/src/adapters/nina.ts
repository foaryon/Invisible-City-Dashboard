/**
 * NINA civil-protection warnings (BBK, bund.dev-documented API).
 *
 * All-hazard official warnings (MoWaS, KATWARN, BIWAPP, flood portal, DWD) for
 * the DISTRICT the selected place lies in. The district is identified via the
 * official territorial assignment (BKG VG250 → ARS); both sources appear in
 * the Evidence. Absence of warnings is a statement about published messages,
 * never about the actual situation.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type CivilWarningContext,
  type CivilWarning,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';
import { getTerritorialAssignment, districtArs } from './bkgVg250.js';

const DashboardItem = z.object({
  id: z.string(),
  payload: z
    .object({
      data: z
        .object({
          headline: z.string().optional(),
          provider: z.string().optional(),
          severity: z.string().optional(),
          msgType: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .optional(),
  sent: z.string().optional(),
});

const DashboardResponse = z.array(DashboardItem);

export async function getCivilWarningContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<CivilWarningContext>> {
  const ninaProvider = getEffectiveProvider('nina-bbk', ctx.config);
  const bkgProvider = getEffectiveProvider('bkg-vg250', ctx.config);
  try {
    const assignment = await getTerritorialAssignment(coords, ctx);
    if (!assignment) {
      return {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [],
        limitations: ninaProvider.knownLimitations,
        statusDetail:
          'Der amtliche Regionalschlüssel (ARS) des gewählten Orts konnte nicht bestimmt werden; ohne ARS ist keine Kreiszuordnung der Warnlage möglich.',
        retrievedAt: new Date().toISOString(),
      };
    }

    const ars = districtArs(assignment.ars);
    const url = `${ctx.config.ninaUrl}/dashboard/${ars}.json`;
    const fingerprint = requestFingerprint({ resource: 'nina-dashboard', ars });
    const result = await fetchJsonWithCache(ninaProvider, fingerprint, url, ctx);
    const parsed = DashboardResponse.safeParse(result.raw);
    if (!parsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: ninaProvider.knownLimitations,
        statusDetail:
          'Die Antwort der Quelle entsprach nicht dem dokumentierten Schema und wurde verworfen.',
        retrievedAt: result.retrievedAt,
      };
    }

    const warnings: CivilWarning[] = parsed.data.map((item) => ({
      id: item.id,
      headline: item.payload?.data?.headline ?? null,
      provider: item.payload?.data?.provider ?? null,
      severity: item.payload?.data?.severity ?? null,
      msgType: item.payload?.data?.msgType ?? null,
      sentAt: item.sent ?? null,
    }));

    const evidence = [
      makeEvidence(ninaProvider, {
        mode: 'observed',
        method:
          'Amtliche Zivilschutz-Warnlage des Kreises (NINA-Dashboard je ARS): MoWaS, KATWARN, BIWAPP, Hochwasserportal, DWD. Quellendefinierte Meldungen — keine lokal abgeleitete Schwere.',
        spatial: {
          kind: 'coverage',
          description: `Kreisebene, ARS ${ars}${assignment.municipalityName ? ` (Gemeinde ${assignment.municipalityName})` : ''}`,
        },
        completeness: 'complete',
        retrievedAt: result.retrievedAt,
        ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
      }),
      makeEvidence(bkgProvider, {
        mode: 'mapped',
        method:
          'Amtliche Gebietszuordnung des Punkts (VG250-WFS, Punkt-in-Polygon) zur Bestimmung von Gemeinde und ARS.',
        spatial: { kind: 'geometry', geometryType: 'polygon' },
        completeness: 'complete',
        retrievedAt: assignment.raw.retrievedAt,
        ...(assignment.raw.cacheAgeSeconds > 0
          ? { cacheAgeSeconds: assignment.raw.cacheAgeSeconds }
          : {}),
      }),
    ];

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: { ars, municipalityName: assignment.municipalityName, warnings },
      evidence,
      limitations: ninaProvider.knownLimitations,
      ...(warnings.length === 0
        ? {
            statusDetail:
              'Keine veröffentlichte Zivilschutz-Meldung für diesen Kreis zum Abrufzeitpunkt.',
          }
        : {}),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<CivilWarningContext>(err, ninaProvider.knownLimitations);
  }
}
