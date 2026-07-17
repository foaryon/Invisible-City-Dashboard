import { type ReactNode } from 'react';
import { type DataMode, type Evidence, type ModuleStatus } from '@invisible-city/contracts';
import { MODE_LABEL_DE } from '@invisible-city/evidence';
import { useAppStore } from '../state/store.js';

export function DataModeChip({ mode, strong }: { mode: DataMode; strong?: boolean }) {
  return (
    <span className={`chip${strong ? ' mode-strong' : ''}`} data-mode={mode}>
      {MODE_LABEL_DE[mode]}
    </span>
  );
}

const STATUS_LABEL: Record<ModuleStatus, string> = {
  ok: 'Verfügbar',
  partial: 'Teilweise',
  stale: 'Veraltet (Cache)',
  unavailable: 'Nicht verfügbar',
  'source-error': 'Quellenfehler',
  'configuration-required': 'Konfiguration erforderlich',
  demo: 'Demo',
};

export function StatusPill({ status }: { status: ModuleStatus }) {
  const icon =
    status === 'ok'
      ? '✓'
      : status === 'partial' || status === 'stale'
        ? '◐'
        : status === 'demo'
          ? '◆'
          : '○';
  return (
    <span className="status-pill" data-state={status}>
      <span className="icon" aria-hidden="true">
        {icon}
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Opens the Evidence Inspector for a set of evidence records. */
export function InspectButton({
  title,
  evidence,
  limitations,
}: {
  title: string;
  evidence: Evidence[];
  limitations: string[];
}) {
  const inspect = useAppStore((s) => s.inspect);
  return (
    <button
      type="button"
      className="inspect-btn"
      onClick={() => inspect({ title, evidence, limitations })}
      aria-label={`Belege anzeigen: ${title}`}
    >
      Belege
    </button>
  );
}

export function ValueRow({
  label,
  children,
  na,
}: {
  label: string;
  children: ReactNode;
  na?: boolean;
}) {
  return (
    <div className="value-row">
      <span className="label">{label}</span>
      <span className={`value${na ? ' na' : ''}`}>{children}</span>
    </div>
  );
}

export function LoadingNote({ label }: { label?: string }) {
  return (
    <p className="loading-shimmer" role="status">
      {label ?? 'Wird geladen …'}
    </p>
  );
}

/**
 * Renders module status honestly: distinct copy for each non-ok state,
 * explaining what is missing and what cannot be concluded (§3.1.J).
 */
export function ModuleStatusNote({
  status,
  detail,
}: {
  status: ModuleStatus;
  detail?: string | undefined;
}) {
  if (status === 'ok') return null;
  const cls =
    status === 'source-error' || status === 'unavailable' ? 'error-note' : 'loading-shimmer';
  return (
    <p className={cls} role="note">
      {detail ?? 'Keine verifizierten Daten verfügbar.'}
    </p>
  );
}
