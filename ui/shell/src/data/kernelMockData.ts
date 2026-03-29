import type { RoomData, AgentData, RoomId, AgentId, ObjectId, Direction } from '@/types/world';

// Aligned with dragon-world kernel seed world (world/rooms/*.yaml)
export const WORLD_DATA: Record<RoomId, RoomData> = {
  core_room: {
    id: 'core_room',
    name: 'Core Room',
    desc: 'The deterministic heart of DragonWorld where bootstrap records are maintained.',
    exits: { south: 'nursery_room', east: 'archive_hall' },
    agents: ['huaxia_zhenlongce'],
    objects: [],
  },
  archive_hall: {
    id: 'archive_hall',
    name: 'Archive Hall',
    desc: 'Shelves of immutable timelines and governance annex references.',
    exits: { west: 'core_room', east: 'council_hall' },
    agents: ['taishi_recorder'],
    objects: ['matrix_brain', 'archive_console'],
  },
  nursery_room: {
    id: 'nursery_room',
    name: 'Nursery Room',
    desc: 'A calm incubation space for lifeform prototypes and repair rituals.',
    exits: { north: 'core_room', south: 'workshop' },
    agents: ['nuwa'],
    objects: ['embryo_pool'],
  },
  council_hall: {
    id: 'council_hall',
    name: 'Council Hall',
    desc: 'An octagonal hall where governance proposals are discussed and ratified.',
    exits: { west: 'archive_hall', north: 'observatory' },
    agents: ['xuanshu_guard'],
    objects: ['forge_table_council'],
  },
  workshop: {
    id: 'workshop',
    name: 'Workshop',
    desc: 'A production floor filled with metalwork, arcs of light, and half-built devices.',
    exits: { north: 'nursery_room', east: 'observatory' },
    agents: ['tiangong_supervisor'],
    objects: ['forge_table_workshop'],
  },
  observatory: {
    id: 'observatory',
    name: 'Observatory',
    desc: 'A transparent domed tower projecting the void and stars beyond DragonWorld.',
    exits: { west: 'workshop', south: 'council_hall' },
    agents: [],
    objects: ['star_map'],
  },
};

// Aligned with dragon-world kernel seed world (world/agents/*.yaml)
export const AGENTS: Record<AgentId, AgentData> = {
  huaxia_zhenlongce: {
    id: 'huaxia_zhenlongce',
    name: '华夏真龙策',
    title: '世界书记',
    role: 'secretary',
    color: 'text-purple-400',
  },
  nuwa: {
    id: 'nuwa',
    name: '女娲',
    title: '生命工匠',
    role: 'creator',
    color: 'text-emerald-400',
  },
  tiangong_supervisor: {
    id: 'tiangong_supervisor',
    name: '天工监理',
    title: '建造总监',
    role: 'engineer',
    color: 'text-amber-400',
  },
  xuanshu_guard: {
    id: 'xuanshu_guard',
    name: '玄枢守卫',
    title: '秩序守护者',
    role: 'guard',
    color: 'text-red-400',
  },
  taishi_recorder: {
    id: 'taishi_recorder',
    name: '太史录官',
    title: '历史保管员',
    role: 'archivist',
    color: 'text-blue-400',
  },
};

// Kernel object schema has no description field, so this is display-only mapping.
export const OBJECT_IDS: ObjectId[] = [
  'matrix_brain',
  'archive_console',
  'embryo_pool',
  'forge_table_workshop',
  'forge_table_council',
  'star_map',
];

export const COMMANDS = [
  '/look',
  '/go',
  '/north',
  '/south',
  '/east',
  '/west',
  '/talk',
  '/inspect',
  '/status',
  '/help',
  'exit',
  'quit',
];

export const MAP_NODES: Record<RoomId, { x: number; y: number }> = {
  core_room: { x: 25, y: 40 },
  archive_hall: { x: 50, y: 40 },
  council_hall: { x: 75, y: 40 },
  nursery_room: { x: 25, y: 65 },
  workshop: { x: 25, y: 90 },
  observatory: { x: 75, y: 15 },
};

export const MAP_EDGES: Array<{ from: RoomId; to: RoomId; dashed?: boolean }> = [
  { from: 'core_room', to: 'archive_hall' },
  { from: 'archive_hall', to: 'council_hall' },
  { from: 'core_room', to: 'nursery_room' },
  { from: 'nursery_room', to: 'workshop' },
  { from: 'council_hall', to: 'observatory' },
  { from: 'workshop', to: 'observatory', dashed: true },
];

export function getOppositeDirection(dir: Direction): Direction {
  const map: Record<Direction, Direction> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
  };
  return map[dir];
}
