import type { BridgeRequest, BridgeResponse } from '../types.js';
import { buildResponse } from '../utils/buildResponse.js';

export function handleWorldQuery(req: BridgeRequest): BridgeResponse {
  const room = req.world.currentRoom;
  const exits = req.world.visibleExits.join(', ') || 'none';
  const agents = req.world.visibleAgents.map((a) => a.id).join(', ') || 'none';

  return buildResponse(
    'query_result',
    `Current room is ${room.id} (${room.name}). Visible exits: ${exits}. Agents present: ${agents}.`,
    {
      toolTraceSummary: ['stub_world_query'],
    }
  );
}
