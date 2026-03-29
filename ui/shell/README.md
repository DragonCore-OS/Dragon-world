# DragonWorld Frontend Shell v2.3

This is the **bridge-ready frontend engineering shell** for DragonWorld. It is a React + Vite + TypeScript application that provides a visual interface to the deterministic world kernel, with clear boundaries for future DeerFlow bridge integration.

## What this shell is

- A **three-column UI** (Entity/Map | Visual+Terminal | Status/Memory/Forge)
- A **local mock client** that simulates kernel commands and future bridge interactions
- An **engineering baseline** with frozen `dw-bridge-v1` types and a three-mode bridge adapter

## Relationship to `dragon-world` kernel

This shell does **not** modify the Rust kernel. It supports two modes:

### Mock mode (default)
Reads from a frozen mock dataset (`src/data/kernelMockData.ts`) that is strictly aligned with the seed world in the main repo:
- 6 rooms
- 5 agents
- 6 objects

### Remote-kernel mode
Connects to the Rust kernel HTTP service (`apps/server`) for true world state:
```bash
VITE_KERNEL_MODE=remote npm run dev
```

The kernel service loads the actual `world/` seed files and maintains the authoritative `WorldState`.

## Truth layers

### `kernel-backed` (green)
These areas reflect deterministic kernel truth and work in both `mock` and `remote` kernel modes:
- **RoomPanel** — room name, description, exits, agents, objects (from kernel service in remote mode)
- **MapPanel** — 6-room topology graph, strict adjacency navigation (from kernel service in remote mode)
- **CommandBar** — command parser aligned with `crates/command-parser`
- **LogPanel** — world logs (`/look`, `/go`, `/inspect`) (from kernel service in remote mode)
- **StatusPanel** — room/agent counts (from kernel service in remote mode)
- **Events timeline** — kernel event history

### `bridge-backed` (blue)
These areas require the future DeerFlow bridge to generate real responses:
- **Talk mode / VisualArea** — agent dialogue UI
- **AI logs** — responses after `/talk <agent>`
- **MemoryPanel** — agent notebook and memory summaries
- **Bridge status observability** — latency, mode, last error

### `mock-only` (orange)
These areas are conceptual UI placeholders. They do **not** modify the world:
- **ForgePanel** — proposal preview cards
- Approve/Reject buttons are disabled
- No YAML is written, no patch is applied

## Local development

```bash
cd ui/shell
npm install
npm run dev
```

The dev server will start (default Vite port `5173`). Open the URL in your browser.

## Project structure

```
ui/shell/
  src/
    components/          # React UI components
    data/
      kernelMockData.ts  # Kernel-aligned world data
      localizedDisplayCopy.ts  # UI labels and object descriptions
      truthLayers.ts     # Annotation system
    adapters/
      kernelAdapter.ts   # Local mock of kernel API
      bridgeAdapter.ts   # Three-mode bridge adapter (mock/disabled/remote)
      mockAdapter.ts     # Forge/mock sample data
    hooks/
      useShellState.ts   # Central shell state + command dispatch
    types/
      world.ts           # Domain types
      ui.ts              # Theme and truth-layer types
      bridge.ts          # Frozen dw-bridge-v1 types
    App.tsx
    main.tsx
  protocol_examples/     # JSON samples for DeerFlow alignment
```

## Bridge Readiness

### Frozen types: `dw-bridge-v1`
All bridge communication shapes are frozen in `src/types/bridge.ts`:

- `BridgeRequest` — what the shell sends to DeerFlow
- `BridgeResponse` — what DeerFlow must return
- `BridgeReply`, `BridgeMemoryUpdate`, `BridgePatchProposal`, `BridgeError`
- `ProposalPreview`, `ProposalImpact`, `ProposalStatus` — for mock-only Forge UI

### Three-mode bridge adapter
`src/adapters/bridgeAdapter.ts` supports three runtime modes, controlled by environment variables:

| Mode | Env var | Behavior |
|------|---------|----------|
| `mock` | `VITE_BRIDGE_MODE=mock` | Returns local mock responses with simulated latency |
| `disabled` | `VITE_BRIDGE_MODE=disabled` | Returns `BRIDGE_DISABLED` error immediately |
| `remote` | `VITE_BRIDGE_MODE=remote` | Sends `fetch` to `VITE_BRIDGE_BASE_URL/v1/agent/respond` |

Example:
```bash
VITE_BRIDGE_MODE=remote VITE_BRIDGE_BASE_URL=http://localhost:3002 npm run dev
```

### UI blocks that are already bridge-ready
- **Command `/talk <agent>`** — kernel gate checks room membership, then bridge stage sends `BridgeRequest`
- **Talk mode free-text input** — automatically routed to `sendAgentDialogue`
- **Bridge status badge** — visible in TopBar and StatusPanel (mode, latency, last error)
- **MemoryPanel** — consumes `requestMemoryPanel()` from `bridgeAdapter`. In `remote` mode it calls `POST /v1/memory/panel` and renders structured `sections`, `notes`, and `tags`.

### Local Kernel Service (Phase 2.6)
A Rust HTTP kernel service is available at `apps/server/` to provide the true world state instead of `kernelMockData.ts`.

**Kernel server**
```bash
cd apps/server
cargo run   # runs on http://localhost:4001
```

**Frontend in remote-kernel mode**
```bash
cd ui/shell
VITE_KERNEL_MODE=remote npm run dev   # default kernel URL is http://localhost:4001
```

**Supported endpoints**
- `GET /health` — health check
- `GET /v1/kernel/state` — current room state (agents, objects, exits)
- `POST /v1/kernel/command` — execute kernel commands (`/look`, `/go`, `/talk`, `/inspect`)
- `GET /v1/kernel/map` — map topology (nodes and edges)
- `GET /v1/kernel/status` — world status (room counts, version)

### Local Bridge Stub E2E (Phase 2.4 + 2.5)
A local Bridge Stub Server is available at `ui/bridge-stub/` for validating the `remote` mode without a real DeerFlow instance.

**Stub server**
```bash
cd ui/bridge-stub
npm install
npm run dev   # runs on http://localhost:3002
```

**Frontend in remote mode**
```bash
cd ui/shell
VITE_BRIDGE_MODE=remote npm run dev   # default base URL is http://localhost:3002
```

**Verified E2E scenarios**
1. **Talk Success** (`agent_dialogue`) — returns `agent_reply` with `reply.text`
2. **Runtime Error** (`invalid request`) — returns `runtime_error` when `targetAgentId` is missing
3. **Forge Proposal Preview** (`forge_request`) — returns `forge_proposal` with `patchProposals`
4. **World Query** (`world_query`) — returns `query_result` with room summary
5. **Memory Panel** (`POST /v1/memory/panel`) — returns structured `dw-memory-v1` response with sections/notes/tags

### MemoryPanel modes
`requestMemoryPanel(roomId, agentId?)` selects the mode automatically:
- If `agentId` is provided → `agent_memory`
- If `agentId` is omitted → `room_memory`

The stub also supports `world_memory` when queried directly.

### What to change when DeerFlow is ready
1. **Start with `src/adapters/bridgeAdapter.ts`**
   - Ensure the remote endpoint matches `POST /v1/agent/respond`
   - Verify request/response against `src/types/bridge.ts`

2. **Verify `src/types/bridge.ts`**
   - Make sure DeerFlow returns exactly the `BridgeResponse` shape
   - Do not add fields that mutate world state directly

3. **UI components should not need changes**
   - `useShellState.ts` already awaits bridge responses
   - `LogPanel` already renders `ai` and `bridge` log types
   - `StatusPanel` already polls and displays `BridgeStatus`

### Important constraint
DeerFlow must **not** directly mutate `kernelMockData` or the seed world. All world mutations must go through:
1. `patchProposals` in `BridgeResponse`
2. Serialization to `proposals/patch-*.json`
3. Governance approval
4. Kernel execution via `kernelAdapter` or the real kernel API

## Constraints maintained from v2.2

- `/talk`, `/inspect`, `/go` consume the **full remainder** of the command line
- Map node clicks only navigate to **adjacent rooms**
- Tailwind classes are **pre-baked static maps**
- Forge remains **mock-only**
- No modifications to `crates/*` or `apps/cli`
