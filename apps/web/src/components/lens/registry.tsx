import { type ReactNode } from 'react';
import {
  type WeatherContext,
  type WeatherHour,
  type WarningContext,
  type AirStationContext,
  type AirModelContext,
  type PoiContext,
  type TransitAvailability,
  type WaterLevelContext,
  type RadiationContext,
  type PollenContext,
  type UvContext,
  type RadarContext,
  type CivilWarningContext,
  type AutobahnContext,
  type SeismicContext,
  type ClimateNormalsContext,
  type FuelContext,
  type StationFacilityContext,
  type ModuleEnvelope,
} from '@invisible-city/contracts';
import { formatBerlin, formatDistanceGerman, stationSpatialRole } from '@invisible-city/evidence';
import { DataModeChip, ValueRow } from '../primitives.js';

/**
 * Typed registry of all Place Lens modules: tier membership, config gating,
 * noteworthy-promotion predicates, collapsed one-line summaries, and the card
 * bodies. Rendering scaffold/state gating lives in ModuleCard; hooks live in
 * PlaceLens (rules-of-hooks — never loop hooks over this registry).
 *
 * Tiering (docs/decisions.md 2026-07-19): primary cards always visible;
 * context-tier cards collapse into "Weitere Kontexte" and are promoted to a
 * full card only when their `noteworthy` predicate fires on live data.
 */
export type LensModuleKey =
  | 'weather'
  | 'warnings'
  | 'civilWarnings'
  | 'radar'
  | 'climateNormals'
  | 'airStations'
  | 'airModel'
  | 'pollen'
  | 'uv'
  | 'water'
  | 'radiation'
  | 'quakes'
  | 'pois'
  | 'autobahn'
  | 'fuel'
  | 'stationFacilities'
  | 'transit';

export interface LensCtx {
  /** Selected instant (ISO, Europe/Berlin semantics) for time-aware bodies. */
  targetIso: string;
}

export interface LensModuleDef<T> {
  key: LensModuleKey;
  /** German card title — exact current UI strings (selector stability). */
  title: string;
  /** Evidence-inspector title — exact current strings (aria-label stability). */
  inspectorTitle: string;
  tier: 'primary' | 'context';
  /** Env vars required for activation (compact config-hint row names them). */
  configGated?: { envVars: string[] };
  /** Promotes a context-tier module to a visible full card ("aktiv" badge). */
  noteworthy?: (env: ModuleEnvelope<T>) => boolean;
  /** One-line collapsed summary; factual, never over-claiming. */
  summary: (env: ModuleEnvelope<T>) => string;
  isEmpty?: (data: T) => boolean;
  emptyText?: string;
  renderBody: (data: T, ctx: LensCtx) => ReactNode;
}

/** Single, contained type-erasure point; PlaceLens pairs key ↔ query by construction. */
export type AnyLensModuleDef = LensModuleDef<unknown>;
function defineModule<T>(def: LensModuleDef<T>): AnyLensModuleDef {
  return def as AnyLensModuleDef;
}

// ---------------------------------------------------------------------------
// Shared helpers (moved verbatim from the former monolithic PlaceLens)
// ---------------------------------------------------------------------------

function nearestHour(ctx: WeatherContext, targetIso: string): WeatherHour | null {
  if (ctx.hours.length === 0) return null;
  const t = new Date(targetIso).getTime();
  return ctx.hours.reduce((best, h) =>
    Math.abs(new Date(h.validAt).getTime() - t) < Math.abs(new Date(best.validAt).getTime() - t)
      ? h
      : best,
  );
}

const PARAM_LABEL: Record<string, string> = {
  temperature: 'Temperatur',
  precipitation: 'Niederschlag',
  windSpeed: 'Wind',
  windGust: 'Böen',
  relativeHumidity: 'Luftfeuchte',
};

/** Berlin wall-clock time (HH:MM) without the date part. */
function timeBerlin(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

const MONTH_NAME_DE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const AUTOBAHN_KIND_LABEL: Record<string, string> = {
  warning: 'Verkehrsmeldung',
  closure: 'Sperrung',
  roadworks: 'Baustelle',
};

const FACILITY_TYPE_LABEL: Record<string, string> = {
  ELEVATOR: 'Aufzug',
  ESCALATOR: 'Fahrtreppe',
};

const FACILITY_STATE_LABEL: Record<string, string> = {
  ACTIVE: 'in Betrieb',
  INACTIVE: 'außer Betrieb',
  UNKNOWN: 'Zustand nicht ermittelbar',
};

const EMERGENCY_LABEL: Record<string, string> = {
  defibrillator: 'Defibrillator (AED)',
  hospital: 'Krankenhaus',
  'fire-station': 'Feuerwache',
  pharmacy: 'Apotheke',
};
const EMERGENCY_ORDER = ['defibrillator', 'hospital', 'pharmacy', 'fire-station'];

function emergencyNearest(data: PoiContext) {
  const pois = data.pois
    .filter((p) => EMERGENCY_ORDER.includes(p.category))
    .sort(
      (a, b) =>
        EMERGENCY_ORDER.indexOf(a.category) - EMERGENCY_ORDER.indexOf(b.category) ||
        a.distanceMeters - b.distanceMeters,
    );
  const seen = new Set<string>();
  return pois.filter((p) => (seen.has(p.category) ? false : seen.add(p.category)));
}

/** Pollen index strings are "0" … "3" incl. halves like "2-3" — parse the lower bound. */
function pollenLevel(index: string | null): number {
  if (index === null) return 0;
  const n = Number.parseFloat(index);
  return Number.isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// The registry (current visual order preserved within each tier)
// ---------------------------------------------------------------------------

export const LENS_MODULES: readonly AnyLensModuleDef[] = [
  defineModule<WeatherContext>({
    key: 'weather',
    title: 'Wetter',
    inspectorTitle: 'Wetterkontext (DWD)',
    tier: 'primary',
    summary: (env) => (env.data ? `${env.data.hours.length} Stunden im Zeitfenster` : ''),
    isEmpty: (d) => d.hours.length === 0,
    emptyText: 'Keine abrufbaren Wetterstunden im Zeitfenster.',
    renderBody: (data, ctx) => {
      const hour = nearestHour(data, ctx.targetIso);
      if (!hour) return null;
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <DataModeChip mode={hour.mode} strong />
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              {formatBerlin(hour.validAt)}
            </span>
          </div>
          {hour.values.map((v) => (
            <ValueRow
              key={v.parameter}
              label={PARAM_LABEL[v.parameter] ?? v.parameter}
              na={v.value === null}
            >
              {v.value === null ? 'nicht verfügbar' : `${v.value} ${v.unit}`}
            </ValueRow>
          ))}
          {hour.sourceStationDistanceMeters !== undefined ? (
            <p className="loading-shimmer" style={{ marginBottom: 0 }}>
              Nächste Station/Vorhersagepunkt:{' '}
              {formatDistanceGerman(hour.sourceStationDistanceMeters)} — keine Messung am gewählten
              Pin.
            </p>
          ) : null}
        </div>
      );
    },
  }),

  defineModule<WarningContext>({
    key: 'warnings',
    title: 'Amtliche Warnungen',
    inspectorTitle: 'Amtliche Warnungen (DWD)',
    tier: 'primary',
    summary: (env) =>
      env.data
        ? env.data.warnings.length === 0
          ? 'keine amtliche Warnung'
          : `${env.data.warnings.length} amtliche Warnung(en)`
        : '',
    isEmpty: (d) => d.warnings.length === 0,
    emptyText: 'Keine amtliche DWD-Warnung für diese Gemeinde zum Abrufzeitpunkt.',
    renderBody: (data) => (
      <ul className="limitations" style={{ listStyle: 'none', paddingLeft: 0 }}>
        {data.warnings.map((w) => (
          <li key={w.id} style={{ color: 'var(--warn)' }}>
            <strong>{w.event}</strong>
            {w.headline ? ` — ${w.headline}` : ''}
            {w.effectiveUntil ? (
              <span style={{ color: 'var(--text-faint)' }}>
                {' '}
                (bis {formatBerlin(w.effectiveUntil)})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    ),
  }),

  defineModule<RadarContext>({
    key: 'radar',
    title: 'Regenradar',
    inspectorTitle: 'Regenradar (DWD RADOLAN)',
    tier: 'primary',
    summary: (env) => (env.data ? `${env.data.frames.length} Radar-Frames (1-km-Zelle)` : ''),
    isEmpty: (d) => d.frames.length === 0,
    emptyText: 'Keine abrufbaren Radar-Frames für die 1-km-Zelle.',
    renderBody: (data) => {
      const frames = data.frames;
      const shown = frames.slice(-8);
      const allZero = frames.every((f) => f.precipitationMm === null || f.precipitationMm === 0);
      return (
        <div style={{ marginTop: 8 }}>
          {allZero ? (
            <p className="loading-shimmer">
              Kein Niederschlagssignal in der 1-km-Radarzelle (Zeitraum der Frames).
            </p>
          ) : (
            shown.map((f) => (
              <ValueRow
                key={f.validAt}
                label={timeBerlin(f.validAt)}
                na={f.precipitationMm === null}
              >
                {f.precipitationMm === null ? 'n/v' : `${f.precipitationMm} mm/5 min`}{' '}
                <DataModeChip mode={f.mode} />
              </ValueRow>
            ))
          )}
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Wert der 1-km-Rasterzelle (RADOLAN) — kein Punktwert am Pin; künftige Frames sind
            Nowcast-Prognose.
          </p>
        </div>
      );
    },
  }),

  defineModule<AirStationContext>({
    key: 'airStations',
    title: 'Luft: Stationsmessung',
    inspectorTitle: 'Luftqualität — Stationsmessung (UBA)',
    tier: 'primary',
    summary: (env) => {
      const s = env.data?.stations?.[0];
      return s ? `${s.name}, ${formatDistanceGerman(s.distanceMeters)}` : '';
    },
    isEmpty: (d) => d.stations.length === 0,
    emptyText: 'Keine messende Station im Auswahlbereich.',
    renderBody: (data) => {
      const station = data.stations[0];
      if (!station) return null;
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>{station.name}</strong>{' '}
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              {formatDistanceGerman(station.distanceMeters)} ·{' '}
              {stationSpatialRole(station.distanceMeters) === 'regional'
                ? 'regionale Referenz'
                : 'nah'}
              {station.stationType ? ` · ${station.stationType}` : ''}
            </span>
          </div>
          {station.measurements.length === 0 ? (
            <p className="loading-shimmer">Keine abrufbaren Messwerte im Zeitfenster.</p>
          ) : (
            station.measurements.map((m) => (
              <ValueRow
                key={m.pollutant}
                label={m.pollutant.replace('PM2', 'PM2.5')}
                na={m.value === null}
              >
                {m.value === null ? 'n/v' : `${m.value} ${m.unit}`} <DataModeChip mode={m.mode} />
              </ValueRow>
            ))
          )}
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Punktmessung der Station — keine Interpolation, kein lokaler Wert für jede Straße. Daten
            des laufenden Jahres sind vorläufig.
          </p>
        </div>
      );
    },
  }),

  defineModule<PoiContext>({
    key: 'pois',
    title: 'Notfall & Gesundheit',
    inspectorTitle: 'Notfall & Gesundheit (OSM)',
    tier: 'primary',
    summary: (env) => (env.data ? `${emergencyNearest(env.data).length} Kategorien kartiert` : ''),
    isEmpty: (d) => emergencyNearest(d).length === 0,
    emptyText:
      'Keine kartierte Notfall-/Gesundheitsinfrastruktur (AED, Krankenhaus, Apotheke, Feuerwache) im Umkreis — Kartierungsstand OSM, nicht zwingend vollständig.',
    renderBody: (data) => {
      const nearest = emergencyNearest(data);
      return (
        <div style={{ marginTop: 8 }}>
          {nearest.map((p) => (
            <ValueRow key={p.id} label={EMERGENCY_LABEL[p.category] ?? p.category} na={false}>
              {p.name ?? 'ohne Namen'}{' '}
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                · {formatDistanceGerman(p.distanceMeters)}
              </span>{' '}
              <DataModeChip mode={p.mode} />
            </ValueRow>
          ))}
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Kartierter OSM-Kontext — keine Aussage über Öffnung, Verfügbarkeit oder Betrieb; das
            Fehlen bedeutet nicht, dass nichts existiert.
          </p>
        </div>
      );
    },
  }),

  defineModule<FuelContext>({
    key: 'fuel',
    title: 'Kraftstoffpreise',
    inspectorTitle: 'Kraftstoffpreise (MTS-K / Tankerkönig)',
    tier: 'primary',
    configGated: { envVars: ['TANKERKOENIG_API_KEY'] },
    summary: (env) => (env.data ? `${env.data.stations.length} Tankstellen ≤ 5 km` : ''),
    isEmpty: (d) => d.stations.length === 0,
    emptyText: 'Keine meldepflichtige Tankstelle im Umkreis von 5 km.',
    renderBody: (data) => (
      <div style={{ marginTop: 8 }}>
        {data.stations.slice(0, 4).map((s) => (
          <div key={s.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12 }}>
              <strong>{s.brand ?? s.name ?? 'Tankstelle'}</strong>{' '}
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                · {formatDistanceGerman(s.distanceMeters)}
                {s.isOpen === false ? ' · geschlossen' : ''}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', paddingLeft: 8 }}>
              {s.e5 !== null ? `E5 ${s.e5.toFixed(3)} € ` : ''}
              {s.e10 !== null ? `· E10 ${s.e10.toFixed(3)} € ` : ''}
              {s.diesel !== null ? `· Diesel ${s.diesel.toFixed(3)} €` : ''}
            </div>
          </div>
        ))}
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          Von Betreibern an die MTS-K gemeldete Preise — geringe Verzögerungen möglich.
        </p>
      </div>
    ),
  }),

  defineModule<StationFacilityContext>({
    key: 'stationFacilities',
    title: 'Bahnhofs-Aufzüge (DB)',
    inspectorTitle: 'Bahnhofs-Aufzüge & Fahrtreppen (DB FaSta)',
    tier: 'primary',
    configGated: { envVars: ['DB_CLIENT_ID', 'DB_API_KEY'] },
    summary: (env) => (env.data ? `${env.data.facilities.length} Anlagen ≤ 3 km` : ''),
    isEmpty: (d) => d.facilities.length === 0,
    emptyText: 'Keine DB-Station/Anlage im Umkreis von 3 km.',
    renderBody: (data) => (
      <div style={{ marginTop: 8 }}>
        {data.facilities.slice(0, 6).map((f) => (
          <ValueRow key={f.id} label={FACILITY_TYPE_LABEL[f.type] ?? f.type} na={false}>
            {FACILITY_STATE_LABEL[f.state] ?? f.state}{' '}
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              · {formatDistanceGerman(f.distanceMeters)}
              {f.description ? ` · ${f.description}` : ''}
            </span>
          </ValueRow>
        ))}
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          DB-Stationen im Umkreis — „Zustand nicht ermittelbar“ heißt nicht „funktioniert“.
        </p>
      </div>
    ),
  }),

  defineModule<TransitAvailability>({
    key: 'transit',
    title: 'ÖPNV-Verfügbarkeit',
    inspectorTitle: 'ÖPNV-Verfügbarkeit',
    tier: 'primary',
    summary: (env) => (env.data ? `${env.data.stops.length} Halte im Umkreis` : ''),
    renderBody: (data) => {
      const rows: Array<[string, string, string]> = [
        ['Halte-Kontext', data.stopContext.coverage, data.stopContext.detail],
        ['Fahrplan', data.scheduled.coverage, data.scheduled.detail],
        ['Echtzeit', data.realtime.coverage, data.realtime.detail],
      ];
      return (
        <>
          {rows.map(([label, coverage, detail]) => (
            <div key={label} style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label" style={{ color: 'var(--text-dim)' }}>
                  {label}
                </span>
                <span style={{ fontSize: 12 }}>{coverage}</span>
              </div>
              <p className="loading-shimmer" style={{ margin: '2px 0 0' }}>
                {detail}
              </p>
            </div>
          ))}
          {data.stops.length > 0 ? (
            <div style={{ marginTop: 8 }}>
              {data.stops.slice(0, 3).map((s) => (
                <div key={s.stopId} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12 }}>
                    {s.name}{' '}
                    <span style={{ color: 'var(--text-faint)' }}>
                      · {formatDistanceGerman(s.distanceMeters)}
                    </span>{' '}
                    <DataModeChip mode={s.source} />
                  </div>
                  {s.scheduledDepartures.slice(0, 3).map((d, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', paddingLeft: 8 }}>
                      {d.departureTime} · {d.routeName} {d.headsign ? `→ ${d.headsign}` : ''} (
                      {d.mode})
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </>
      );
    },
  }),

  // ------------------------------ context tier ------------------------------

  defineModule<CivilWarningContext>({
    key: 'civilWarnings',
    title: 'Zivilschutz (NINA)',
    inspectorTitle: 'Zivilschutz-Warnungen (BBK NINA)',
    tier: 'context',
    noteworthy: (env) => (env.data?.warnings.length ?? 0) > 0,
    summary: (env) =>
      env.data
        ? env.data.warnings.length === 0
          ? 'keine Meldungen für den Kreis'
          : `${env.data.warnings.length} Meldung(en) für den Kreis`
        : '',
    renderBody: (data) => (
      <div style={{ marginTop: 8 }}>
        {data.warnings.length === 0 ? (
          <p className="loading-shimmer">
            Keine veröffentlichte Zivilschutz-Meldung für diesen Kreis zum Abrufzeitpunkt.
          </p>
        ) : (
          <ul className="limitations" style={{ listStyle: 'none', paddingLeft: 0 }}>
            {data.warnings.map((w) => (
              <li key={w.id} style={{ color: 'var(--warn)' }}>
                <strong>{w.headline ?? 'Meldung ohne Titel'}</strong>
                <span style={{ color: 'var(--text-faint)' }}>
                  {w.provider ? ` — ${w.provider}` : ''}
                  {w.severity ? ` · ${w.severity}` : ''}
                  {w.sentAt ? ` · ${formatBerlin(w.sentAt)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          Amtliche Warnlage des Kreises
          {data.municipalityName ? ` (${data.municipalityName})` : ''} — MoWaS, KATWARN, BIWAPP,
          Hochwasserportal.
        </p>
      </div>
    ),
  }),

  defineModule<ClimateNormalsContext>({
    key: 'climateNormals',
    title: 'Klimanormalwerte',
    inspectorTitle: 'Klimanormalwerte 1991–2020 (DWD CDC)',
    tier: 'context',
    summary: (env) => {
      const d = env.data;
      if (!d) return '';
      const t = d.values.find((v) => v.parameter === 'temperature');
      return t && t.monthValue !== null
        ? `Ø ${MONTH_NAME_DE[d.month - 1]} ${t.monthValue} ${t.unit}`
        : `Referenz ${d.referencePeriod}`;
    },
    renderBody: (data) => (
      <div style={{ marginTop: 8 }}>
        <div style={{ marginBottom: 6, fontSize: 12 }}>
          <strong>{data.stationName ?? `Station ${data.stationId}`}</strong>{' '}
          <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
            · {formatDistanceGerman(data.distanceMeters)} · Referenz {data.referencePeriod}
          </span>
        </div>
        {data.values.map((v) => (
          <ValueRow
            key={v.parameter}
            label={
              v.parameter === 'temperature'
                ? `Ø Temperatur ${MONTH_NAME_DE[data.month - 1]}`
                : `Ø Niederschlag ${MONTH_NAME_DE[data.month - 1]}`
            }
            na={v.monthValue === null}
          >
            {v.monthValue === null ? 'n/v' : `${v.monthValue} ${v.unit}`}
            {v.yearValue !== null ? (
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                {' '}
                · Jahr {v.yearValue} {v.unit}
              </span>
            ) : null}
          </ValueRow>
        ))}
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          Vieljährige Mittel der Referenzperiode — statistische Referenz zum Einordnen des aktuellen
          Wetters, kein aktueller Zustand.
        </p>
      </div>
    ),
  }),

  defineModule<AirModelContext>({
    key: 'airModel',
    title: 'Luft: Regionales Modell (CAMS)',
    inspectorTitle: 'Luft — regionales Modell (CAMS)',
    tier: 'context',
    configGated: { envVars: ['CAMS_ADS_KEY'] },
    summary: (env) => (env.data ? 'regional modellierter Hintergrund (~10 km)' : ''),
    renderBody: (data) => (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <DataModeChip mode="modelled" strong />
          <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
            Raster ~{data.resolutionKm ?? 10} km · Zellzentrum{' '}
            {formatDistanceGerman(data.offsetMeters)} entfernt
          </span>
        </div>
        {data.values.map((v) => (
          <ValueRow
            key={v.pollutant}
            label={v.pollutant.replace('PM2', 'PM2.5')}
            na={v.value === null}
          >
            {v.value === null ? 'n/v' : `${Math.round(v.value * 10) / 10} ${v.unit}`}
          </ValueRow>
        ))}
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          Regional modellierter Hintergrund — kein adressgenauer Wert; nicht mit Stationsmessungen
          zusammenführbar.
        </p>
      </div>
    ),
  }),

  defineModule<PollenContext>({
    key: 'pollen',
    title: 'Pollenflug',
    inspectorTitle: 'Pollenflug-Gefahrenindex (DWD)',
    tier: 'context',
    // Promotion threshold: any allergen at index >= 2 ("mittel") today.
    noteworthy: (env) =>
      (env.data?.partregions ?? []).some((pr) => pr.values.some((v) => pollenLevel(v.today) >= 2)),
    summary: (env) => {
      const values = (env.data?.partregions ?? []).flatMap((pr) => pr.values);
      if (values.length === 0) return '';
      const max = Math.max(...values.map((v) => pollenLevel(v.today)));
      return `heute max. Stufe ${max}`;
    },
    renderBody: (data) => (
      <>
        {data.partregions.map((pr) => (
          <div key={pr.partregionId} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <strong>{pr.partregionName ?? pr.regionName}</strong>{' '}
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                (Großregion — kein Ortswert)
              </span>
            </div>
            {pr.values.map((v) => (
              <ValueRow key={v.allergen} label={v.allergen} na={v.today === null}>
                {v.today === null
                  ? 'n/v'
                  : `heute ${v.today}${data.legend[v.today] ? ` (${data.legend[v.today]})` : ''}`}
                {v.tomorrow !== null ? (
                  <span style={{ color: 'var(--text-faint)' }}> · morgen {v.tomorrow}</span>
                ) : null}
              </ValueRow>
            ))}
          </div>
        ))}
        <p className="loading-shimmer" style={{ margin: '8px 0 0' }}>
          Gefahrenindex je Vorhersage-Teilregion (Zuordnung über Bundesland), Stufen 0–3 laut
          DWD-Legende.
        </p>
      </>
    ),
  }),

  defineModule<UvContext>({
    key: 'uv',
    title: 'UV-Index',
    inspectorTitle: 'UV-Index-Vorhersage (DWD)',
    tier: 'context',
    // Promotion threshold: forecast maximum >= 8 ("sehr hoch") on any shown day.
    noteworthy: (env) => (env.data?.days ?? []).some((d) => (d.value ?? 0) >= 8),
    summary: (env) => {
      const first = env.data?.days?.[0];
      return first && first.value !== null ? `UVI heute ${first.value} (Referenzort)` : '';
    },
    renderBody: (data) => {
      const dayLabel = ['heute', 'morgen', 'übermorgen'];
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            Referenzort <strong>{data.cityName}</strong>{' '}
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              · {formatDistanceGerman(data.distanceMeters)} entfernt
            </span>
          </div>
          {data.days.map((d, i) => (
            <ValueRow key={d.validOn} label={dayLabel[i] ?? d.validOn} na={d.value === null}>
              {d.value === null ? 'n/v' : `UVI ${d.value}`} <DataModeChip mode={d.mode} />
            </ValueRow>
          ))}
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Tagesmaximum am Referenzort — kein Wert am gewählten Pin; tatsächliche Belastung hängt
            u. a. von Bewölkung ab.
          </p>
        </div>
      );
    },
  }),

  defineModule<WaterLevelContext>({
    key: 'water',
    title: 'Wasserstände (Pegel)',
    inspectorTitle: 'Wasserstände (WSV/PEGELONLINE)',
    tier: 'context',
    summary: (env) => {
      const s = env.data?.stations?.[0];
      if (!s) return '';
      const w = s.readings.find((r) => r.parameter === 'W') ?? s.readings[0];
      return w && w.value !== null
        ? `${s.name}: ${w.value} ${w.unit}`
        : `${s.name}, ${formatDistanceGerman(s.distanceMeters)}`;
    },
    isEmpty: (d) => d.stations.length === 0,
    emptyText: 'Kein Bundeswasserstraßen-Pegel im Umkreis von 30 km.',
    renderBody: (data) => {
      const station = data.stations[0];
      if (!station) return null;
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>{station.name}</strong>{' '}
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              {station.waterBody ? `${station.waterBody} · ` : ''}
              {formatDistanceGerman(station.distanceMeters)}
            </span>
          </div>
          {station.readings.length === 0 ? (
            <p className="loading-shimmer">Kein aktuell abrufbarer Messwert an diesem Pegel.</p>
          ) : (
            station.readings.map((r) => (
              <ValueRow
                key={r.parameter}
                label={r.parameterName ?? r.parameter}
                na={r.value === null}
              >
                {r.value === null ? 'n/v' : `${r.value} ${r.unit}`} <DataModeChip mode={r.mode} />
                {r.measuredAt ? (
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                    {' '}
                    · {timeBerlin(r.measuredAt)}
                  </span>
                ) : null}
              </ValueRow>
            ))
          )}
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Rohwert am Pegelstandort (Bundeswasserstraßen) — kein Hochwasser-Warnstatus; amtliche
            Warnungen erteilen die Hochwasserzentralen der Länder.
          </p>
        </div>
      );
    },
  }),

  defineModule<RadiationContext>({
    key: 'radiation',
    title: 'Radioaktivität (ODL)',
    inspectorTitle: 'Gamma-Ortsdosisleistung (BfS ODL)',
    tier: 'context',
    summary: (env) => {
      const s = env.data?.stations?.[0];
      return s && s.doseRate !== null ? `${s.doseRate} ${s.unit} (Sonde ${s.name})` : '';
    },
    isEmpty: (d) => d.stations.length === 0,
    emptyText: 'Keine ODL-Sonde im Auswahlbereich abrufbar.',
    renderBody: (data) => {
      const station = data.stations[0];
      if (!station) return null;
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>{station.name}</strong>{' '}
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              {formatDistanceGerman(station.distanceMeters)} ·{' '}
              {stationSpatialRole(station.distanceMeters) === 'regional'
                ? 'regionale Referenz'
                : 'nah'}
            </span>
          </div>
          <ValueRow label="Gamma-Ortsdosisleistung" na={station.doseRate === null}>
            {station.doseRate === null ? 'n/v' : `${station.doseRate} ${station.unit}`}{' '}
            <DataModeChip mode={station.mode} />
          </ValueRow>
          {station.measuredAt ? (
            <p className="loading-shimmer" style={{ margin: '2px 0 0' }}>
              1-h-Mittelwert bis {formatBerlin(station.measuredAt)}.
            </p>
          ) : null}
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Sondenmesswert — natürliche Schwankungen (Gestein, Höhe, Regen) sind normal und keine
            Gefahrenaussage.
          </p>
        </div>
      );
    },
  }),

  defineModule<SeismicContext>({
    key: 'quakes',
    title: 'Erdbeben (GEOFON)',
    inspectorTitle: 'Erdbeben (GFZ GEOFON)',
    tier: 'context',
    noteworthy: (env) => (env.data?.events.length ?? 0) > 0,
    summary: (env) =>
      env.data
        ? env.data.events.length === 0
          ? `keine Katalogereignisse (${env.data.searchRadiusKm} km/${env.data.windowDays} d)`
          : `${env.data.events.length} Katalogereignis(se)`
        : '',
    isEmpty: (d) => d.events.length === 0,
    emptyText:
      'Keine Katalogereignisse im Umkreis — für die meisten Orte in Deutschland das normale, ehrliche Ergebnis.',
    renderBody: (data) => (
      <div style={{ marginTop: 8 }}>
        {data.events.map((e) => (
          <ValueRow
            key={e.id}
            label={e.time ? formatBerlin(e.time) : e.id}
            na={e.magnitude === null}
          >
            {e.magnitude === null ? 'n/v' : `${e.magType ?? 'M'} ${e.magnitude}`}{' '}
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              · {formatDistanceGerman(e.distanceMeters)}
              {e.locationName ? ` · ${e.locationName}` : ''}
            </span>{' '}
            <DataModeChip mode={e.mode} />
          </ValueRow>
        ))}
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          Katalogereignisse (Epizentrum, Magnitude) im Umkreis von {data.searchRadiusKm} km, letzte{' '}
          {data.windowDays} Tage — keine Aussage über Erschütterungen am Pin.
        </p>
      </div>
    ),
  }),

  defineModule<AutobahnContext>({
    key: 'autobahn',
    title: 'Autobahn-Verkehrslage',
    inspectorTitle: 'Autobahn-Verkehrslage (Autobahn GmbH)',
    tier: 'context',
    noteworthy: (env) => (env.data?.events.length ?? 0) > 0,
    summary: (env) =>
      env.data
        ? env.data.events.length === 0
          ? 'keine Ereignisse ≤ 30 km'
          : `${env.data.events.length} Ereignis(se) ≤ 30 km`
        : '',
    isEmpty: (d) => d.events.length === 0,
    emptyText:
      'Keine gemeldeten Ereignisse auf Bundesautobahnen im Umkreis — keine Aussage über andere Straßen.',
    renderBody: (data) => (
      <div style={{ marginTop: 8 }}>
        {data.events.map((e) => (
          <div key={e.id} style={{ marginBottom: 6, fontSize: 12 }}>
            <strong>
              {e.roadId} · {AUTOBAHN_KIND_LABEL[e.kind] ?? e.kind}
            </strong>{' '}
            {e.distanceMeters !== null ? (
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                · {formatDistanceGerman(e.distanceMeters)}
              </span>
            ) : null}
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>
              {e.title ?? ''}
              {e.subtitle ? ` — ${e.subtitle}` : ''}
            </div>
          </div>
        ))}
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          Nur Bundesautobahnen — keine Aussage über andere Straßen.
        </p>
      </div>
    ),
  }),
];
