import { Box, Cpu } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import { WORLD_DATA } from '@/data/kernelMockData';
import { getMapGraph } from '@/adapters/kernelAdapter';
import type { RoomId } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';

interface Props {
  currentRoom: RoomId;
  theme: ThemeSpec;
  showAnnotations: boolean;
  onNavigate: (direction: string) => void;
}

export function MapPanel({ currentRoom, theme, showAnnotations, onNavigate }: Props) {
  const { nodes, edges } = getMapGraph();
  const annotation = getAnnotationClasses('kernel', showAnnotations);

  return (
    <div
      className={`h-full relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGMxMS4wNDYgMCAyMC04Ljk1NCAyMC0yMFMwIDExLjA0NiAwIDIwcS0xMS4wNDYgMC0yMCAyMnoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] rounded-lg border border-gray-800 overflow-hidden ${annotation}`}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ stroke: 'rgba(100,100,100,0.5)', strokeWidth: 2 }}
      >
        {edges.map((e: { from: RoomId; to: RoomId; dashed?: boolean }, idx: number) => (
          <line
            key={idx}
            x1={`${nodes[e.from].x}%`}
            y1={`${nodes[e.from].y}%`}
            x2={`${nodes[e.to].x}%`}
            y2={`${nodes[e.to].y}%`}
            strokeDasharray={e.dashed ? '4 4' : undefined}
          />
        ))}
      </svg>

      {Object.entries(nodes).map(([id, pos]: [string, { x: number; y: number }]) => {
        const roomId = id as RoomId;
        const isCurrent = currentRoom === roomId;
        const exitDir = (Object.keys(WORLD_DATA[currentRoom].exits) as Array<keyof typeof WORLD_DATA[typeof currentRoom]['exits']>).find(
          (k) => WORLD_DATA[currentRoom].exits[k] === roomId
        );
        const isAdjacent = !!exitDir;

        return (
          <div
            key={id}
            className={`absolute flex flex-col items-center justify-center ${
              isAdjacent ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default opacity-60'
            }`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => isAdjacent && exitDir && onNavigate(exitDir)}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                isCurrent
                  ? `${theme.border} ${theme.glow} ${theme.bgAccentLight}/80`
                  : 'border-gray-700 bg-gray-900'
              } z-10`}
            >
              {roomId === 'core_room' ? (
                <Cpu size={16} className={isCurrent ? theme.text : 'text-gray-500'} />
              ) : (
                <Box size={14} className={isCurrent ? theme.text : 'text-gray-500'} />
              )}
            </div>
            <div
              className={`mt-1 text-[9px] font-mono whitespace-nowrap px-1 bg-black/80 rounded ${
                isCurrent ? theme.text : 'text-gray-500'
              }`}
            >
              {roomId}
            </div>
          </div>
        );
      })}
    </div>
  );
}
