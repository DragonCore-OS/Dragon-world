import { WORLD_DATA, AGENTS, COMMANDS, MAP_NODES, MAP_EDGES } from '@/data/kernelMockData';
import { OBJECT_DISPLAY_COPY } from '@/data/localizedDisplayCopy';
import type { RoomId, AgentId, ObjectId, RoomData, AgentData, Direction } from '@/types/world';

export interface KernelStatus {
  currentRoom: RoomId;
  totalRooms: number;
  totalAgents: number;
  totalObjects: number;
  exits: string[];
}

export interface KernelCommandResult {
  success: boolean;
  type: 'move' | 'look' | 'talk' | 'inspect' | 'status' | 'help' | 'exit' | 'error';
  message: string;
  title?: string;
  newRoom?: RoomId;
  targetAgent?: AgentId;
}

export function getCurrentRoom(roomId: RoomId): RoomData {
  return WORLD_DATA[roomId];
}

export function getVisibleAgents(roomId: RoomId): AgentData[] {
  return WORLD_DATA[roomId].agents.map((id) => AGENTS[id]);
}

export function getVisibleObjects(roomId: RoomId): ObjectId[] {
  return WORLD_DATA[roomId].objects;
}

export function getObjectDisplayCopy(objectId: ObjectId): string {
  return OBJECT_DISPLAY_COPY[objectId]?.desc ?? '';
}

export function getAgentData(agentId: AgentId): AgentData {
  return AGENTS[agentId];
}

export function getStatus(roomId: RoomId): KernelStatus {
  return {
    currentRoom: roomId,
    totalRooms: Object.keys(WORLD_DATA).length,
    totalAgents: Object.keys(AGENTS).length,
    totalObjects: Object.keys(OBJECT_DISPLAY_COPY).length,
    exits: Object.keys(WORLD_DATA[roomId].exits),
  };
}

export function getMapGraph() {
  return {
    nodes: MAP_NODES,
    edges: MAP_EDGES,
  };
}

export function getAdjacentRoomId(roomId: RoomId, direction: Direction): RoomId | undefined {
  return WORLD_DATA[roomId].exits[direction];
}

export function isValidCommand(cmd: string): boolean {
  const head = cmd.trim().toLowerCase().split(/\s+/)[0];
  return COMMANDS.includes(head);
}

export function executeKernelCommand(
  roomId: RoomId,
  cmd: string
): KernelCommandResult {
  const trimmed = cmd.trim();
  const lower = trimmed.toLowerCase();
  const head = lower.split(/\s+/)[0];

  const room = WORLD_DATA[roomId];

  const tryMove = (dir: Direction): KernelCommandResult => {
    const next = room.exits[dir];
    if (next) {
      return {
        success: true,
        type: 'move',
        message: WORLD_DATA[next].desc,
        title: `Go ${dir.toUpperCase()} -> [${WORLD_DATA[next].name}]`,
        newRoom: next,
      };
    }
    return {
      success: false,
      type: 'error',
      message: `Cannot go ${dir}: no exit in that direction.`,
    };
  };

  switch (head) {
    case '/look':
      return {
        success: true,
        type: 'look',
        message: room.desc,
        title: `Observe [${room.name}]`,
      };
    case '/north':
      return tryMove('north');
    case '/south':
      return tryMove('south');
    case '/east':
      return tryMove('east');
    case '/west':
      return tryMove('west');
    case '/go': {
      const dir = trimmed.substring(3).trim().toLowerCase() as Direction;
      if (dir) return tryMove(dir);
      return { success: false, type: 'error', message: 'Syntax error: /go <direction>' };
    }
    case '/talk': {
      const targetAgent = trimmed.substring(5).trim() as AgentId;
      if (!targetAgent) {
        return { success: false, type: 'error', message: 'Syntax error: /talk <agent_id>' };
      }
      if (room.agents.includes(targetAgent)) {
        return {
          success: true,
          type: 'talk',
          message: `Hello, I am ${AGENTS[targetAgent].name}. How can I help?`,
          targetAgent,
        };
      }
      return { success: false, type: 'error', message: `Agent not found in this room: ${targetAgent}` };
    }
    case '/inspect': {
      const targetObj = trimmed.substring(8).trim() as ObjectId;
      if (!targetObj) {
        return { success: false, type: 'error', message: 'Syntax error: /inspect <object_id>' };
      }
      if (room.objects.includes(targetObj)) {
        return {
          success: true,
          type: 'inspect',
          message: OBJECT_DISPLAY_COPY[targetObj]?.desc ?? '',
          title: `Inspect object: ${targetObj}`,
        };
      }
      return { success: false, type: 'error', message: `Object not found in this room: ${targetObj}` };
    }
    case '/status':
      return {
        success: true,
        type: 'status',
        message: `CURRENT NODE: ${room.id} | EXITS: ${Object.keys(room.exits).join(', ')}`,
      };
    case '/help':
      return {
        success: true,
        type: 'help',
        message: `Supported kernel commands: ${COMMANDS.join(', ')}`,
      };
    case 'exit':
    case 'quit':
      return {
        success: true,
        type: 'exit',
        message: 'Disconnecting from DragonWorld OS...',
      };
    default:
      return {
        success: false,
        type: 'error',
        message: `Unknown command: ${head}. Type /help for supported kernel commands.`,
      };
  }
}
