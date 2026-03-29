export interface BridgeRequest {
  protocolVersion: string;
  threadId: string;
  sessionId: string;
  player: { id: string; displayName: string };
  world: {
    version: string;
    currentRoom: { id: string; name: string; description: string };
    visibleExits: string[];
    visibleAgents: Array<{ id: string; name: string; title: string; role: string }>;
    visibleObjects: Array<{ id: string; name: string; objectType: string; status: string }>;
  };
  interaction: {
    mode: 'agent_dialogue' | 'world_query' | 'forge_request';
    targetAgentId?: string;
    userMessage: string;
  };
  memoryHints?: { enabled: boolean; topNotes: string[] };
  policy?: {
    allowWorldPatchProposal: boolean;
    allowDirectWorldMutation: boolean;
    allowFileGeneration: boolean;
  };
}

export interface BridgeResponse {
  protocolVersion: 'dw-bridge-v1';
  responseType: 'agent_reply' | 'query_result' | 'forge_proposal' | 'runtime_error';
  reply: { text: string; style?: string };
  memoryUpdates: Array<{
    scope: string;
    owner: string;
    summary: string;
    importance: 'low' | 'medium' | 'high';
  }>;
  patchProposals: Array<{
    proposalId: string;
    kind: string;
    summary: string;
    manifestStub: Record<string, unknown>;
    requiredGovernance: boolean;
    reasoning?: string;
  }>;
  toolTraceSummary: string[];
  errors: Array<{ code: string; message: string }>;
}

export type MemoryPanelMode = 'room_memory' | 'agent_memory' | 'world_memory';

export interface MemoryPanelTag {
  label: string;
  kind: 'agent' | 'object' | 'room' | 'memory' | 'governance';
}

export interface MemoryPanelSource {
  type: 'bridge_stub' | 'deerflow' | 'ledger' | 'agent_notebook';
  ref?: string;
}

export interface MemoryPanelNote {
  id: string;
  title: string;
  text: string;
  importance: 'low' | 'medium' | 'high';
  tags: MemoryPanelTag[];
  source: MemoryPanelSource;
}

export interface MemoryPanelSection {
  id: string;
  title: string;
  notes: MemoryPanelNote[];
}

export interface BridgeMemoryPanelRequest {
  protocolVersion: 'dw-memory-v1';
  threadId: string;
  sessionId: string;
  roomId: string;
  agentId?: string;
  mode: MemoryPanelMode;
}

export interface BridgeMemoryPanelResponse {
  protocolVersion: 'dw-memory-v1';
  header: string;
  notice?: string;
  mode: MemoryPanelMode;
  sections: MemoryPanelSection[];
  errors: Array<{ code: string; message: string }>;
}
