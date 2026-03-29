import { Zap } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import type { ThemeSpec } from '@/types/ui';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  totalRooms: number;
  totalAgents: number;
  theme: ThemeSpec;
  showAnnotations: boolean;
}

export function StatusPanel({ totalRooms, totalAgents, theme, showAnnotations }: Props) {
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
    </div>
  );
}
