import type { BridgeMemoryPanelRequest, BridgeMemoryPanelResponse } from '../types.js';

export interface MemoryValidationResult {
  valid: boolean;
  error?: { code: string; message: string };
}

export function validateMemoryPanelRequest(req: unknown): MemoryValidationResult {
  const body = req as Partial<BridgeMemoryPanelRequest>;

  if (body.protocolVersion !== 'dw-memory-v1') {
    return {
      valid: false,
      error: { code: 'INVALID_PROTOCOL', message: 'protocolVersion must be dw-memory-v1' },
    };
  }

  if (!body.threadId || typeof body.threadId !== 'string') {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing threadId' },
    };
  }

  if (!body.sessionId || typeof body.sessionId !== 'string') {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing sessionId' },
    };
  }

  if (!body.roomId || typeof body.roomId !== 'string') {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing roomId' },
    };
  }

  const validModes: Array<BridgeMemoryPanelRequest['mode']> = ['room_memory', 'agent_memory', 'world_memory'];
  if (!body.mode || !validModes.includes(body.mode)) {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing or invalid mode' },
    };
  }

  return { valid: true };
}

export function buildErrorResponse(
  error: { code: string; message: string },
  mode: BridgeMemoryPanelRequest['mode'] = 'world_memory'
): BridgeMemoryPanelResponse {
  return {
    protocolVersion: 'dw-memory-v1',
    header: 'Memory Panel Error',
    notice: 'The memory panel request could not be processed.',
    mode,
    sections: [],
    errors: [error],
  };
}
