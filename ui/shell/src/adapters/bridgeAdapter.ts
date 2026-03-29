import type { AgentId } from '@/types/world';

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

export interface BridgeResponse {
  responseType: 'agent_reply' | 'query_result' | 'forge_proposal' | 'runtime_error';
  reply: BridgeReply;
  memoryUpdates: BridgeMemoryUpdate[];
  errors: Array<{ code: string; message: string }>;
}

export interface BridgeStatus {
  connected: boolean;
  latencyMs: number | null;
}

// Phase 2: This is a mock adapter shell.
// When DeerFlow is integrated, only this file should change.
export async function sendAgentDialogue(
  _agentId: AgentId,
  message: string
): Promise<BridgeResponse> {
  // Simulate async bridge latency
  await new Promise((res) => setTimeout(res, 300));
  return {
    responseType: 'agent_reply',
    reply: {
      text: `[Bridge Pending] Regarding "${message}", I need to wait for the dialogue bridge.`,
      style: 'plain_text',
    },
    memoryUpdates: [],
    errors: [],
  };
}

export async function requestMemoryPanel(agentId?: AgentId): Promise<{
  header: string;
  notice: string;
  sampleTitle: string;
  sampleText: string;
  tags: string[];
}> {
  await new Promise((res) => setTimeout(res, 150));
  return {
    header: agentId ? `${agentId} View (Bridge)` : 'Secretary View (Bridge)',
    notice: 'This panel depends on AI Bridge generation. Currently showing default mock.',
    sampleTitle: 'Matrix Brain Status Record',
    sampleText:
      '"In the last 10 ticks, the pulse frequency of the Matrix Brain in the Archive Hall rose by 0.4%."',
    tags: ['matrix_brain', 'archive_hall'],
  };
}

export function getBridgeStatus(): BridgeStatus {
  return {
    connected: false,
    latencyMs: null,
  };
}
