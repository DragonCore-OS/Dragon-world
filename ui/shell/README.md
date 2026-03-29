# DragonWorld Frontend Shell v2.2

This is the **frontend engineering shell** for DragonWorld. It is a React + Vite + TypeScript application that provides a visual interface to the deterministic world kernel.

## What this shell is

- A **three-column UI** (Entity/Map | Visual+Terminal | Status/Memory/Forge)
- A **local mock client** that simulates kernel commands and future bridge interactions
- An **engineering baseline** for Stitch's v2.1 prototype, split into maintainable components

## Relationship to `dragon-world` kernel

This shell does **not** modify the Rust kernel. It reads from a frozen mock dataset (`src/data/kernelMockData.ts`) that is strictly aligned with the seed world in the main repo:

- 6 rooms
- 5 agents
- 6 objects

When the kernel exposes a real API (e.g., via WebSocket or HTTP), the intended integration point is `src/adapters/kernelAdapter.ts`.

## Truth layers

### `kernel-backed` (green)
These areas reflect deterministic kernel truth and work today with local mock data:
- **RoomPanel** — room name, description, exits, agents, objects
- **MapPanel** — 6-room topology graph, strict adjacency navigation
- **CommandBar** — command parser aligned with `crates/command-parser`
- **LogPanel** — world logs (`/look`, `/go`, `/inspect`)
- **StatusPanel** — room/agent counts
- **Events timeline** — kernel event history

### `bridge-backed` (blue)
These areas require the future DeerFlow bridge to generate real responses:
- **Talk mode / VisualArea** — agent dialogue UI
- **AI logs** — responses after `/talk <agent>`
- **MemoryPanel** — agent notebook and memory summaries

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
      bridgeAdapter.ts   # Empty shell for DeerFlow integration
      mockAdapter.ts     # Forge/mock sample data
    hooks/
      useShellState.ts   # Central shell state + command dispatch
    types/
      world.ts           # Domain types
      ui.ts              # Theme and truth-layer types
    App.tsx
    main.tsx
```

## How to connect DeerFlow bridge later

1. Implement the real HTTP/WebSocket client inside `src/adapters/bridgeAdapter.ts`
2. Keep the same interface (`sendAgentDialogue`, `requestMemoryPanel`, `getBridgeStatus`)
3. `useShellState.ts` already awaits bridge responses — no UI component changes required
4. Do **not** let the bridge directly mutate `kernelMockData`. All world mutations must go through `kernelAdapter` (or the real kernel API).

## Constraints maintained from v2.1

- `/talk`, `/inspect`, `/go` consume the **full remainder** of the command line (not just the first token)
- Map node clicks only navigate to **adjacent rooms**
- Tailwind classes are **pre-baked static maps** — no runtime `bg-${accent}-500` strings
- Forge remains **mock-only** — no real proposal flow
- No modifications to `crates/*` or `apps/cli`
