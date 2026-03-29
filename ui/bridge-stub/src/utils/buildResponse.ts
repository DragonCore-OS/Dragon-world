import type { BridgeResponse } from '../types.js';

export function buildResponse(
  responseType: BridgeResponse['responseType'],
  replyText: string,
  overrides: Partial<BridgeResponse> = {}
): BridgeResponse {
  return {
    protocolVersion: 'dw-bridge-v1',
    responseType,
    reply: { text: replyText, style: 'plain_text' },
    memoryUpdates: [],
    patchProposals: [],
    toolTraceSummary: [],
    errors: [],
    ...overrides,
  };
}
