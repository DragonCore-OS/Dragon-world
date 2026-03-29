import type { BridgeRequest, BridgeResponse } from '../types.js';
import { buildResponse } from '../utils/buildResponse.js';

export function handleForgeProposal(req: BridgeRequest): BridgeResponse {
  return buildResponse(
    'forge_proposal',
    'A proposal has been prepared for review. It will not be applied until governance approves.',
    {
      patchProposals: [
        {
          proposalId: 'patch-stub-001',
          kind: 'create_room',
          summary: 'Add a new room to the south of core_room',
          manifestStub: {
            roomId: 'new_room_stub',
            parentRoom: req.world.currentRoom.id,
            direction: 'south',
          },
          requiredGovernance: true,
          reasoning: 'Stub proposal for UI preview only.',
        },
      ],
      toolTraceSummary: ['stub_forge_preview'],
    }
  );
}
