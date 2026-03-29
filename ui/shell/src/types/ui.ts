import type { ThemeKey, TruthLayer } from './world';

export interface ThemeSpec {
  name: string;
  bg: string;
  border: string;
  text: string;
  accent: string;
  glow: string;
  bgAccent: string;
  bgAccentLight: string;
  textAccent: string;
  borderAccent: string;
  worldBorder: string;
  worldBg: string;
  mapGlow: string;
}

export interface TruthLayerSpec {
  label: string;
  ringClass: string;
  beforeClass: string;
}

export const TRUTH_LAYER_SPECS: Record<TruthLayer, TruthLayerSpec> = {
  kernel: {
    label: 'KERNEL-BACKED',
    ringClass: 'ring-green-500/50',
    beforeClass: 'before:bg-green-600 before:text-white',
  },
  bridge: {
    label: 'BRIDGE-BACKED',
    ringClass: 'ring-blue-500/50',
    beforeClass: 'before:bg-blue-600 before:text-white',
  },
  mock: {
    label: 'MOCK-ONLY',
    ringClass: 'ring-orange-500/50',
    beforeClass: 'before:bg-orange-600 before:text-white',
  },
};

export const THEMES: Record<ThemeKey, ThemeSpec> = {
  neo: {
    name: 'Neo Terminal',
    bg: 'bg-black',
    border: 'border-cyan-500/30',
    text: 'text-cyan-500',
    accent: 'cyan',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    bgAccent: 'bg-cyan-500',
    bgAccentLight: 'bg-cyan-950',
    textAccent: 'text-cyan-500',
    borderAccent: 'border-cyan-500',
    worldBorder: 'border-cyan-500',
    worldBg: 'bg-cyan-950/30',
    mapGlow: 'shadow-[0_0_8px_#06b6d4]',
  },
  living: {
    name: 'Living Core',
    bg: 'bg-slate-950',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-400',
    accent: 'fuchsia',
    glow: 'shadow-[0_0_20px_rgba(217,70,239,0.2)]',
    bgAccent: 'bg-fuchsia-500',
    bgAccentLight: 'bg-fuchsia-950',
    textAccent: 'text-fuchsia-400',
    borderAccent: 'border-fuchsia-500',
    worldBorder: 'border-fuchsia-500',
    worldBg: 'bg-fuchsia-950/20',
    mapGlow: 'shadow-[0_0_8px_#d946ef]',
  },
  civ: {
    name: 'Civilization',
    bg: 'bg-stone-950',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    accent: 'amber',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    bgAccent: 'bg-amber-500',
    bgAccentLight: 'bg-amber-950',
    textAccent: 'text-amber-500',
    borderAccent: 'border-amber-500',
    worldBorder: 'border-amber-500',
    worldBg: 'bg-amber-950/30',
    mapGlow: 'shadow-[0_0_8px_#f59e0b]',
  },
};
