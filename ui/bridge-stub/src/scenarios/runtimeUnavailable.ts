import type { BridgeResponse } from '../types.js';
import { buildResponse } from '../utils/buildResponse.js';

export function handleRuntimeUnavailable(error: { code: string; message: string }): BridgeResponse {
  return buildResponse('runtime_error', '', {
    toolTraceSummary: ['stub_validation_failed'],
    errors: [error],
  });
}
