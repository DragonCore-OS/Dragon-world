import { FileEdit } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import { requestMemoryPanel } from '@/adapters/bridgeAdapter';
import { useEffect, useState } from 'react';
import type { AgentId, RoomId } from '@/types/world';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  showAnnotations: boolean;
  agentId?: AgentId | null;
  roomId: RoomId;
}

export function MemoryPanel({ showAnnotations, agentId, roomId }: Props) {
  const annotation = getAnnotationClasses('bridge', showAnnotations);
  const [data, setData] = useState<{
    header: string;
    notice: string;
    sampleTitle: string;
    sampleText: string;
    tags: string[];
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    requestMemoryPanel(roomId, agentId ?? undefined).then((res) => {
      if (mounted) setData(res);
    });
    return () => {
      mounted = false;
    };
  }, [roomId, agentId]);

  return (
    <div className={`space-y-4 ${annotation}`}>
      <div className="flex items-center gap-2 mb-4 border-b border-purple-900/50 pb-2">
        <FileEdit size={14} className="text-purple-400" />
        <div className="text-sm font-bold text-purple-400">
          {data?.header ?? UI_LABELS.memoryPanel.header}
        </div>
      </div>
      <div className="p-3 border border-purple-500/30 bg-purple-950/10 rounded">
        <div className="text-xs text-purple-300/80 mb-2 italic">
          {data?.notice ?? UI_LABELS.memoryPanel.mockNotice}
        </div>
        <div className="text-xs font-bold text-gray-300 mb-2">
          {data?.sampleTitle ?? UI_LABELS.memoryPanel.sampleTitle}
        </div>
        <div className="text-xs text-gray-400 leading-relaxed mb-3">
          {data?.sampleText ?? UI_LABELS.memoryPanel.sampleText}
        </div>
        <div className="flex flex-wrap gap-2">
          {(data?.tags ?? ['matrix_brain', 'archive_hall']).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-2 py-0.5 bg-black border border-purple-900 text-purple-400 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
