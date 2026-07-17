import { useAppStore, selectedInstantIso } from '../state/store.js';
import { formatBerlin } from '@invisible-city/evidence';

export function TimeControl() {
  const { timeOffsetHours, setTimeOffset } = useAppStore();
  const iso = selectedInstantIso(timeOffsetHours);
  const isNow = timeOffsetHours === 0;

  return (
    <div className="time-control">
      <span className="panel-title" style={{ margin: 0 }}>
        Zeit
      </span>
      <button type="button" className="btn" onClick={() => setTimeOffset(0)} aria-pressed={isNow}>
        Jetzt
      </button>
      <label htmlFor="time-range" className="visually-hidden">
        Zeitpunkt bis 48 Stunden voraus wählen
      </label>
      <input
        id="time-range"
        type="range"
        min={0}
        max={48}
        step={1}
        value={timeOffsetHours}
        onChange={(e) => setTimeOffset(Number(e.target.value))}
      />
      <span className="time-readout">
        {isNow ? 'Jetzt · ' : `+${timeOffsetHours} h · `}
        {formatBerlin(iso)} <span style={{ color: 'var(--text-faint)' }}>(Europe/Berlin)</span>
      </span>
    </div>
  );
}
