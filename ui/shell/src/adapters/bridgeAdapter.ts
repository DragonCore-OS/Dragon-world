import type {
  AgentId,
  RoomId,
  AgentData,
} from '@/types/world';
import type {
  BridgeRequest,
  BridgeResponse,
  BridgeStatus,
  BridgeMode,
  BridgeWorldContext,
  BridgeVisibleAgent,
  BridgeVisibleObject,
  BridgeMemoryPanelRequest,
  BridgeMemoryPanelResponse,
  MemoryPanelMode,
} from '@/types/bridge';
import { AGENTS, WORLD_DATA } from '@/data/kernelMockData';

const BRIDGE_MODE: BridgeMode =
  (import.meta.env.VITE_BRIDGE_MODE as BridgeMode) || 'mock';

const BRIDGE_BASE_URL =
  (import.meta.env.VITE_BRIDGE_BASE_URL as string) || 'http://localhost:3002';

let lastLatencyMs: number | null = null;
let lastError: string | null = null;
let connected = false;

function nowMs(): number {
  return performance.now();
}

export function getBridgeStatus(): BridgeStatus {
  return {
    mode: BRIDGE_MODE,
    connected,
    latencyMs: lastLatencyMs,
    lastError,
  };
}

function buildBridgeWorldContext(roomId: RoomId): BridgeWorldContext {
  const room = WORLD_DATA[roomId];
  const visibleAgents: BridgeVisibleAgent[] = room.agents.map((id) => {
    const a: AgentData = AGENTS[id];
    return {
      id,
      name: a.name,
      title: a.title,
      role: a.role,
    };
  });

  const visibleObjects: BridgeVisibleObject[] = room.objects.map((id) => ({
    id,
    name: id,
    objectType: 'artifact',
    status: 'stable',
  }));

  return {
    version: '0.1.0',
    currentRoom: {
      id: room.id,
      name: room.name,
      description: room.desc,
    },
    visibleExits: Object.keys(room.exits),
    visibleAgents,
    visibleObjects,
  };
}

export function buildBridgeRequest(
  roomId: RoomId,
  agentId: AgentId | null,
  message: string
): BridgeRequest {
  return {
    protocolVersion: 'dw-bridge-v1',
    threadId: 'thread-001',
    sessionId: 'session-001',
    player: {
      id: 'creator',
      displayName: 'Creator',
    },
    world: buildBridgeWorldContext(roomId),
    interaction: {
      mode: agentId ? 'agent_dialogue' : 'world_query',
      targetAgentId: agentId || undefined,
      userMessage: message,
    },
    memoryHints: {
      enabled: true,
      topNotes: ['User is building DragonWorld.', 'Bridge v1 is active.'],
    },
    policy: {
      allowWorldPatchProposal: true,
      allowDirectWorldMutation: false,
      allowFileGeneration: false,
    },
  };
}

async function sendRemoteBridgeRequest(
  req: BridgeRequest
): Promise<BridgeResponse> {
  const start = nowMs();
  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/v1/agent/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-World-Version': req.world.version,
        'X-Request-ID': req.sessionId,
      },
      body: JSON.stringify(req),
    });
    lastLatencyMs = Math.round(nowMs() - start);

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = (await res.json()) as BridgeResponse;
    connected = true;
    lastError = null;
    return data;
  } catch (err) {
    lastLatencyMs = Math.round(nowMs() - start);
    connected = false;
    const msg = err instanceof Error ? err.message : String(err);
    lastError = msg;
    return {
      protocolVersion: 'dw-bridge-v1',
      responseType: 'runtime_error',
      reply: { text: '', style: 'plain_text' },
      memoryUpdates: [],
      patchProposals: [],
      toolTraceSummary: ['remote_bridge_request_failed'],
      errors: [{ code: 'REMOTE_UNAVAILABLE', message: msg }],
    };
  }
}

async function sendMockBridgeRequest(
  req: BridgeRequest
): Promise<BridgeResponse> {
  const start = nowMs();
  await new Promise((res) => setTimeout(res, 300));
  lastLatencyMs = Math.round(nowMs() - start);
  connected = false;
  lastError = null;

  const agentName = req.interaction.targetAgentId
    ? AGENTS[req.interaction.targetAgentId]?.name || req.interaction.targetAgentId
    : 'Agent';

  return {
    protocolVersion: 'dw-bridge-v1',
    responseType: 'agent_reply',
    reply: {
      text: `[Bridge Pending] ${agentName} received: "${req.interaction.userMessage}"`,
      style: 'plain_text',
    },
    memoryUpdates: [],
    patchProposals: [],
    toolTraceSummary: ['mock_bridge_response_generated'],
    errors: [],
  };
}

function sendDisabledBridgeRequest(): BridgeResponse {
  lastLatencyMs = null;
  connected = false;
  lastError = 'Bridge is disabled';
  return {
    protocolVersion: 'dw-bridge-v1',
    responseType: 'runtime_error',
    reply: { text: '', style: 'plain_text' },
    memoryUpdates: [],
    patchProposals: [],
    toolTraceSummary: ['bridge_disabled'],
    errors: [{ code: 'BRIDGE_DISABLED', message: 'Bridge mode is set to disabled.' }],
  };
}

export async function sendBridgeRequest(
  req: BridgeRequest
): Promise<BridgeResponse> {
  if (BRIDGE_MODE === 'disabled') {
    return sendDisabledBridgeRequest();
  }
  if (BRIDGE_MODE === 'remote') {
    return sendRemoteBridgeRequest(req);
  }
  return sendMockBridgeRequest(req);
}

export async function sendAgentDialogue(
  roomId: RoomId,
  agentId: AgentId,
  message: string
): Promise<BridgeResponse> {
  const req = buildBridgeRequest(roomId, agentId, message);
  return sendBridgeRequest(req);
}

function buildMemoryPanelRequest(
  roomId: RoomId,
  agentId?: AgentId
): BridgeMemoryPanelRequest {
  const mode: MemoryPanelMode = agentId ? 'agent_memory' : 'room_memory';
  return {
    protocolVersion: 'dw-memory-v1',
    threadId: 'thread-001',
    sessionId: 'session-001',
    roomId,
    agentId,
    mode,
  };
}

async function sendRemoteMemoryPanelRequest(
  req: BridgeMemoryPanelRequest
): Promise<BridgeMemoryPanelResponse> {
  const start = nowMs();
  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/v1/memory/panel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.sessionId,
      },
      body: JSON.stringify(req),
    });
    lastLatencyMs = Math.round(nowMs() - start);

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = (await res.json()) as BridgeMemoryPanelResponse;
    connected = true;
    lastError = null;
    return data;
  } catch (err) {
    lastLatencyMs = Math.round(nowMs() - start);
    connected = false;
    const msg = err instanceof Error ? err.message : String(err);
    lastError = msg;
    return {
      protocolVersion: 'dw-memory-v1',
      header: 'Memory Panel Error',
      notice: `Remote request failed: ${msg}`,
      mode: req.mode,
      sections: [],
      errors: [{ code: 'REMOTE_UNAVAILABLE', message: msg }],
    };
  }
}

async function sendMockMemoryPanelRequest(
  _req: BridgeMemoryPanelRequest
): Promise<BridgeMemoryPanelResponse> {
  const start = nowMs();
  await new Promise((res) => setTimeout(res, 150));
  lastLatencyMs = Math.round(nowMs() - start);
  connected = false;
  lastError = null;

  return {
    protocolVersion: 'dw-memory-v1',
    header: 'Secretary View (Bridge)',
    notice: 'This panel depends on AI Bridge generation. Currently showing default mock.',
    mode: _req.mode,
    sections: [
      {
        id: 'mock-section',
        title: 'Matrix Brain Status Record',
        notes: [
          {
            id: 'mock-note-001',
            title: 'Matrix Brain Status Record',
            text: '"In the last 10 ticks, the pulse frequency of the Matrix Brain in the Archive Hall rose by 0.4%."',
            importance: 'medium',
            tags: [
              { label: 'matrix_brain', kind: 'object' },
              { label: 'archive_hall', kind: 'room' },
            ],
            source: { type: 'bridge_stub' },
          },
        ],
      },
    ],
    errors: [],
  };
}

function sendDisabledMemoryPanelRequest(
  agentId?: AgentId
): BridgeMemoryPanelResponse {
  lastLatencyMs = null;
  connected = false;
  lastError = 'Bridge is disabled';
  return {
    protocolVersion: 'dw-memory-v1',
    header: agentId ? `${agentId} View (Bridge)` : 'Secretary View (Bridge)',
    notice: 'Bridge is disabled. Memory panel cannot be loaded.',
    mode: 'agent_memory',
    sections: [],
    errors: [{ code: 'BRIDGE_DISABLED', message: 'Bridge mode is set to disabled.' }],
  };
}

export async function requestMemoryPanel(
  roomId: RoomId,
  agentId?: AgentId
): Promise<BridgeMemoryPanelResponse> {
  const req = buildMemoryPanelRequest(roomId, agentId);

  if (BRIDGE_MODE === 'disabled') {
    return sendDisabledMemoryPanelRequest(agentId);
  }

  if (BRIDGE_MODE === 'remote') {
    return sendRemoteMemoryPanelRequest(req);
  }

  return sendMockMemoryPanelRequest(req);
}
