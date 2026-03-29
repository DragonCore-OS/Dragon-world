import type { AgentId, RoomId } from './world';

export type BridgeMode = 'mock' | 'disabled' | 'remote';

export type BridgeInteractionMode = 'agent_dialogue' | 'world_query' | 'forge_request';

export type BridgeResponseType =
  | 'agent_reply'
  | 'query_result'
  | 'forge_proposal'
  | 'runtime_error';

export interface BridgePlayer {
  id: string;
  displayName: string;
}

export interface BridgeVisibleAgent {
  id: AgentId;
  name: string;
  title: string;
  role: string;
}

export interface BridgeVisibleObject {
  id: string;
  name: string;
  objectType: string;
  status: string;
}

export interface BridgeCurrentRoom {
  id: RoomId;
  name: string;
  description: string;
}

export interface BridgeWorldContext {
  version: string;
  currentRoom: BridgeCurrentRoom;
  visibleExits: string[];
  visibleAgents: BridgeVisibleAgent[];
  visibleObjects: BridgeVisibleObject[];
}

export interface BridgeInteraction {
  mode: BridgeInteractionMode;
  targetAgentId?: AgentId;
  userMessage: string;
}

export interface BridgeMemoryHints {
  enabled: boolean;
  topNotes: string[];
}

export interface BridgePolicy {
  allowWorldPatchProposal: boolean;
  allowDirectWorldMutation: boolean;
  allowFileGeneration: boolean;
}

export interface BridgeRequest {
  protocolVersion: 'dw-bridge-v1';
  threadId: string;
  sessionId: string;
  player: BridgePlayer;
  world: BridgeWorldContext;
  interaction: BridgeInteraction;
  memoryHints?: BridgeMemoryHints;
  policy?: BridgePolicy;
}

export interface BridgeReply {
  text: string;
  style?: string;
}

export interface BridgeMemoryUpdate {
  scope: string;
  owner: string;
  summary: string;
  importance: 'low' | 'medium' | 'high';
}

export interface BridgePatchProposal {
  proposalId: string;
  kind:
    | 'create_room'
    | 'create_agent'
    | 'create_object'
    | 'object_state_change'
    | 'agent_memory_update'
    | 'governance_proposal';
  summary: string;
  manifestStub: Record<string, unknown>;
  requiredGovernance: boolean;
  reasoning?: string;
}

export interface BridgeError {
  code: string;
  message: string;
}

export interface BridgeResponse {
  protocolVersion: 'dw-bridge-v1';
  responseType: BridgeResponseType;
  reply: BridgeReply;
  memoryUpdates: BridgeMemoryUpdate[];
  patchProposals: BridgePatchProposal[];
  toolTraceSummary: string[];
  errors: BridgeError[];
}

export interface BridgeStatus {
  mode: BridgeMode;
  connected: boolean;
  latencyMs: number | null;
  lastError: string | null;
}

// Memory Panel types (dw-memory-v1)
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
  roomId: RoomId;
  agentId?: AgentId;
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

// Proposal display types (mock-only, read-only)
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface ProposalImpact {
  scope: 'room' | 'agent' | 'object' | 'governance' | 'memory';
  targetId?: string;
  description: string;
}

export interface ProposalPreview {
  id: string;
  status: ProposalStatus;
  statusLabel: string;
  title: string;
  description: string;
  prId: string;
  impacts: ProposalImpact[];
}
