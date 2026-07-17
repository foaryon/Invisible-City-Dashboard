import { useMemo } from 'react';
import {
  type WeatherContext,
  type WeatherHour,
  type AirStationContext,
  type ModuleEnvelope,
} from '@invisible-city/contracts';
import { formatBerlin, formatDistanceGerman, stationSpatialRole } from '@invisible-city/evidence';
import { useAppStore, selectedInstantIso } from '../state/store.js';
import {
  useWeather,
  useWarnings,
  useAirStations,
  useAirModel,
  useTransit,
  useWater,
  useRadiation,
  usePollen,
  useUv,
  useRadar,
  useEmitters,
} from '../queries.js';
import {
  DataModeChip,
  StatusPill,
  InspectButton,
  ValueRow,
  ModuleStatusNote,
  LoadingNote,
} from './primitives.js';

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

function WeatherModule() {
  const { selectedPlace, demoMode, timeOffsetHours } = useAppStore();
  const q = useWeather(selectedPlace, demoMode);
  const targetIso = selectedInstantIso(timeOffsetHours);
  const hour = useMemo(
    () => (q.data?.data ? nearestHour(q.data.data, targetIso) : null),
    [q.data, targetIso],
  );

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Wetter</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && q.data.status !== 'ok' && q.data.status !== 'demo' ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {hour ? (
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
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Wetterkontext (DWD)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function WarningsModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useWarnings(selectedPlace, demoMode);
  const warnings = q.data?.data?.warnings ?? [];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Amtliche Warnungen</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && q.data.status !== 'ok' && q.data.status !== 'demo' ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {q.data && (q.data.status === 'ok' || q.data.status === 'demo') ? (
        warnings.length === 0 ? (
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Keine amtliche DWD-Warnung für diese Gemeinde zum Abrufzeitpunkt.
          </p>
        ) : (
          <ul className="limitations" style={{ listStyle: 'none', paddingLeft: 0 }}>
            {warnings.map((w) => (
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
        )
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Amtliche Warnungen (DWD)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function airStatusDetail(env: ModuleEnvelope<AirStationContext>): string | undefined {
  return env.statusDetail;
}

function AirModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useAirStations(selectedPlace, demoMode);
  const station = q.data?.data?.stations?.[0];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Luft: Stationsmessung</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && !station ? (
        <ModuleStatusNote status={q.data.status} detail={airStatusDetail(q.data)} />
      ) : null}
      {station ? (
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
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Luftqualität — Stationsmessung (UBA)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function AirModelModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useAirModel(selectedPlace, demoMode);
  const model = q.data?.data;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Luft: Regionales Modell (CAMS)</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && !model ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {model ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <DataModeChip mode="modelled" strong />
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
              Raster ~{model.resolutionKm ?? 10} km · Zellzentrum{' '}
              {formatDistanceGerman(model.offsetMeters)} entfernt
            </span>
          </div>
          {model.values.map((v) => (
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
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Luft — regionales Modell (CAMS)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function TransitModule() {
  const { selectedPlace, demoMode, timeOffsetHours } = useAppStore();
  const q = useTransit(selectedPlace, selectedInstantIso(timeOffsetHours), demoMode);
  const data = q.data?.data;

  const rows: Array<[string, string, string]> = data
    ? [
        ['Halte-Kontext', data.stopContext.coverage, data.stopContext.detail],
        ['Fahrplan', data.scheduled.coverage, data.scheduled.detail],
        ['Echtzeit', data.realtime.coverage, data.realtime.detail],
      ]
    : [];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>ÖPNV-Verfügbarkeit</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
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
      {data && data.stops.length > 0 ? (
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
                  {d.departureTime} · {d.routeName} {d.headsign ? `→ ${d.headsign}` : ''} ({d.mode})
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="ÖPNV-Verfügbarkeit"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

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

function RadarModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useRadar(selectedPlace, demoMode);
  const data = q.data?.data;
  const frames = data?.frames ?? [];
  const shown = frames.slice(-8);
  const allZero =
    frames.length > 0 && frames.every((f) => f.precipitationMm === null || f.precipitationMm === 0);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Regenradar</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && q.data.status !== 'ok' && q.data.status !== 'demo' ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {data && frames.length > 0 ? (
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
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Regenradar (DWD RADOLAN)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function PollenModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = usePollen(selectedPlace, demoMode);
  const data = q.data?.data;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Pollenflug</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && !data ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {data
        ? data.partregions.map((pr) => (
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
          ))
        : null}
      {data ? (
        <p className="loading-shimmer" style={{ margin: '8px 0 0' }}>
          Gefahrenindex je Vorhersage-Teilregion (Zuordnung über Bundesland), Stufen 0–3 laut
          DWD-Legende.
        </p>
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Pollenflug-Gefahrenindex (DWD)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function UvModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useUv(selectedPlace, demoMode);
  const data = q.data?.data;
  const dayLabel = ['heute', 'morgen', 'übermorgen'];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>UV-Index</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && !data ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {data ? (
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
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="UV-Index-Vorhersage (DWD)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function WaterModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useWater(selectedPlace, demoMode);
  const station = q.data?.data?.stations?.[0];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Wasserstände (Pegel)</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && !station ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {station ? (
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
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Wasserstände (WSV/PEGELONLINE)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

function RadiationModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useRadiation(selectedPlace, demoMode);
  const station = q.data?.data?.stations?.[0];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Radioaktivität (ODL)</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && !station ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {station ? (
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
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Gamma-Ortsdosisleistung (BfS ODL)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Reported annual load, formatted honestly in kg (t above 10 t). */
function formatLoad(kg: number): string {
  if (kg >= 10_000) return `${(kg / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} t`;
  return `${kg.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg`;
}

function EmittersModule() {
  const { selectedPlace, demoMode } = useAppStore();
  const q = useEmitters(selectedPlace, demoMode);
  const data = q.data?.data;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Gemeldete Freisetzungen (PRTR)</strong>
        {q.data ? <StatusPill status={q.data.status} /> : null}
      </div>
      {q.isLoading ? <LoadingNote /> : null}
      {q.data && (!data || data.facilities.length === 0) ? (
        <ModuleStatusNote status={q.data.status} detail={q.data.statusDetail} />
      ) : null}
      {data && data.facilities.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          {data.facilities.map((f) => (
            <div key={f.facilityId} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12 }}>
                <strong>{f.name}</strong>{' '}
                <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                  · {formatDistanceGerman(f.distanceMeters)}
                  {f.activity ? ` · ${f.activity}` : ''}
                </span>
              </div>
              {f.releases.map((r, i) => (
                <ValueRow key={i} label={r.pollutant} na={r.amountKg === null}>
                  {r.amountKg === null ? 'n/v' : `${formatLoad(r.amountKg)}/Jahr`}{' '}
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                    ({r.medium}, {r.year})
                  </span>{' '}
                  <DataModeChip mode={r.mode} />
                </ValueRow>
              ))}
            </div>
          ))}
          <p className="loading-shimmer" style={{ marginBottom: 0 }}>
            Jahresmeldungen berichtspflichtiger Betriebe — keine Messung, keine Konzentration am
            gewählten Ort; Betriebe unterhalb der Schwellenwerte fehlen.
          </p>
        </div>
      ) : null}
      {q.data ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title="Gemeldete Freisetzungen (Thru.de/PRTR)"
            evidence={q.data.evidence}
            limitations={q.data.limitations}
          />
        </div>
      ) : null}
    </div>
  );
}

export function PlaceLens() {
  const selectedPlace = useAppStore((s) => s.selectedPlace);

  return (
    <section className="panel-section" aria-label="Place Lens">
      <h2 className="panel-title">Place Lens</h2>
      {!selectedPlace ? (
        <p className="loading-shimmer">
          Wählen Sie einen Ort per Suche oder Klick auf die Karte, um den verifizierbaren Kontext zu
          sehen.
        </p>
      ) : (
        <>
          <div className="card">
            <strong>{selectedPlace.label}</strong>
            <div style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 2 }}>
              {selectedPlace.coordinates.latitude.toFixed(4)},{' '}
              {selectedPlace.coordinates.longitude.toFixed(4)}
              {selectedPlace.state ? ` · ${selectedPlace.state}` : ''}
            </div>
          </div>
          <WeatherModule />
          <WarningsModule />
          <RadarModule />
          <AirModule />
          <AirModelModule />
          <PollenModule />
          <UvModule />
          <WaterModule />
          <RadiationModule />
          <EmittersModule />
          <TransitModule />
        </>
      )}
    </section>
  );
}
