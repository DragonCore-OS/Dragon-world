import { AlertTriangle, GitCommit } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import { getMockProposals } from '@/adapters/mockAdapter';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  showAnnotations: boolean;
}

export function ForgePanel({ showAnnotations }: Props) {
  const annotation = getAnnotationClasses('mock', showAnnotations);
  const proposals = getMockProposals();

  return (
    <div className={`space-y-4 ${annotation}`}>
      <div className="bg-orange-950/50 border border-orange-500/50 p-2 rounded flex items-start gap-2 mb-4">
        <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-orange-400">
            {UI_LABELS.forgePanel.mockTitle}
          </div>
          <div className="text-[10px] text-orange-500/70">
            {UI_LABELS.forgePanel.mockSubtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <GitCommit size={14} className="text-orange-400" />
        <div className="text-sm font-bold text-orange-400">
          {UI_LABELS.forgePanel.proposalPreview}
        </div>
      </div>

      {proposals.map((p) => (
        <div
          key={p.id}
          className="p-4 border border-orange-500/40 bg-orange-950/20 rounded relative opacity-80 cursor-not-allowed"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="bg-orange-600 text-black text-[10px] font-bold px-2 py-1 rounded uppercase">
              {p.statusLabel}
            </div>
            <div className="text-xs text-orange-500/60 font-mono">{p.prId}</div>
          </div>
          <div className="text-sm font-bold text-gray-400 mb-1">{p.title}</div>
          <div className="text-xs text-gray-500 mb-4 line-clamp-2">{p.description}</div>
          <div className="flex gap-2">
            <button disabled className="flex-1 py-2 bg-gray-900 border border-gray-700 text-gray-600 text-xs font-bold rounded">
              {UI_LABELS.forgePanel.approveDisabled}
            </button>
            <button disabled className="flex-1 py-2 bg-gray-900 border border-gray-700 text-gray-600 text-xs font-bold rounded">
              {UI_LABELS.forgePanel.rejectDisabled}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
