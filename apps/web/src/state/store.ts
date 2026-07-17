import { create } from 'zustand';
import { type SelectedPlace, type PinSlot, type Evidence } from '@invisible-city/contracts';
import { type AnalyticalLayerId } from '@invisible-city/map-style';

export interface InspectorTarget {
  title: string;
  evidence: Evidence[];
  limitations: string[];
}

interface AppState {
  selectedPlace: SelectedPlace | null;
  pins: Partial<Record<PinSlot, SelectedPlace>>;
  activeLayer: AnalyticalLayerId;
  /** Hours from "now" (0 = jetzt, up to +48 h). */
  timeOffsetHours: number;
  /** Opt-in demo mode — permanently labelled while active (§3.1.J). */
  demoMode: boolean;
  inspector: InspectorTarget | null;
  mobilePanel: 'lens' | 'inspector' | null;

  selectPlace: (place: SelectedPlace | null) => void;
  setPin: (slot: PinSlot, place: SelectedPlace | null) => void;
  setLayer: (layer: AnalyticalLayerId) => void;
  setTimeOffset: (hours: number) => void;
  setDemoMode: (on: boolean) => void;
  inspect: (target: InspectorTarget | null) => void;
  setMobilePanel: (panel: 'lens' | 'inspector' | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedPlace: null,
  pins: {},
  activeLayer: 'weather',
  timeOffsetHours: 0,
  demoMode: false,
  inspector: null,
  mobilePanel: null,

  selectPlace: (place) => set({ selectedPlace: place }),
  setPin: (slot, place) =>
    set((s) => {
      const pins = { ...s.pins };
      if (place) pins[slot] = place;
      else delete pins[slot];
      return { pins };
    }),
  setLayer: (layer) => set({ activeLayer: layer }),
  setTimeOffset: (hours) => set({ timeOffsetHours: Math.max(0, Math.min(48, hours)) }),
  setDemoMode: (on) => set({ demoMode: on, inspector: null }),
  inspect: (target) => set({ inspector: target, mobilePanel: target ? 'inspector' : null }),
  setMobilePanel: (panel) => set({ mobilePanel: panel }),
}));

/** The selected instant, derived from "now" + offset (Europe/Berlin display). */
export function selectedInstantIso(offsetHours: number): string {
  return new Date(Date.now() + offsetHours * 3600_000).toISOString();
}
