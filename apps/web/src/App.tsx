import { useEffect } from 'react';
import { DEMO_BANNER_TEXT } from '@invisible-city/evidence';
import { useAppStore } from './state/store.js';
import { MapView } from './components/MapView.js';
import { LayerSwitch, Legend } from './components/LayerControls.js';
import { PlaceLens } from './components/PlaceLens.js';
import { CoverageMatrix } from './components/CoverageMatrix.js';
import { EvidenceInspector } from './components/EvidenceInspector.js';
import { SearchBox } from './components/SearchBox.js';
import { TimeControl } from './components/TimeControl.js';
import { Compare } from './components/Compare.js';
import { useReadiness } from './queries.js';

/** Demo toggle only appears when the server allows demo (dev). Production hides it. */
function DemoToggle() {
  const { demoMode, setDemoMode } = useAppStore();
  const readiness = useReadiness();
  const demoEnabled = readiness.data?.demoEnabled ?? false;

  // If the server disables demo, force live so state can never desync.
  useEffect(() => {
    if (!demoEnabled && demoMode) setDemoMode(false);
  }, [demoEnabled, demoMode, setDemoMode]);

  if (!demoEnabled) return null;
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={demoMode}
        onChange={(e) => setDemoMode(e.target.checked)}
        aria-describedby="demo-hint"
      />
      Demo-Modus
      <span id="demo-hint" className="visually-hidden">
        Zeigt Demo-Daten statt echter Quellen. Demo- und Live-Daten werden nie vermischt.
      </span>
    </label>
  );
}

export function App() {
  const { demoMode, mobilePanel, setMobilePanel } = useAppStore();

  return (
    <div className="app">
      <a href="#map-region" className="skip-link">
        Zur Karte springen
      </a>
      <header className="topbar">
        <div className="brand">
          <strong>The Invisible City</strong>
          <span>
            Ein Ort. Ein Zeitpunkt. Eine Karte. Belastbare Datenquellen – mit sichtbaren Grenzen.
          </span>
        </div>
        <SearchBox />
        <div className="mobile-tabs">
          <button type="button" className="btn" onClick={() => setMobilePanel('lens')}>
            Lens
          </button>
          <button type="button" className="btn" onClick={() => setMobilePanel('inspector')}>
            Belege
          </button>
        </div>
        <DemoToggle />
      </header>

      {demoMode ? (
        <div className="demo-banner" role="status">
          {DEMO_BANNER_TEXT}
        </div>
      ) : null}

      <main className="main">
        <div
          className="column left"
          data-open={mobilePanel === 'lens'}
          aria-hidden={mobilePanel !== null && mobilePanel !== 'lens'}
        >
          <PlaceLens />
          <CoverageMatrix />
        </div>

        <div className="map-column" id="map-region">
          <MapView />
          <LayerSwitch />
          <Legend />
        </div>

        <div
          className="column right"
          data-open={mobilePanel === 'inspector'}
          aria-hidden={mobilePanel !== null && mobilePanel !== 'inspector'}
        >
          <EvidenceInspector />
        </div>

        <div
          className="sheet-backdrop"
          data-open={mobilePanel !== null}
          onClick={() => setMobilePanel(null)}
          aria-hidden="true"
        />
      </main>

      <footer className="bottombar">
        <TimeControl />
        <Compare />
      </footer>
    </div>
  );
}
