import { Router, type Request, type Response } from 'express';
import type { BridgeRequest } from '../types.js';
import { validateBridgeRequest } from '../utils/validateBridgeRequest.js';
import { handleTalkSuccess } from '../scenarios/talkSuccess.js';
import { handleRuntimeUnavailable } from '../scenarios/runtimeUnavailable.js';
import { handleForgeProposal } from '../scenarios/forgeProposal.js';
import { handleWorldQuery } from '../scenarios/worldQuery.js';

const router = Router();

router.post('/v1/agent/respond', (req: Request, res: Response) => {
  console.log('[stub] POST /v1/agent/respond', {
    headers: {
      'x-world-version': req.headers['x-world-version'],
      'x-request-id': req.headers['x-request-id'],
    },
    body: req.body,
  });

  const validation = validateBridgeRequest(req.body);
  if (!validation.valid) {
    const response = handleRuntimeUnavailable(validation.error!);
    return res.status(200).json(response);
  }

  const bridgeReq = req.body as BridgeRequest;

  switch (bridgeReq.interaction.mode) {
    case 'agent_dialogue':
      return res.json(handleTalkSuccess(bridgeReq));
    case 'forge_request':
      return res.json(handleForgeProposal(bridgeReq));
    case 'world_query':
      return res.json(handleWorldQuery(bridgeReq));
    default:
      return res.json(
        handleRuntimeUnavailable({
          code: 'UNSUPPORTED_MODE',
          message: `Unsupported interaction mode: ${(bridgeReq.interaction as { mode: string }).mode}`,
        })
      );
  }
});

export default router;
