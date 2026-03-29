import { Router, type Request, type Response } from 'express';
import type { BridgeMemoryPanelRequest } from '../types.js';
import { validateMemoryPanelRequest, buildErrorResponse } from '../utils/validateMemoryPanelRequest.js';
import { handleMemoryPanel } from '../scenarios/memoryPanel.js';

const router = Router();

router.post('/v1/memory/panel', (req: Request, res: Response) => {
  console.log('[stub] POST /v1/memory/panel', {
    headers: {
      'x-world-version': req.headers['x-world-version'],
      'x-request-id': req.headers['x-request-id'],
    },
    body: req.body,
  });

  const validation = validateMemoryPanelRequest(req.body);
  if (!validation.valid) {
    const response = buildErrorResponse(validation.error!, req.body?.mode);
    return res.status(200).json(response);
  }

  const memoryReq = req.body as BridgeMemoryPanelRequest;
  return res.json(handleMemoryPanel(memoryReq));
});

export default router;
