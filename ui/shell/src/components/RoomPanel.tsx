import { useState, useEffect } from 'react';
import {
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Users,
  MessageSquare,
  Box,
  Database,
  ChevronRight,
} from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import { getCurrentRoom, getVisibleAgents } from '@/adapters/kernelAdapter';
import type { RoomId, RoomData, AgentData } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  roomId: RoomId;
  theme: ThemeSpec;
  showAnnotations: boolean;
  onTalk: (agentId: string) => void;
  onInspect: (objectId: string) => void;
  onNavigate: (direction: string) => void;
}

export function RoomPanel({ roomId, theme, showAnnotations, onTalk, onInspect, onNavigate }: Props) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const annotation = getAnnotationClasses('kernel', showAnnotations);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getCurrentRoom(roomId), getVisibleAgents(roomId)]).then(([r, a]) => {
      if (mounted) {
        setRoom(r);
        setAgents(a);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const dirBtn = (dir: 'north' | 'south' | 'east' | 'west', icon: React.ReactNode) => {
    const enabled = !!room?.exits?.[dir];
    return (
      <button
        onClick={() => onNavigate(dir)}
        disabled={!enabled}
        className={`p-1 rounded bg-gray-800 flex justify-center border ${
          enabled
            ? `${theme.border} ${theme.text} hover:bg-gray-700`
            : 'border-transparent text-gray-800 opacity-30 cursor-not-allowed'
        }`}
      >
        {icon}
      </button>
    );
  };

  if (loading || !room) {
    return (
      <div className={`space-y-6 ${annotation}`}>
        <div className="text-xs text-gray-500">Loading room data...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${annotation}`}>
      {/* Room Card */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
          <Compass size={12} /> {UI_LABELS.roomPanel.currentRoom}
        </div>
        <div className={`border ${theme.border} bg-gray-900/40 rounded p-3 relative overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${theme.bgAccent}`}></div>
          <div className={`text-lg font-bold ${theme.text} mb-1`}>{room.name}</div>
          <div className="text-xs text-gray-400 mb-3 font-bold">{room.id}</div>

          <div className="grid grid-cols-3 gap-1 w-24 mx-auto mt-4 mb-2">
            <div />
            {dirBtn('north', <ArrowUp size={14} />)}
            <div />
            {dirBtn('west', <ArrowLeft size={14} />)}
            <div className="p-1 flex justify-center items-center text-xs text-gray-500">◎</div>
            {dirBtn('east', <ArrowRight size={14} />)}
            <div />
            {dirBtn('south', <ArrowDown size={14} />)}
            <div />
          </div>
        </div>
      </div>

      {/* Agents */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
          <Users size={12} /> {UI_LABELS.roomPanel.agentsInRoom(agents.length)}
        </div>
        {agents.length === 0 ? (
          <div className="text-xs text-gray-600 flex items-center justify-center p-3 border border-gray-800 border-dashed rounded bg-black/50">
            {UI_LABELS.roomPanel.noAgents}
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => onTalk(agent.id)}
              className="mb-2 p-2 border border-gray-800 rounded bg-gray-900/30 flex items-start gap-3 cursor-pointer hover:border-purple-500/50 transition-colors group"
            >
              <div className={`mt-1 ${agent.color}`}>
                <MessageSquare size={14} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-200 group-hover:text-purple-300 transition-colors">
                  {agent.id}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{agent.role}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Objects */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
          <Box size={12} /> {UI_LABELS.roomPanel.objectsInRoom(room.objects.length)}
        </div>
        {room.objects.length === 0 ? (
          <div className="text-xs text-gray-600 flex items-center justify-center p-3 border border-gray-800 border-dashed rounded bg-black/50">
            {UI_LABELS.roomPanel.noObjects}
          </div>
        ) : (
          room.objects.map((objId) => (
            <div
              key={objId}
              onClick={() => onInspect(objId)}
              className="mb-2 p-2 border border-gray-800 rounded bg-gray-900/30 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Database size={12} className="text-gray-500 group-hover:text-cyan-400" />
                <span className="text-xs text-gray-300 group-hover:text-cyan-300 font-bold">{objId}</span>
              </div>
              <ChevronRight size={12} className="text-gray-600 group-hover:text-cyan-400" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
