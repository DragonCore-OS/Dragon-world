import type { BridgeRequest } from '../types.js';

export interface ValidationResult {
  valid: boolean;
  error?: { code: string; message: string };
}

export function validateBridgeRequest(req: unknown): ValidationResult {
  const body = req as Partial<BridgeRequest>;

  if (body.protocolVersion !== 'dw-bridge-v1') {
    return {
      valid: false,
      error: { code: 'INVALID_PROTOCOL', message: 'protocolVersion must be dw-bridge-v1' },
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

  if (!body.world?.currentRoom?.id) {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing world.currentRoom.id' },
    };
  }

  if (!body.interaction?.mode) {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing interaction.mode' },
    };
  }

  if (!body.interaction.userMessage || typeof body.interaction.userMessage !== 'string') {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing interaction.userMessage' },
    };
  }

  if (body.interaction.mode === 'agent_dialogue' && !body.interaction.targetAgentId) {
    return {
      valid: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing interaction.targetAgentId for agent_dialogue' },
    };
  }

  return { valid: true };
}
