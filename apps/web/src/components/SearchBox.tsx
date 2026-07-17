import { useEffect, useRef, useState } from 'react';
import { type GeocodeResult } from '@invisible-city/contracts';
import { useAppStore } from '../state/store.js';
import { api } from '../api.js';

/**
 * Place search. Photon (used server-side) is search-as-you-type capable; we
 * debounce to respect the public instance's throttling and keep requests
 * modest. Selection produces the SAME SelectedPlace contract as a map click.
 */
export function SearchBox() {
  const { selectPlace, demoMode } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  // The label written back into the input on selection — do not re-search it.
  const suppressRef = useRef<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }
    if (q === suppressRef.current) {
      suppressRef.current = null;
      return;
    }
    let cancelled = false;
    setStatus('loading');
    const t = setTimeout(async () => {
      try {
        const env = await api.search(q, demoMode);
        if (cancelled) return;
        const data = env.data ?? [];
        setResults(data);
        setStatus(env.status === 'source-error' ? 'error' : data.length === 0 ? 'empty' : 'idle');
        setOpen(true);
        setActive(-1);
      } catch {
        if (!cancelled) setStatus('error');
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, demoMode]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (r: GeocodeResult) => {
    selectPlace(r.place);
    suppressRef.current = r.place.label.trim();
    setQuery(r.place.label);
    setOpen(false);
    setResults([]);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(results[active]!);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search-box" ref={boxRef}>
      <label htmlFor="place-search" className="visually-hidden">
        Ort, Adresse oder Koordinaten suchen
      </label>
      <input
        id="place-search"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        aria-autocomplete="list"
        aria-activedescendant={
          open && active >= 0 && results[active]
            ? `search-opt-${results[active].place.id}`
            : undefined
        }
        placeholder="Ort, Adresse oder Koordinaten suchen …"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul className="search-results" id="search-results" role="listbox">
          {status === 'loading' ? (
            <li>
              <span className="loading-shimmer" style={{ padding: '8px 10px', display: 'block' }}>
                Suche läuft …
              </span>
            </li>
          ) : null}
          {status === 'error' ? (
            <li>
              <span className="error-note" style={{ padding: '8px 10px', display: 'block' }}>
                Geokodierungsquelle nicht erreichbar. Keine Ersatzergebnisse.
              </span>
            </li>
          ) : null}
          {status === 'empty' ? (
            <li>
              <span className="loading-shimmer" style={{ padding: '8px 10px', display: 'block' }}>
                Keine Treffer in Deutschland.
              </span>
            </li>
          ) : null}
          {results.map((r, i) => (
            // ARIA combobox pattern: options are selectable but NOT focusable
            // (no focusable descendants). Navigation is via arrow keys +
            // aria-activedescendant; a click selects. Focus stays on the input.
            <li
              key={r.place.id}
              id={`search-opt-${r.place.id}`}
              role="option"
              aria-selected={i === active}
              className="search-option"
              // onMouseDown so selection fires before the input's blur/outside handler.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(r);
              }}
              onMouseEnter={() => setActive(i)}
              style={i === active ? { background: 'var(--bg-panel-2)' } : undefined}
            >
              {r.place.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
