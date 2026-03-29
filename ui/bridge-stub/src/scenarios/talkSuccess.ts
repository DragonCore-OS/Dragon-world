import type { BridgeRequest, BridgeResponse } from '../types.js';
import { buildResponse } from '../utils/buildResponse.js';

export function handleTalkSuccess(req: BridgeRequest): BridgeResponse {
  const agentName = req.interaction.targetAgentId || 'Agent';
  return buildResponse(
    'agent_reply',
    `${agentName} has received your message and is preparing a response.`,
    {
      memoryUpdates: [
        {
          scope: 'agent_notebook',
          owner: req.interaction.targetAgentId || 'unknown',
          summary: `User said: "${req.interaction.userMessage}"`,
          importance: 'medium',
        },
      ],
      toolTraceSummary: ['stub_talk_success'],
    }
  );
}
