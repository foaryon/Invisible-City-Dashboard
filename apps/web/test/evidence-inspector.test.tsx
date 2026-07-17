import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { type Evidence } from '@invisible-city/contracts';
import { EvidenceInspector } from '../src/components/EvidenceInspector.js';
import { useAppStore } from '../src/state/store.js';
import { resetStore } from './utils.js';

beforeEach(resetStore);

const evidence: Evidence = {
  providerId: 'uba-airdata',
  providerName: 'UBA Luftdaten (Stationsmessungen)',
  institution: 'Umweltbundesamt / Messnetze der Länder',
  sourceUrl: 'https://luftdaten.umweltbundesamt.de/',
  license: 'Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0)',
  attribution: 'Umweltbundesamt',
  mode: 'observed',
  method: 'Stationsmessungen der UBA-/Länder-Messnetze.',
  observedAt: '2026-07-16T10:00:00Z',
  retrievedAt: '2026-07-16T10:05:00Z',
  spatial: {
    kind: 'station',
    stationId: 'DEBE065',
    distanceMeters: 1400,
    stationType: 'Hintergrund',
  },
  completeness: 'provisional',
  limitations: ['Daten des laufenden Jahres sind vorläufig.'],
  schemaVersion: 'uba-v3',
  sourceTimeRaw: '2026-07-16 12:00:00',
};

describe('EvidenceInspector', () => {
  it('prompts when nothing is selected', () => {
    render(<EvidenceInspector />);
    expect(screen.getByText(/Wählen Sie „Belege“/)).toBeInTheDocument();
  });

  it('renders provider, mode, method, license, attribution, spatial and raw source time', () => {
    useAppStore.setState({
      inspector: { title: 'Luftqualität', evidence: [evidence], limitations: ['Globale Grenze.'] },
    });
    render(<EvidenceInspector />);
    expect(screen.getByText('Luftqualität')).toBeInTheDocument();
    expect(screen.getByText(/UBA Luftdaten/)).toBeInTheDocument();
    expect(screen.getByText('Umweltbundesamt')).toBeInTheDocument();
    expect(screen.getByText(/dl-de\/by-2-0/)).toBeInTheDocument();
    // Station spatial context with distance.
    expect(screen.getByText(/Station, 1,4 km entfernt/)).toBeInTheDocument();
    // The raw CET source string is preserved verbatim.
    expect(screen.getByText('2026-07-16 12:00:00')).toBeInTheDocument();
    // Both the evidence limitation and the module-level limitation are shown.
    expect(screen.getByText('Daten des laufenden Jahres sind vorläufig.')).toBeInTheDocument();
    expect(screen.getByText('Globale Grenze.')).toBeInTheDocument();
  });

  it('labels a grid spatial context as non-address, and shows no station distance', () => {
    useAppStore.setState({
      inspector: {
        title: 'Modell',
        evidence: [{ ...evidence, spatial: { kind: 'grid', resolutionKm: 10 } }],
        limitations: [],
      },
    });
    render(<EvidenceInspector />);
    expect(screen.getByText(/Raster ~10 km — kein adressgenauer Wert/)).toBeInTheDocument();
  });
});
