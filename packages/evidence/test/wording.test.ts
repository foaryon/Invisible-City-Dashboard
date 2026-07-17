import { describe, it, expect } from 'vitest';
import {
  MODE_LABEL_DE,
  violatesWordingPolicy,
  freshnessLabelDe,
  DEMO_BANNER_TEXT,
} from '../src/wording.js';

describe('wording policy (§9)', () => {
  it('provides a German label for every data mode', () => {
    for (const label of Object.values(MODE_LABEL_DE)) {
      expect(label.length).toBeGreaterThan(2);
      expect(violatesWordingPolicy(label)).toBe(false);
    }
  });

  it('flags disallowed claims', () => {
    for (const bad of [
      'Hier ist die Luft sauber',
      'Der sauberste Spaziergang',
      'Die beste Gegend der Stadt',
      'Keine Störung im ÖPNV',
      'Sicherer Ort bei Nacht',
      'Schatten vorhanden im Park',
      'Kühlort in der Nähe',
      'Exakter Wert am Standort',
    ]) {
      expect(violatesWordingPolicy(bad)).toBe(true);
    }
  });

  it('accepts allowed phrasing', () => {
    for (const ok of [
      'Prognose',
      'Gemessen an Station Berlin Wedding',
      'Regional modellierter Hintergrund',
      'Fahrplan verfügbar',
      'Echtzeit teilweise abgedeckt',
      'Keine verifizierten Daten verfügbar',
      'Für diesen Vergleich nicht ausreichend vergleichbar',
    ]) {
      expect(violatesWordingPolicy(ok)).toBe(false);
    }
  });

  it('never labels cached data as "Echtzeit"/live', () => {
    expect(freshnessLabelDe('scheduled', 600)).toBe('Zwischengespeichert');
    expect(freshnessLabelDe('observed', 3600)).toBe('Zwischengespeichert');
    expect(freshnessLabelDe('realtime', 30)).toBe('Echtzeit');
  });

  it('keeps the verbatim demo banner text', () => {
    expect(DEMO_BANNER_TEXT).toBe('DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN');
  });
});
