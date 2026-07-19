import { type ReactNode } from 'react';
import { type ModuleEnvelope } from '@invisible-city/contracts';
import { type UseQueryResult } from '@tanstack/react-query';
import { StatusPill, ModuleStatusNote, LoadingNote, InspectButton } from '../primitives.js';

/**
 * The single shared module-card scaffold. Unified gating semantics (§3.1.J):
 *  - the status note renders whenever status ∉ {ok, demo} — also for partial/stale
 *    envelopes that still carry data (the state must be explained, not hidden);
 *  - the body renders whenever data is present and not empty — partial data
 *    renders alongside its note;
 *  - an empty collection with ok/demo status renders the module's honest-absence
 *    copy (absence ≠ error); with a degraded status the note explains instead.
 */
export interface ModuleCardProps<T> {
  moduleKey: string;
  /** German card title (exact current strings — E2E selectors depend on them). */
  title: string;
  /** Evidence-inspector title (exact current strings — aria-labels depend on them). */
  inspectorTitle: string;
  query: UseQueryResult<ModuleEnvelope<T>>;
  /** Collection-empty predicate; only consulted when data is non-null. */
  isEmpty?: ((data: T) => boolean) | undefined;
  /** Honest-absence copy shown for empty data with ok/demo status. */
  emptyText?: string | undefined;
  /** 'config-hint': compact one-line row for configuration-required modules. */
  variant?: 'full' | 'config-hint' | undefined;
  /** Optional badge chip (e.g. 'aktiv' for promoted context modules). */
  badge?: ReactNode | undefined;
  children: (data: T) => ReactNode;
}

export function ModuleCard<T>({
  moduleKey,
  title,
  inspectorTitle,
  query,
  isEmpty,
  emptyText,
  variant = 'full',
  badge,
  children,
}: ModuleCardProps<T>) {
  const env = query.data;
  const headingId = `lens-${moduleKey}-h`;

  if (variant === 'config-hint') {
    return (
      <section className="card config-hint" aria-labelledby={headingId} data-module={moduleKey}>
        <div className="card-head">
          <h3 id={headingId} className="card-title">
            {title}
          </h3>
          {env ? <StatusPill status={env.status} /> : null}
        </div>
        <p className="config-hint-text">
          {env?.statusDetail ?? 'Konfiguration erforderlich — siehe Datenverfügbarkeit.'}
        </p>
      </section>
    );
  }

  const empty = env?.data != null && (isEmpty?.(env.data) ?? false);
  const showBody = env?.data != null && !empty;
  const okLike = env?.status === 'ok' || env?.status === 'demo';

  return (
    <section className="card" aria-labelledby={headingId} data-module={moduleKey}>
      <div className="card-head">
        <h3 id={headingId} className="card-title">
          {title}
        </h3>
        <span className="card-head-side">
          {badge}
          {env ? <StatusPill status={env.status} /> : null}
        </span>
      </div>
      {query.isLoading ? <LoadingNote /> : null}
      {env && !okLike ? <ModuleStatusNote status={env.status} detail={env.statusDetail} /> : null}
      {empty && okLike && emptyText ? (
        <p className="loading-shimmer" style={{ marginBottom: 0 }}>
          {emptyText}
        </p>
      ) : null}
      {showBody && env ? children(env.data as T) : null}
      {env ? (
        <div style={{ marginTop: 8 }}>
          <InspectButton
            title={inspectorTitle}
            evidence={env.evidence}
            limitations={env.limitations}
          />
        </div>
      ) : null}
    </section>
  );
}
