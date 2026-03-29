import { WORLD_DATA, AGENTS, COMMANDS, MAP_NODES, MAP_EDGES } from '@/data/kernelMockData';
import { OBJECT_DISPLAY_COPY } from '@/data/localizedDisplayCopy';
import type { RoomId, AgentId, ObjectId, RoomData, AgentData, Direction } from '@/types/world';

const KERNEL_MODE = (import.meta.env.VITE_KERNEL_MODE as 'mock' | 'remote') || 'mock';
const KERNEL_BASE_URL = (import.meta.env.VITE_KERNEL_BASE_URL as string) || 'http://localhost:4001';

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

// Remote API types
interface RemoteKernelState {
  version: string;
  currentRoom: RoomId;
  room: RoomData;
  visibleAgents: Array<{ id: string; name: string; title: string; role: string }>;
  visibleObjects: Array<{ id: string; name: string; objectType: string; status: string }>;
  visibleExits: string[];
  totalRooms: number;
  totalAgents: number;
  totalObjects: number;
}

interface RemoteCommandResponse {
  success: boolean;
  type: KernelCommandResult['type'];
  message: string;
  title?: string;
  currentRoom: RoomId;
  visibleAgents: Array<{ id: string; name: string; title: string; role: string }>;
  visibleObjects: Array<{ id: string; name: string; objectType: string; status: string }>;
  visibleExits: string[];
  status: KernelStatus;
}

interface RemoteMapGraph {
  nodes: Record<RoomId, { x: number; y: number }>;
  edges: Array<{ from: RoomId; to: RoomId; dashed?: boolean }>;
}

// Helper to merge remote agent with local UI data (colors)
function mergeAgentData(remoteAgent: { id: string; name: string; title: string; role: string }): AgentData {
  const local = AGENTS[remoteAgent.id as AgentId];
  return {
    id: remoteAgent.id as AgentId,
    name: remoteAgent.name,
    title: remoteAgent.title,
    role: remoteAgent.role,
    color: local?.color ?? 'text-gray-400',
  };
}

export async function getCurrentRoom(roomId: RoomId): Promise<RoomData> {
  if (KERNEL_MODE === 'mock') {
    return WORLD_DATA[roomId];
  }
  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/state?room=${roomId}`);
  if (!res.ok) throw new Error(`Failed to fetch room: ${res.status}`);
  const data: RemoteKernelState = await res.json();
  return data.room;
}

export async function getVisibleAgents(roomId: RoomId): Promise<AgentData[]> {
  if (KERNEL_MODE === 'mock') {
    return WORLD_DATA[roomId].agents.map((id) => AGENTS[id]);
  }
  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/state?room=${roomId}`);
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  const data: RemoteKernelState = await res.json();
  return data.visibleAgents.map(mergeAgentData);
}

export async function getVisibleObjects(roomId: RoomId): Promise<ObjectId[]> {
  if (KERNEL_MODE === 'mock') {
    return WORLD_DATA[roomId].objects;
  }
  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/state?room=${roomId}`);
  if (!res.ok) throw new Error(`Failed to fetch objects: ${res.status}`);
  const data: RemoteKernelState = await res.json();
  return data.visibleObjects.map((o) => o.id as ObjectId);
}

export async function getObjectDisplayCopy(objectId: ObjectId): Promise<string> {
  // UI display copy is local-only, not kernel truth
  return OBJECT_DISPLAY_COPY[objectId]?.desc ?? '';
}

export async function getAgentData(agentId: AgentId): Promise<AgentData> {
  if (KERNEL_MODE === 'mock') {
    return AGENTS[agentId];
  }
  // For remote mode, fetch state and find agent
  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  const status = await res.json();
  const stateRes = await fetch(`${KERNEL_BASE_URL}/v1/kernel/state?room=${status.currentRoom}`);
  if (!stateRes.ok) throw new Error(`Failed to fetch state: ${stateRes.status}`);
  const data: RemoteKernelState = await stateRes.json();
  const agent = data.visibleAgents.find((a) => a.id === agentId);
  if (!agent) throw new Error(`Agent not found: ${agentId}`);
  return mergeAgentData(agent);
}

export async function getStatus(roomId: RoomId): Promise<KernelStatus> {
  if (KERNEL_MODE === 'mock') {
    return {
      currentRoom: roomId,
      totalRooms: Object.keys(WORLD_DATA).length,
      totalAgents: Object.keys(AGENTS).length,
      totalObjects: Object.keys(OBJECT_DISPLAY_COPY).length,
      exits: Object.keys(WORLD_DATA[roomId].exits),
    };
  }
  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  const data: KernelStatus = await res.json();
  return data;
}

export async function getMapGraph(): Promise<{ nodes: Record<RoomId, { x: number; y: number }>; edges: Array<{ from: RoomId; to: RoomId; dashed?: boolean }> }> {
  if (KERNEL_MODE === 'mock') {
    return {
      nodes: MAP_NODES,
      edges: MAP_EDGES,
    };
  }
  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/map`);
  if (!res.ok) throw new Error(`Failed to fetch map: ${res.status}`);
  const data: RemoteMapGraph = await res.json();
  return data;
}

export async function getAdjacentRoomId(roomId: RoomId, direction: Direction): Promise<RoomId | undefined> {
  if (KERNEL_MODE === 'mock') {
    return WORLD_DATA[roomId].exits[direction];
  }
  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/state?room=${roomId}`);
  if (!res.ok) throw new Error(`Failed to fetch room: ${res.status}`);
  const data: RemoteKernelState = await res.json();
  return data.room.exits[direction] as RoomId | undefined;
}

export async function isValidCommand(cmd: string): Promise<boolean> {
  // Command validation is local-only (static parser list)
  const head = cmd.trim().toLowerCase().split(/\s+/)[0];
  return COMMANDS.includes(head);
}

export async function executeKernelCommand(
  roomId: RoomId,
  cmd: string
): Promise<KernelCommandResult> {
  if (KERNEL_MODE === 'mock') {
    return executeMockCommand(roomId, cmd);
  }

  const res = await fetch(`${KERNEL_BASE_URL}/v1/kernel/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: cmd }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    return {
      success: false,
      type: 'error',
      message: `HTTP ${res.status}: ${text}`,
    };
  }
  const data: RemoteCommandResponse = await res.json();
  return {
    success: data.success,
    type: data.type,
    message: data.message,
    title: data.title,
    newRoom: data.currentRoom !== roomId ? data.currentRoom : undefined,
    targetAgent: data.type === 'talk' ? cmd.trim().substring(5).trim() as AgentId : undefined,
  };
}

function executeMockCommand(
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
