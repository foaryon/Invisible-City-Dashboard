import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { type Evidence } from '@invisible-city/contracts';
import {
  DataModeChip,
  StatusPill,
  InspectButton,
  ValueRow,
  ModuleStatusNote,
} from '../src/components/primitives.js';
import { useAppStore } from '../src/state/store.js';
import { resetStore } from './utils.js';

beforeEach(resetStore);

describe('DataModeChip', () => {
  it('renders the German label and a data-mode attribute for each mode', () => {
    const { rerender } = render(<DataModeChip mode="observed" />);
    expect(screen.getByText('Gemessen')).toHaveAttribute('data-mode', 'observed');
    rerender(<DataModeChip mode="modelled" />);
    expect(screen.getByText('Modelliert')).toHaveAttribute('data-mode', 'modelled');
    rerender(<DataModeChip mode="scheduled" />);
    expect(screen.getByText('Fahrplan')).toBeInTheDocument();
  });
});

describe('StatusPill', () => {
  it('renders a label and state for every module status', () => {
    const { rerender } = render(<StatusPill status="ok" />);
    expect(screen.getByText('Verfügbar')).toHaveAttribute('data-state', 'ok');
    rerender(<StatusPill status="configuration-required" />);
    expect(screen.getByText('Konfiguration erforderlich')).toBeInTheDocument();
    rerender(<StatusPill status="demo" />);
    expect(screen.getByText('Demo')).toHaveAttribute('data-state', 'demo');
  });
});

describe('ValueRow', () => {
  it('marks unavailable values distinctly', () => {
    const { container } = render(
      <ValueRow label="PM2.5" na>
        nicht verfügbar
      </ValueRow>,
    );
    expect(screen.getByText('PM2.5')).toBeInTheDocument();
    expect(container.querySelector('.value.na')).toHaveTextContent('nicht verfügbar');
  });
});

describe('ModuleStatusNote', () => {
  it('renders nothing when status is ok', () => {
    const { container } = render(<ModuleStatusNote status="ok" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the German detail for non-ok states', () => {
    render(<ModuleStatusNote status="source-error" detail="Quelle nicht erreichbar." />);
    expect(screen.getByText('Quelle nicht erreichbar.')).toBeInTheDocument();
  });
});

describe('InspectButton', () => {
  it('opens the Evidence Inspector via the store on click', () => {
    const evidence: Evidence[] = [];
    render(<InspectButton title="Wetter" evidence={evidence} limitations={['x']} />);
    expect(useAppStore.getState().inspector).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Belege anzeigen: Wetter/ }));
    expect(useAppStore.getState().inspector?.title).toBe('Wetter');
    expect(useAppStore.getState().inspector?.limitations).toEqual(['x']);
  });
});
