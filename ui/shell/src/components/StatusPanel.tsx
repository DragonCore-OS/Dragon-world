import { Zap } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import type { ThemeSpec } from '@/types/ui';
import type { BridgeStatus } from '@/types/bridge';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  totalRooms: number;
  totalAgents: number;
  theme: ThemeSpec;
  showAnnotations: boolean;
  bridgeStatus: BridgeStatus;
}

function bridgeBadgeClasses(mode: BridgeStatus['mode'], connected: boolean): string {
  if (mode === 'disabled') {
    return 'bg-gray-800 text-gray-400 border-gray-600';
  }
  if (mode === 'mock') {
    return 'bg-blue-950 text-blue-300 border-blue-700';
  }
  if (connected) {
    return 'bg-green-950 text-green-300 border-green-700';
  }
  return 'bg-red-950 text-red-300 border-red-700';
}

export function StatusPanel({
  totalRooms,
  totalAgents,
  theme,
  showAnnotations,
  bridgeStatus,
}: Props) {
  const annotation = getAnnotationClasses('kernel', showAnnotations);

  return (
    <div className={`space-y-6 ${annotation}`}>
      <div className={`p-4 border ${theme.border} bg-gray-900/30 rounded flex items-center justify-between`}>
        <div>
          <div className="text-xs text-gray-500 mb-1">{UI_LABELS.statusPanel.worldState}</div>
          <div className={`text-lg font-bold ${theme.text} flex items-center gap-2`}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {UI_LABELS.statusPanel.aligned}
          </div>
        </div>
        <Zap className="text-gray-700" size={24} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-900/40 border border-gray-800 rounded">
          <div className="text-[10px] text-gray-500 mb-1">{UI_LABELS.statusPanel.totalRooms}</div>
          <div className="text-xl text-gray-200">{totalRooms}</div>
        </div>
        <div className="p-3 bg-gray-900/40 border border-gray-800 rounded">
          <div className="text-[10px] text-gray-500 mb-1">{UI_LABELS.statusPanel.activeAgents}</div>
          <div className="text-xl text-gray-200">{totalAgents}</div>
        </div>
      </div>

      {/* Bridge Observability */}
      <div className="p-4 border border-purple-500/30 bg-purple-950/10 rounded">
        <div className="text-[10px] text-purple-400 uppercase mb-2 tracking-wider">Bridge Status</div>
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${bridgeBadgeClasses(
              bridgeStatus.mode,
              bridgeStatus.connected
            )}`}
          >
            {bridgeStatus.mode}
          </span>
          {bridgeStatus.connected ? (
            <span className="text-xs text-green-400">connected</span>
          ) : bridgeStatus.mode === 'remote' ? (
            <span className="text-xs text-red-400">unavailable</span>
          ) : (
            <span className="text-xs text-gray-500">—</span>
          )}
        </div>

        <div className="space-y-1 text-xs text-gray-400 font-mono">
          <div className="flex justify-between">
            <span>latency</span>
            <span className="text-gray-200">
              {bridgeStatus.latencyMs !== null ? `${bridgeStatus.latencyMs}ms` : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>last error</span>
            <span className={bridgeStatus.lastError ? 'text-red-400' : 'text-gray-200'}>
              {bridgeStatus.lastError || 'none'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
