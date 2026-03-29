# DragonWorld Bridge Stub Server

Local stub server for validating the `ui/shell` frontend in `remote` bridge mode.

## What it does

- Provides `POST /v1/agent/respond` that returns strict `dw-bridge-v1` responses
- Provides `POST /v1/memory/panel` that returns strict `dw-memory-v1` responses
- Simulates E2E scenarios without requiring a real DeerFlow runtime
- Includes request validation to ensure the frontend sends well-formed requests

## Start

```bash
cd ui/bridge-stub
npm install
npm run dev
```

Server runs on `http://localhost:3002` (configurable via `PORT` env var).

## Endpoints

- `POST /v1/agent/respond` — main bridge endpoint
- `POST /v1/memory/panel` — memory panel endpoint
- `GET /health` — health check

## Agent Respond Scenarios

### A. Talk Success (`agent_dialogue`)
Valid request with `targetAgentId` → returns `responseType: agent_reply`

### B. Runtime Error (`invalid request`)
`agent_dialogue` without `targetAgentId` → returns `responseType: runtime_error`

### C. Forge Proposal Preview (`forge_request`)
Returns `responseType: forge_proposal` with a sample `patchProposals` array

### D. World Query (`world_query`)
Returns `responseType: query_result` with a room summary

## Memory Panel Scenarios

### 1. `agent_memory` + `huaxia_zhenlongce`
Returns secretary view with recent world changes and index summary.

```bash
curl -s -X POST http://localhost:3002/v1/memory/panel \
  -H "Content-Type: application/json" \
  -d '{
    "protocolVersion": "dw-memory-v1",
    "threadId": "t",
    "sessionId": "s",
    "roomId": "core_room",
    "agentId": "huaxia_zhenlongce",
    "mode": "agent_memory"
  }'
```

### 2. `room_memory` + `archive_hall`
Returns room artifact notes for `matrix_brain` and `archive_console`.

```bash
curl -s -X POST http://localhost:3002/v1/memory/panel \
  -H "Content-Type: application/json" \
  -d '{
    "protocolVersion": "dw-memory-v1",
    "threadId": "t",
    "sessionId": "s",
    "roomId": "archive_hall",
    "mode": "room_memory"
  }'
```

### 3. `world_memory`
Returns world summary and governance timeline.

```bash
curl -s -X POST http://localhost:3002/v1/memory/panel \
  -H "Content-Type: application/json" \
  -d '{
    "protocolVersion": "dw-memory-v1",
    "threadId": "t",
    "sessionId": "s",
    "roomId": "core_room",
    "mode": "world_memory"
  }'
```

### Error response example
Missing `protocolVersion`:

```json
{
  "protocolVersion": "dw-memory-v1",
  "header": "Memory Panel Error",
  "notice": "The memory panel request could not be processed.",
  "mode": "world_memory",
  "sections": [],
  "errors": [
    { "code": "INVALID_PROTOCOL", "message": "protocolVersion must be dw-memory-v1" }
  ]
}
```

## E2E with frontend

In `ui/shell`, run:

```bash
VITE_BRIDGE_MODE=remote npm run dev
```

The shell default `VITE_BRIDGE_BASE_URL` is already aligned to `http://localhost:3002`.

## Notes

- This stub does **not** perform real inference
- `patchProposals` are preview-only; no world mutation occurs
- CORS is enabled for the frontend origin
