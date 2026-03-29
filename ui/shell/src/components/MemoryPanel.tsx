import { FileEdit } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import { requestMemoryPanel } from '@/adapters/bridgeAdapter';
import { useEffect, useState } from 'react';
import type { AgentId, RoomId } from '@/types/world';
import type { BridgeMemoryPanelResponse, MemoryPanelNote } from '@/types/bridge';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  showAnnotations: boolean;
  agentId?: AgentId | null;
  roomId: RoomId;
}

function importanceBorderClass(importance: MemoryPanelNote['importance']): string {
  switch (importance) {
    case 'high':
      return 'border-red-500/30 bg-red-950/10';
    case 'medium':
      return 'border-amber-500/30 bg-amber-950/10';
    case 'low':
    default:
      return 'border-purple-500/30 bg-purple-950/10';
  }
}

function tagColorClass(kind: MemoryPanelNote['tags'][number]['kind']): string {
  switch (kind) {
    case 'agent':
      return 'border-blue-900 text-blue-400';
    case 'object':
      return 'border-emerald-900 text-emerald-400';
    case 'room':
      return 'border-amber-900 text-amber-400';
    case 'governance':
      return 'border-red-900 text-red-400';
    case 'memory':
    default:
      return 'border-purple-900 text-purple-400';
  }
}

export function MemoryPanel({ showAnnotations, agentId, roomId }: Props) {
  const annotation = getAnnotationClasses('bridge', showAnnotations);
  const [data, setData] = useState<BridgeMemoryPanelResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    requestMemoryPanel(roomId, agentId ?? undefined).then((res) => {
      if (mounted) setData(res);
    });
    return () => {
      mounted = false;
    };
  }, [roomId, agentId]);

  const fallbackHeader = agentId ? `${agentId} View (Bridge)` : UI_LABELS.memoryPanel.header;

  return (
    <div className={`space-y-4 ${annotation}`}>
      <div className="flex items-center gap-2 mb-4 border-b border-purple-900/50 pb-2">
        <FileEdit size={14} className="text-purple-400" />
        <div className="text-sm font-bold text-purple-400">
          {data?.header ?? fallbackHeader}
        </div>
      </div>

      {data && data.errors.length > 0 && (
        <div className="p-3 border border-red-500/40 bg-red-950/20 rounded">
          <div className="text-xs font-bold text-red-400 mb-1">Bridge Error</div>
          {data.errors.map((e, idx) => (
            <div key={idx} className="text-xs text-red-300">
              {e.code}: {e.message}
            </div>
          ))}
        </div>
      )}

      {data?.notice && (
        <div className="text-xs text-purple-300/80 italic">{data.notice}</div>
      )}

      {(data?.sections ?? []).length === 0 && (!data || data.errors.length === 0) && (
        <div className="p-3 border border-purple-500/30 bg-purple-950/10 rounded">
          <div className="text-xs text-purple-300/80 mb-2 italic">
            {UI_LABELS.memoryPanel.mockNotice}
          </div>
          <div className="text-xs font-bold text-gray-300 mb-2">
            {UI_LABELS.memoryPanel.sampleTitle}
          </div>
          <div className="text-xs text-gray-400 leading-relaxed mb-3">
            {UI_LABELS.memoryPanel.sampleText}
          </div>
          <div className="flex flex-wrap gap-2">
            {['matrix_brain', 'archive_hall'].map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-2 py-0.5 bg-black border border-purple-900 text-purple-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {(data?.sections ?? []).map((section) => (
        <div key={section.id} className="space-y-2">
          <div className="text-xs font-semibold text-gray-300">{section.title}</div>
          {section.notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 border rounded ${importanceBorderClass(note.importance)}`}
            >
              <div className="text-xs font-bold text-gray-300 mb-1">{note.title}</div>
              <div className="text-xs text-gray-400 leading-relaxed mb-2">{note.text}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {note.tags.map((tag, tidx) => (
                  <span
                    key={tidx}
                    className={`text-[9px] px-2 py-0.5 bg-black border rounded ${tagColorClass(tag.kind)}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
              <div className="text-[9px] text-gray-500">
                source: {note.source.type}
                {note.source.ref ? ` / ${note.source.ref}` : ''}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
