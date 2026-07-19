import { useState } from 'react';
import { type ModuleEnvelope } from '@invisible-city/contracts';
import { type UseQueryResult } from '@tanstack/react-query';
import { StatusPill } from '../primitives.js';
import { ModuleCard } from './ModuleCard.js';
import { type AnyLensModuleDef, type LensCtx, type LensModuleKey } from './registry.js';

export interface ContextEntry {
  def: AnyLensModuleDef;
  query: UseQueryResult<ModuleEnvelope<unknown>>;
  /** Renders as the compact configuration-required hint row (GD-TRUTH-02). */
  configHint: boolean;
}

/**
 * "Weitere Kontexte" — the collapsed context tier. Keyboard-accessible
 * disclosure (h3-in-button accordion, aria-expanded/aria-controls); each row
 * shows title + status pill + a factual one-line summary and expands into the
 * full module card on demand. Unconfigured key-gated modules appear here as
 * compact hint rows naming their env vars.
 */
export function ContextSection({ entries, ctx }: { entries: ContextEntry[]; ctx: LensCtx }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<LensModuleKey>>(new Set());

  if (entries.length === 0) return null;

  const toggleRow = (key: LensModuleKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="context-section" aria-labelledby="lens-context-h">
      <h3 id="lens-context-h" className="context-heading">
        <button
          type="button"
          className="context-toggle"
          aria-expanded={open}
          aria-controls="lens-context-body"
          onClick={() => setOpen((o) => !o)}
        >
          Weitere Kontexte ({entries.length})
          <span className="chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
        </button>
      </h3>
      <div id="lens-context-body" hidden={!open}>
        {entries.map(({ def, query, configHint }) => {
          if (configHint) {
            return (
              <ModuleCard
                key={def.key}
                moduleKey={def.key}
                title={def.title}
                inspectorTitle={def.inspectorTitle}
                query={query}
                variant="config-hint"
              >
                {() => null}
              </ModuleCard>
            );
          }
          const env = query.data;
          const summaryText = env ? def.summary(env) : '';
          const isExpanded = expanded.has(def.key);
          return (
            <div key={def.key} className="context-item">
              <div className="context-row" data-module={def.key}>
                <button
                  type="button"
                  className="context-row-toggle"
                  aria-expanded={isExpanded}
                  aria-controls={`ctx-${def.key}`}
                  aria-label={`Details: ${def.title}`}
                  onClick={() => toggleRow(def.key)}
                >
                  <span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
                </button>
                <span className="context-row-title">{def.title}</span>
                {env ? <StatusPill status={env.status} /> : null}
                <span className="context-summary">{summaryText}</span>
              </div>
              <div id={`ctx-${def.key}`} hidden={!isExpanded}>
                {isExpanded ? (
                  <ModuleCard
                    moduleKey={def.key}
                    title={def.title}
                    inspectorTitle={def.inspectorTitle}
                    query={query}
                    isEmpty={def.isEmpty}
                    emptyText={def.emptyText}
                  >
                    {(data) => def.renderBody(data, ctx)}
                  </ModuleCard>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
