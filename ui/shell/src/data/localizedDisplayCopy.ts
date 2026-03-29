import type { ObjectId } from '@/types/world';

// Kernel object schema has no 'description' field.
// These descriptions are UI display copy only, not kernel truth.
export const OBJECT_DISPLAY_COPY: Record<ObjectId, { desc: string }> = {
  matrix_brain: {
    desc: 'The central model carrier of the world, the center device for observation and dialogue.',
  },
  archive_console: {
    desc: 'A terminal interface for retrieving world history and previous memories.',
  },
  embryo_pool: {
    desc: 'A cultivation tank emitting a faint biological glow, with unformed code blocks swimming inside.',
  },
  forge_table_workshop: {
    desc: 'The forge table in the workshop, used for physical object generation.',
  },
  forge_table_council: {
    desc: 'The forge table in the council hall, used for proposal signing and polishing.',
  },
  star_map: {
    desc: 'An observation instrument that macroscopically displays the current world topology.',
  },
};

export const UI_LABELS = {
  topBar: {
    title: 'DRAGONWORLD OS',
    versionBadge: 'v2.2-kernel',
  },
  leftTabs: {
    room: 'Entity View',
    map: 'Topology',
  },
  roomPanel: {
    currentRoom: 'Current Room',
    agentsInRoom: (n: number) => `Agents In Room (${n})`,
    objectsInRoom: (n: number) => `Objects In Room (${n})`,
    noAgents: 'No agents present',
    noObjects: 'No objects present',
  },
  commandBar: {
    kernelPrompt: 'root@world:~#',
    bridgePrompt: (agentId: string) => `[${agentId}]>`,
    kernelPlaceholder: 'Enter command (/help, /look, /south, /talk)...',
    bridgePlaceholder: 'Type message (Bridge Pending)...',
  },
  rightTabs: {
    status: 'Status',
    memory: 'Memory',
    forge: 'Forge',
    events: 'Events',
  },
  statusPanel: {
    worldState: 'World State',
    aligned: 'ALIGNED',
    totalRooms: 'Total Rooms',
    activeAgents: 'Active Agents',
  },
  memoryPanel: {
    header: 'Secretary View (Bridge)',
    mockNotice: 'This panel depends on AI Bridge generation. Currently showing default mock.',
    sampleTitle: 'Matrix Brain Status Record',
    sampleText:
      '"In the last 10 ticks, the pulse frequency of the Matrix Brain in the Archive Hall rose by 0.4%."',
  },
  forgePanel: {
    mockTitle: 'MOCK ONLY PANEL',
    mockSubtitle:
      'Future Proposal Flow / Not bound to kernel. The world will not be actually modified.',
    proposalPreview: 'Proposal Preview',
    sampleProposalTitle: 'Add room to the south (Mock)',
    sampleProposalDesc:
      'AI proposes: suggest expanding a new room to the south of core_room.',
    approveDisabled: 'Approve (Disabled)',
    rejectDisabled: 'Reject (Disabled)',
  },
  logPanel: {
    worldTruthPrefix: 'WORLD TRUTH //',
    bridgeDialogueActive: 'Bridge Dialogue Active',
    hudOnline: '[ WORLD TRUTH SENSOR: ONLINE ]',
    hudLoc: (roomId: string) => `KERNEL_LOC: ${roomId}`,
  },
  annotations: {
    on: 'Annotations: ON',
    off: 'Annotations: OFF',
  },
};
