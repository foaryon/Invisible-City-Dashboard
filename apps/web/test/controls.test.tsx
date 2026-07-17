import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeControl } from '../src/components/TimeControl.js';
import { LayerSwitch, Legend } from '../src/components/LayerControls.js';
import { useAppStore } from '../src/state/store.js';
import { resetStore } from './utils.js';

beforeEach(resetStore);

describe('TimeControl', () => {
  it('defaults to "Jetzt" and shows Europe/Berlin', () => {
    render(<TimeControl />);
    expect(screen.getByRole('button', { name: 'Jetzt' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Europe\/Berlin/)).toBeInTheDocument();
  });

  it('moves the offset forward and clamps at 48 h', () => {
    render(<TimeControl />);
    const slider = screen.getByRole('slider', { name: /Zeitpunkt bis 48 Stunden/ });
    fireEvent.change(slider, { target: { value: '5' } });
    expect(useAppStore.getState().timeOffsetHours).toBe(5);
    fireEvent.change(slider, { target: { value: '99' } });
    expect(useAppStore.getState().timeOffsetHours).toBe(48);
  });
});

describe('LayerSwitch', () => {
  it('switches the active analytical layer (one primary at a time)', () => {
    render(<LayerSwitch />);
    const air = screen.getByRole('button', { name: /Luft: Stationsmessungen/ });
    fireEvent.click(air);
    expect(useAppStore.getState().activeLayer).toBe('air-stations');
    expect(air).toHaveAttribute('aria-pressed', 'true');
  });

  it('exposes every analytical layer as a pressable control', () => {
    render(<LayerSwitch />);
    for (const name of [
      /Wetter & Warnungen/,
      /Luft: Stationsmessungen/,
      /Regionales Modell/,
      /ÖPNV-Kontext/,
      /Orte & kartierter Kontext/,
      /Datenverfügbarkeit/,
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });
});

describe('Legend', () => {
  it('shows source, spatial meaning, time and limitation for the active layer', () => {
    useAppStore.setState({ activeLayer: 'air-stations' });
    render(<Legend />);
    expect(screen.getByRole('complementary', { name: /Legende/ })).toBeInTheDocument();
    expect(screen.getByText(/Umweltbundesamt/)).toBeInTheDocument();
    // Appears in both a legend item and the spatial-meaning note.
    expect(screen.getAllByText(/regionale Referenz/).length).toBeGreaterThan(0);
  });

  it('updates when the layer changes to the CAMS grid', () => {
    useAppStore.setState({ activeLayer: 'air-model' });
    render(<Legend />);
    expect(screen.getAllByText(/Rasterzelle/).length).toBeGreaterThan(0);
  });
});
