import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { type UseQueryResult } from '@tanstack/react-query';
import { type ModuleEnvelope, type ModuleStatus } from '@invisible-city/contracts';
import { ModuleCard } from '../src/components/lens/ModuleCard.js';
import { renderWithProviders } from './utils.js';

interface Payload {
  items: string[];
}

function envOf(
  status: ModuleStatus,
  data: Payload | null,
  statusDetail?: string,
): ModuleEnvelope<Payload> {
  return {
    status,
    demo: status === 'demo',
    data,
    evidence: [],
    limitations: [],
    ...(statusDetail ? { statusDetail } : {}),
    retrievedAt: '2026-07-16T10:00:00+02:00',
  };
}

function queryOf(env: ModuleEnvelope<Payload> | undefined, isLoading = false) {
  return { data: env, isLoading } as unknown as UseQueryResult<ModuleEnvelope<Payload>>;
}

function renderCard(env: ModuleEnvelope<Payload> | undefined, extra?: { isLoading?: boolean }) {
  return renderWithProviders(
    <ModuleCard<Payload>
      moduleKey="testmod"
      title="Testmodul"
      inspectorTitle="Testmodul (Quelle)"
      query={queryOf(env, extra?.isLoading ?? false)}
      isEmpty={(d) => d.items.length === 0}
      emptyText="Ehrliche Absenz: nichts im Umkreis."
    >
      {(data) => <div data-testid="body">{data.items.join(',')}</div>}
    </ModuleCard>,
  );
}

/**
 * Unified state-gating table (§3.1.J) [MP-3.1.J-01, MP-3.1.J-02]:
 * note for every non-ok/non-demo status; body whenever non-empty data exists
 * (partial/stale render note AND body); empty collections show honest-absence
 * copy only for ok/demo — degraded statuses explain via the note instead.
 */
describe('ModuleCard — unified state gating (§3.1.J) [MP-3.1.J-01]', () => {
  it('ok + data: body, no note, no absence copy', () => {
    renderCard(envOf('ok', { items: ['a'] }));
    expect(screen.getByTestId('body')).toHaveTextContent('a');
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.queryByText(/Ehrliche Absenz/)).toBeNull();
  });

  it('ok + empty collection: honest-absence copy, no note (absence ≠ error)', () => {
    renderCard(envOf('ok', { items: [] }));
    expect(screen.queryByTestId('body')).toBeNull();
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.getByText('Ehrliche Absenz: nichts im Umkreis.')).toBeInTheDocument();
  });

  it('partial + data: note AND body (state explained, data still shown)', () => {
    renderCard(envOf('partial', { items: ['a'] }, 'Nur ein Teil lieferbar.'));
    expect(screen.getByTestId('body')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Nur ein Teil lieferbar.');
  });

  it('stale + data: note AND body (age explained, cached data visible)', () => {
    renderCard(envOf('stale', { items: ['a'] }, 'Cache, 45 Minuten alt.'));
    expect(screen.getByTestId('body')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Cache, 45 Minuten alt.');
  });

  it('degraded + empty collection: note, NOT the absence copy', () => {
    renderCard(envOf('partial', { items: [] }, 'Quelle nur teilweise erreichbar.'));
    expect(screen.queryByText(/Ehrliche Absenz/)).toBeNull();
    expect(screen.getByRole('note')).toHaveTextContent('Quelle nur teilweise erreichbar.');
  });

  it.each(['unavailable', 'source-error', 'configuration-required'] as const)(
    '%s + null data: note only, never a value',
    (status) => {
      renderCard(envOf(status, null, 'Detailtext.'));
      expect(screen.queryByTestId('body')).toBeNull();
      expect(screen.getByRole('note')).toHaveTextContent('Detailtext.');
      const pill = document.querySelector('.status-pill');
      expect(pill).toHaveAttribute('data-state', status);
    },
  );

  it('demo + data: body without note (demo is banner-labelled, not a defect state)', () => {
    renderCard(envOf('demo', { items: ['a'] }));
    expect(screen.getByTestId('body')).toBeInTheDocument();
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('loading: LoadingNote until the envelope arrives; no inspect button yet', () => {
    renderCard(undefined, { isLoading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Wird geladen');
    expect(screen.queryByRole('button', { name: /Belege anzeigen/ })).toBeNull();
  });

  it('inspect button carries the exact inspector title (aria-label stability)', () => {
    renderCard(envOf('ok', { items: ['a'] }));
    expect(
      screen.getByRole('button', { name: 'Belege anzeigen: Testmodul (Quelle)' }),
    ).toBeInTheDocument();
  });

  it('renders as a named region with the module title (E2E selector contract)', () => {
    renderCard(envOf('ok', { items: ['a'] }));
    expect(screen.getByRole('region', { name: 'Testmodul' })).toBeInTheDocument();
  });
});

describe('ModuleCard — config-hint variant names the env var [GD-TRUTH-02]', () => {
  it('renders the server statusDetail (which names the exact env var)', () => {
    renderWithProviders(
      <ModuleCard<Payload>
        moduleKey="fuel"
        title="Kraftstoffpreise"
        inspectorTitle="Kraftstoffpreise (MTS-K / Tankerkönig)"
        query={queryOf(envOf('configuration-required', null, 'TANKERKOENIG_API_KEY fehlt.'))}
        variant="config-hint"
      >
        {() => null}
      </ModuleCard>,
    );
    expect(screen.getByText('TANKERKOENIG_API_KEY fehlt.')).toBeInTheDocument();
    expect(document.querySelector('.status-pill')).toHaveAttribute(
      'data-state',
      'configuration-required',
    );
    // Compact row: no inspect button, no body.
    expect(screen.queryByRole('button', { name: /Belege anzeigen/ })).toBeNull();
  });

  it('falls back to a generic hint when the server omits the detail', () => {
    renderWithProviders(
      <ModuleCard<Payload>
        moduleKey="fuel"
        title="Kraftstoffpreise"
        inspectorTitle="Kraftstoffpreise (MTS-K / Tankerkönig)"
        query={queryOf(envOf('configuration-required', null))}
        variant="config-hint"
      >
        {() => null}
      </ModuleCard>,
    );
    expect(
      screen.getByText('Konfiguration erforderlich — siehe Datenverfügbarkeit.'),
    ).toBeInTheDocument();
  });
});
