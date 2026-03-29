import type { TruthLayer } from '@/types/world';

export interface ComponentTruthLayer {
  component: string;
  layer: TruthLayer;
  note?: string;
}

// Single source of truth for which UI blocks belong to which layer.
export const TRUTH_LAYERS: ComponentTruthLayer[] = [
  { component: 'RoomPanel', layer: 'kernel', note: 'Room name, desc, exits, agents, objects come directly from kernel seed world.' },
  { component: 'MapPanel', layer: 'kernel', note: 'Map topology is a strict visualization of kernel room graph.' },
  { component: 'CommandBar', layer: 'kernel', note: 'Command parser behavior is aligned with crates/command-parser.' },
  { component: 'LogPanel-world', layer: 'kernel', note: 'World logs reflect deterministic kernel output.' },
  { component: 'StatusPanel', layer: 'kernel', note: 'Status reflects kernel-backed world counters.' },
  { component: 'LogPanel-ai', layer: 'bridge', note: 'AI dialogue logs require DeerFlow bridge to generate real responses.' },
  { component: 'MemoryPanel', layer: 'bridge', note: 'Memory panel depends on AI Bridge generation.' },
  { component: 'VisualArea-talk', layer: 'bridge', note: 'Talk mode visual is a bridge-backed placeholder.' },
  { component: 'ForgePanel', layer: 'mock', note: 'Forge / Proposal flow is not yet implemented. Pure mock UI.' },
];

export function getAnnotationClasses(layer: TruthLayer, enabled: boolean): string {
  if (!enabled) return '';
  const base =
    "relative before:absolute before:-top-3 before:-left-1 before:text-[9px] before:font-bold before:px-1 before:rounded before:z-50 ring-2 ring-offset-1 ring-offset-black ";
  switch (layer) {
    case 'kernel':
      return base + "ring-green-500/50 before:bg-green-600 before:text-white before:content-['KERNEL-BACKED']";
    case 'bridge':
      return base + "ring-blue-500/50 before:bg-blue-600 before:text-white before:content-['BRIDGE-BACKED']";
    case 'mock':
      return base + "ring-orange-500/50 before:bg-orange-600 before:text-white before:content-['MOCK-ONLY']";
    default:
      return '';
  }
}
