import type { BridgeMemoryPanelRequest, BridgeMemoryPanelResponse, MemoryPanelSection } from '../types.js';

const KNOWN_ROOMS = new Set([
  'core_room',
  'archive_hall',
  'nursery_room',
  'council_hall',
  'workshop',
  'observatory',
]);

const KNOWN_AGENTS = new Set([
  'huaxia_zhenlongce',
  'nuwa',
  'tiangong_supervisor',
  'xuanshu_guard',
  'taishi_recorder',
]);

function buildAgentMemory(agentId: string): BridgeMemoryPanelResponse {
  const sections: MemoryPanelSection[] = [
    {
      id: 'recent_changes',
      title: 'Recent World Changes',
      notes: [
        {
          id: 'note-001',
          title: 'Bridge v1 Activated',
          text: 'The dw-bridge-v1 protocol was frozen and the frontend shell was aligned to the kernel seed world.',
          importance: 'high',
          tags: [
            { label: agentId, kind: 'agent' },
            { label: 'core_room', kind: 'room' },
          ],
          source: { type: 'bridge_stub', ref: 'phase-2.4' },
        },
        {
          id: 'note-002',
          title: 'Memory Panel Contract Draft',
          text: 'Phase 2.5 introduces the dw-memory-v1 contract for structured memory queries.',
          importance: 'medium',
          tags: [
            { label: agentId, kind: 'agent' },
            { label: 'memory', kind: 'memory' },
          ],
          source: { type: 'bridge_stub', ref: 'phase-2.5' },
        },
      ],
    },
    {
      id: 'index_summary',
      title: 'Index Summary',
      notes: [
        {
          id: 'note-003',
          title: 'Agent Notebook Index',
          text: `Current agent "${agentId}" has 2 indexed notes and 0 pending governance items.`,
          importance: 'low',
          tags: [
            { label: agentId, kind: 'agent' },
            { label: 'memory', kind: 'memory' },
          ],
          source: { type: 'agent_notebook' },
        },
      ],
    },
  ];

  return {
    protocolVersion: 'dw-memory-v1',
    header: 'Secretary View (Bridge)',
    notice: 'Showing agent memory from bridge stub.',
    mode: 'agent_memory',
    sections,
    errors: [],
  };
}

function buildRoomMemory(roomId: string): BridgeMemoryPanelResponse {
  const isArchiveHall = roomId === 'archive_hall';
  const sections: MemoryPanelSection[] = [
    {
      id: 'room_artifacts',
      title: 'Room Artifacts',
      notes: [
        {
          id: 'note-004',
          title: isArchiveHall ? 'Matrix Brain Log' : 'Room Observation',
          text: isArchiveHall
            ? 'The Matrix Brain pulse frequency in the Archive Hall has been stable for the last 10 ticks.'
            : `No specific artifact memory is indexed for ${roomId} in the stub.`,
          importance: isArchiveHall ? 'high' : 'medium',
          tags: [
            { label: 'matrix_brain', kind: 'object' },
            { label: 'archive_hall', kind: 'room' },
          ],
          source: { type: 'bridge_stub', ref: 'room-scan' },
        },
        {
          id: 'note-005',
          title: isArchiveHall ? 'Archive Console Entry' : 'General Room Note',
          text: isArchiveHall
            ? 'Archive console shows 3 recent governance proposals in pending review.'
            : 'General room metadata is not yet populated in the stub memory store.',
          importance: 'medium',
          tags: [
            { label: 'archive_console', kind: 'object' },
            { label: roomId, kind: 'room' },
          ],
          source: { type: 'bridge_stub', ref: 'room-scan' },
        },
      ],
    },
  ];

  return {
    protocolVersion: 'dw-memory-v1',
    header: 'Room Memory (Bridge)',
    notice: 'Showing room memory from bridge stub.',
    mode: 'room_memory',
    sections,
    errors: [],
  };
}

function buildWorldMemory(): BridgeMemoryPanelResponse {
  const sections: MemoryPanelSection[] = [
    {
      id: 'world_summary',
      title: 'World Summary',
      notes: [
        {
          id: 'note-006',
          title: 'Seed World Status',
          text: 'DragonWorld seed world contains 6 rooms, 5 agents, and 6 objects. All kernel tests pass.',
          importance: 'high',
          tags: [
            { label: 'core_room', kind: 'room' },
            { label: 'memory', kind: 'memory' },
          ],
          source: { type: 'ledger', ref: 'seed-world-v1' },
        },
      ],
    },
    {
      id: 'governance_timeline',
      title: 'Governance Timeline',
      notes: [
        {
          id: 'note-007',
          title: 'Bridge Freeze',
          text: 'The DeerFlow bridge interface was frozen on 2025-03-29. No runtime may directly mutate world state.',
          importance: 'high',
          tags: [
            { label: 'governance', kind: 'governance' },
            { label: 'memory', kind: 'memory' },
          ],
          source: { type: 'ledger', ref: 'bridge-freeze' },
        },
        {
          id: 'note-008',
          title: 'Pending Proposals',
          text: 'There are 0 approved patch proposals and 0 rejected proposals in the current stub cycle.',
          importance: 'low',
          tags: [
            { label: 'governance', kind: 'governance' },
          ],
          source: { type: 'bridge_stub', ref: 'proposal-count' },
        },
      ],
    },
  ];

  return {
    protocolVersion: 'dw-memory-v1',
    header: 'World Memory (Bridge)',
    notice: 'Showing world-level memory from bridge stub.',
    mode: 'world_memory',
    sections,
    errors: [],
  };
}

export function handleMemoryPanel(req: BridgeMemoryPanelRequest): BridgeMemoryPanelResponse {
  if (!KNOWN_ROOMS.has(req.roomId)) {
    return {
      protocolVersion: 'dw-memory-v1',
      header: 'Memory Panel Error',
      notice: 'Unknown room.',
      mode: req.mode,
      sections: [],
      errors: [{ code: 'UNKNOWN_ROOM', message: `Room ${req.roomId} is not known.` }],
    };
  }

  if (req.mode === 'agent_memory') {
    if (!req.agentId || !KNOWN_AGENTS.has(req.agentId)) {
      return {
        protocolVersion: 'dw-memory-v1',
        header: 'Memory Panel Error',
        notice: 'Unknown agent.',
        mode: 'agent_memory',
        sections: [],
        errors: [{ code: 'UNKNOWN_AGENT', message: `Agent ${req.agentId ?? 'undefined'} is not known.` }],
      };
    }
    return buildAgentMemory(req.agentId);
  }

  if (req.mode === 'room_memory') {
    return buildRoomMemory(req.roomId);
  }

  return buildWorldMemory();
}
