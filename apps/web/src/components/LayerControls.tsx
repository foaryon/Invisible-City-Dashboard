import { analyticalLayers, type AnalyticalLayerId } from '@invisible-city/map-style';
import { useAppStore } from '../state/store.js';

export function LayerSwitch() {
  const { activeLayer, setLayer, radarOverlay, setRadarOverlay } = useAppStore();
  return (
    <nav className="layer-switch" aria-label="Analytische Kartenebene wählen">
      <span className="panel-title" style={{ margin: '2px 6px 4px' }}>
        Ebene
      </span>
      {analyticalLayers.map((layer) => (
        <button
          key={layer.id}
          type="button"
          aria-pressed={activeLayer === layer.id}
          disabled={!layer.enabled}
          onClick={() => setLayer(layer.id as AnalyticalLayerId)}
          title={layer.enabled ? layer.spatialMeaning : `${layer.title}: ${layer.limitations}`}
        >
          {layer.title}
          {!layer.enabled ? ' · n. integriert' : ''}
        </button>
      ))}
      <span className="panel-title" style={{ margin: '6px 6px 4px' }}>
        Overlay
      </span>
      <button
        type="button"
        aria-pressed={radarOverlay}
        onClick={() => setRadarOverlay(!radarOverlay)}
        title="Niederschlagsradar-Komposit (RADOLAN, 1 km) als Kartenoverlay — Quelle: Deutscher Wetterdienst. Rasterbild, kein Punktwert."
      >
        Regenradar-Overlay{radarOverlay ? ' · an' : ''}
      </button>
    </nav>
  );
}

export function Legend() {
  const activeLayer = useAppStore((s) => s.activeLayer);
  const layer = analyticalLayers.find((l) => l.id === activeLayer);
  if (!layer) return null;
  return (
    <aside className="legend" aria-label={`Legende: ${layer.title}`}>
      <h4>{layer.title}</h4>
      {layer.legend.map((item) => (
        <div className="legend-item" key={item.label}>
          <span
            className={`swatch ${item.shape}`}
            style={{ background: item.swatch, borderColor: item.swatch }}
            aria-hidden="true"
          />
          <span>{item.label}</span>
        </div>
      ))}
      <div className="legend-meta">
        <div>{layer.sourceNote}</div>
        <div>Räuml.: {layer.spatialMeaning}</div>
        <div>Zeit: {layer.timeApplicability}</div>
        <div>Grenze: {layer.limitations}</div>
      </div>
    </aside>
  );
}
