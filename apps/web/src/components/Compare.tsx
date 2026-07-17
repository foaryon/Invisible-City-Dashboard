import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type SelectedPlace,
  type PinSlot,
  type AirMeasurement,
  type WeatherHour,
} from '@invisible-city/contracts';
import {
  assessComparability,
  formatDistanceGerman,
  stationSpatialRole,
} from '@invisible-city/evidence';
import { useAppStore } from '../state/store.js';
import { api } from '../api.js';
import { DataModeChip } from './primitives.js';

interface PinBundle {
  place: SelectedPlace;
  tempC: number | null;
  tempHour: WeatherHour | null;
  pm25: AirMeasurement | null;
  stationDistance: number | null;
  warningCount: number | null;
  stopCount: number | null;
}

function usePinBundle(place: SelectedPlace | undefined, demo: boolean) {
  return useQuery({
    queryKey: ['compare', place?.id ?? null, demo],
    enabled: !!place,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PinBundle> => {
      const c = place!.coordinates;
      const [weather, air, warnings, pois] = await Promise.all([
        api.weather(c, demo),
        api.airStations(c, demo),
        api.warnings(c, demo),
        api.pois(c, demo),
      ]);
      const hours = weather.data?.hours ?? [];
      const tempHour = hours[0] ?? null;
      const tempC = tempHour?.values.find((v) => v.parameter === 'temperature')?.value ?? null;
      const station = air.data?.stations?.[0] ?? null;
      const pm25 = station?.measurements.find((m) => m.pollutant === 'PM2') ?? null;
      return {
        place: place!,
        tempC,
        tempHour,
        pm25,
        stationDistance: station?.distanceMeters ?? null,
        warningCount: warnings.data ? warnings.data.warnings.length : null,
        stopCount: pois.data
          ? pois.data.pois.filter((p) => p.category === 'transit-stop').length
          : null,
      };
    },
  });
}

export function Compare() {
  const { pins, selectedPlace, demoMode, setPin } = useAppStore();
  const a = usePinBundle(pins.A, demoMode);
  const b = usePinBundle(pins.B, demoMode);
  const c = usePinBundle(pins.C, demoMode);
  const bundles: Record<PinSlot, PinBundle | undefined> = {
    A: a.data,
    B: b.data,
    C: c.data,
  };
  const activeSlots = (['A', 'B', 'C'] as const).filter((s) => pins[s]);

  // Air comparability note (never fuse incomparable inputs).
  const airComparability = useMemo(() => {
    const withPm = activeSlots
      .map((s) => bundles[s]?.pm25)
      .filter((m): m is AirMeasurement => !!m && m.value !== null);
    if (withPm.length < 2) return null;
    const first = withPm[0]!;
    for (const m of withPm.slice(1)) {
      const verdict = assessComparability(
        { mode: first.mode, parameter: 'PM2', validAt: first.measuredAt },
        { mode: m.mode, parameter: 'PM2', validAt: m.measuredAt },
      );
      if (!verdict.comparable) return verdict.reasonDe;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.data, b.data, c.data, activeSlots.length]);

  const assignSlot = (slot: PinSlot) => {
    if (!selectedPlace) return;
    setPin(slot, selectedPlace);
  };

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span className="panel-title" style={{ margin: 0 }}>
          Vergleich A / B / C
        </span>
        <span className="btn-group">
          {(['A', 'B', 'C'] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              className="btn"
              disabled={!selectedPlace}
              onClick={() => assignSlot(slot)}
              title={selectedPlace ? `Gewählten Ort als ${slot} anheften` : 'Erst einen Ort wählen'}
            >
              <span className={`pin-dot ${slot}`} /> {slot} setzen
            </button>
          ))}
          {activeSlots.map((slot) => (
            <button
              key={`clear-${slot}`}
              type="button"
              className="btn"
              onClick={() => setPin(slot, null)}
            >
              {slot} ✕
            </button>
          ))}
        </span>
      </div>

      {activeSlots.length === 0 ? (
        <p className="loading-shimmer" style={{ margin: 0 }}>
          Heften Sie bis zu drei Orte an, um vergleichbare, gleichzeitig sinnvolle Daten
          gegenüberzustellen. Es wird kein Gesamt-Score und keine „beste Gegend“ berechnet.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Merkmal</th>
                {activeSlots.map((slot) => (
                  <th key={slot}>
                    <span className={`pin-dot ${slot}`} />
                    {pins[slot]!.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Temperatur</td>
                {activeSlots.map((slot) => {
                  const bundle = bundles[slot];
                  return (
                    <td key={slot}>
                      {bundle?.tempC != null ? (
                        <>
                          {bundle.tempC} °C{' '}
                          {bundle.tempHour ? <DataModeChip mode={bundle.tempHour.mode} /> : null}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>n/v</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>PM2.5</td>
                {activeSlots.map((slot) => {
                  const bundle = bundles[slot];
                  const m = bundle?.pm25;
                  return (
                    <td key={slot}>
                      {m && m.value != null ? (
                        <>
                          {m.value} {m.unit} <DataModeChip mode={m.mode} />
                          {bundle?.stationDistance != null ? (
                            <div style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                              Station {formatDistanceGerman(bundle.stationDistance)}
                              {stationSpatialRole(bundle.stationDistance) === 'regional'
                                ? ' · regionale Referenz'
                                : ''}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>n/v</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>Amtliche Warnungen</td>
                {activeSlots.map((slot) => {
                  const bundle = bundles[slot];
                  return (
                    <td key={slot}>
                      {bundle?.warningCount == null ? (
                        <span style={{ color: 'var(--text-faint)' }}>n/v</span>
                      ) : bundle.warningCount === 0 ? (
                        'keine'
                      ) : (
                        `${bundle.warningCount} aktiv`
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>Kartierte Halte</td>
                {activeSlots.map((slot) => {
                  const bundle = bundles[slot];
                  return (
                    <td key={slot}>
                      {bundle?.stopCount == null ? (
                        <span style={{ color: 'var(--text-faint)' }}>n/v</span>
                      ) : (
                        <>
                          {bundle.stopCount} <DataModeChip mode="mapped" />
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
          {airComparability ? (
            <p className="error-note" style={{ marginBottom: 0 }}>
              PM2.5-Vergleich: {airComparability}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
