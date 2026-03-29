import { Box, Cpu, MessageSquare } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import type { RoomId, AgentId, ShellMode } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';
import { getCurrentRoom } from '@/adapters/kernelAdapter';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  roomId: RoomId;
  mode: ShellMode;
  talkAgent: AgentId | null;
  theme: ThemeSpec;
  showAnnotations: boolean;
}

export function VisualArea({ roomId, mode, talkAgent, theme, showAnnotations }: Props) {
  const room = getCurrentRoom(roomId);
  const kernelAnnotation = getAnnotationClasses('kernel', showAnnotations);
  const bridgeAnnotation = getAnnotationClasses('bridge', showAnnotations);

  return (
    <div className="h-1/3 border-b border-gray-900 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <div className={`relative w-40 h-40 flex items-center justify-center ${kernelAnnotation}`}>
        {mode === 'talk' && talkAgent ? (
          <div className={`relative z-10 flex flex-col items-center ${bridgeAnnotation}`}>
            <div className="w-16 h-16 bg-purple-900/40 rounded border border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-sm">
              <MessageSquare size={24} className="text-purple-300 animate-pulse" />
            </div>
            <div className="mt-4 text-purple-400 font-bold tracking-widest text-sm bg-black/60 px-3 py-1 rounded">
              {talkAgent}
            </div>
            <div className="text-[10px] text-purple-500/70 mt-1 uppercase">
              {UI_LABELS.logPanel.bridgeDialogueActive}
            </div>
          </div>
        ) : room.objects.includes('matrix_brain') ? (
          <div className="relative z-10">
            <div
              className={`absolute inset-0 rounded-full opacity-20 blur-2xl animate-pulse ${theme.bgAccent} transition-colors duration-700`}
            ></div>
            <div
              className={`absolute inset-2 rounded-full border-2 border-dashed ${theme.border} animate-[spin_20s_linear_infinite] opacity-30`}
            ></div>
            <div
              className={`w-20 h-20 rounded-full ${theme.bgAccentLight} border ${theme.border} ${theme.glow} flex items-center justify-center relative overflow-hidden mx-auto`}
            >
              <Cpu size={32} className={`${theme.text} z-10 animate-pulse`} />
            </div>
            <div
              className={`mt-4 text-[10px] tracking-[0.3em] ${theme.text} whitespace-nowrap opacity-70 text-center font-bold`}
            >
              [OBJECT: MATRIX_BRAIN]
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center opacity-40">
            <Box size={32} className="text-gray-600" />
            <div className="mt-4 text-gray-500 tracking-widest text-xs uppercase">{room.id}</div>
            <div className="text-[9px] text-gray-600 mt-1">
              Objects: {room.objects.length} | Agents: {room.agents.length}
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end text-[10px] font-mono z-20">
        <div className={theme.text}>{UI_LABELS.logPanel.hudOnline}</div>
        <div className="text-gray-500">{UI_LABELS.logPanel.hudLoc(room.id)}</div>
      </div>
    </div>
  );
}
