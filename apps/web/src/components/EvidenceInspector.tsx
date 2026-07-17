import { type Evidence, type SpatialContext } from '@invisible-city/contracts';
import {
  MODE_LABEL_DE,
  formatBerlin,
  formatAgeGerman,
  formatDistanceGerman,
} from '@invisible-city/evidence';
import { useAppStore } from '../state/store.js';

function spatialLabel(s: SpatialContext): string {
  switch (s.kind) {
    case 'station':
      return `Station${s.distanceMeters !== undefined ? `, ${formatDistanceGerman(s.distanceMeters)} entfernt` : ''}${
        s.stationType ? ` · Typ: ${s.stationType}` : ''
      }`;
    case 'grid':
      return `Raster${s.resolutionKm ? ` ~${s.resolutionKm} km` : ''} — kein adressgenauer Wert`;
    case 'geometry':
      return `Geometrie (${s.geometryType})`;
    case 'coverage':
      return `Abdeckung: ${s.description}`;
    case 'unknown':
      return 'Räumlicher Bezug unbekannt';
  }
}

function EvidenceCard({ e }: { e: Evidence }) {
  const times: Array<[string, string | undefined]> = [
    ['Beobachtet', e.observedAt],
    ['Vorhersage erstellt', e.forecastIssuedAt],
    ['Gültig für', e.validAt],
    ['Veröffentlicht', e.publishedAt],
    ['Abgerufen', e.retrievedAt],
  ];
  return (
    <div className="card">
      <dl style={{ margin: 0 }}>
        <div className="evidence-row">
          <dt>Quelle</dt>
          <dd>
            {e.providerName}
            <br />
            <span style={{ color: 'var(--text-dim)' }}>{e.institution}</span>
          </dd>
        </div>
        <div className="evidence-row">
          <dt>Datenart</dt>
          <dd>{MODE_LABEL_DE[e.mode]}</dd>
        </div>
        <div className="evidence-row">
          <dt>Methode</dt>
          <dd>{e.method}</dd>
        </div>
        <div className="evidence-row">
          <dt>Räuml. Bezug</dt>
          <dd>{spatialLabel(e.spatial)}</dd>
        </div>
        {times
          .filter(([, v]) => v)
          .map(([label, v]) => (
            <div className="evidence-row" key={label}>
              <dt>{label}</dt>
              <dd>{formatBerlin(v!)}</dd>
            </div>
          ))}
        {e.sourceTimeRaw ? (
          <div className="evidence-row">
            <dt>Originalzeit</dt>
            <dd>
              <code>{e.sourceTimeRaw}</code> (Quellenformat, unverändert)
            </dd>
          </div>
        ) : null}
        {e.cacheAgeSeconds !== undefined && e.cacheAgeSeconds > 0 ? (
          <div className="evidence-row">
            <dt>Cache-Alter</dt>
            <dd>{formatAgeGerman(e.cacheAgeSeconds)}</dd>
          </div>
        ) : null}
        <div className="evidence-row">
          <dt>Vollständigkeit</dt>
          <dd>{e.completeness}</dd>
        </div>
        {e.license ? (
          <div className="evidence-row">
            <dt>Lizenz</dt>
            <dd>{e.license}</dd>
          </div>
        ) : null}
        {e.attribution ? (
          <div className="evidence-row">
            <dt>Namensnennung</dt>
            <dd>{e.attribution}</dd>
          </div>
        ) : null}
        {e.sourceUrl ? (
          <div className="evidence-row">
            <dt>Quelle-URL</dt>
            <dd>
              <a href={e.sourceUrl} target="_blank" rel="noreferrer noopener">
                {e.sourceUrl}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
      {e.limitations.length > 0 ? (
        <ul className="limitations">
          {e.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function EvidenceInspector() {
  const inspector = useAppStore((s) => s.inspector);

  return (
    <section className="panel-section" aria-label="Evidence Inspector">
      <h2 className="panel-title">Evidence Inspector</h2>
      {!inspector ? (
        <p className="loading-shimmer">
          Wählen Sie „Belege“ an einem Wert, um Quelle, Zeit, Datenart, räumliche Bedeutung und
          Grenzen einzusehen.
        </p>
      ) : (
        <>
          <p style={{ marginTop: 0, fontWeight: 600 }}>{inspector.title}</p>
          {inspector.evidence.length === 0 ? (
            <p className="loading-shimmer">Keine Belege für diesen Wert vorhanden.</p>
          ) : (
            inspector.evidence.map((e, i) => <EvidenceCard e={e} key={`${e.providerId}-${i}`} />)
          )}
          {inspector.limitations.length > 0 ? (
            <>
              <h3 className="panel-title" style={{ marginTop: 12 }}>
                Grenzen
              </h3>
              <ul className="limitations">
                {inspector.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
