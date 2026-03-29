export type RoomId =
  | 'core_room'
  | 'archive_hall'
  | 'nursery_room'
  | 'council_hall'
  | 'workshop'
  | 'observatory';

export type AgentId =
  | 'huaxia_zhenlongce'
  | 'nuwa'
  | 'taishi_recorder'
  | 'tiangong_supervisor'
  | 'xuanshu_guard';

export type ObjectId =
  | 'matrix_brain'
  | 'archive_console'
  | 'embryo_pool'
  | 'forge_table_workshop'
  | 'forge_table_council'
  | 'star_map';

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface RoomData {
  id: RoomId;
  name: string;
  desc: string;
  exits: Partial<Record<Direction, RoomId>>;
  agents: AgentId[];
  objects: ObjectId[];
}

export interface AgentData {
  id: AgentId;
  name: string;
  title: string;
  role: string;
  color: string;
}

export interface ObjectData {
  id: ObjectId;
  desc: string;
}

export type LogType = 'command' | 'system' | 'error' | 'world' | 'ai';

export interface LogEntry {
  id: number;
  type: LogType;
  text: string;
  title?: string;
  timestamp: string;
}

export interface WorldEvent {
  time: string;
  desc: string;
}

export type ShellMode = 'world' | 'talk';
export type LeftTab = 'room' | 'map';
export type RightTab = 'status' | 'memory' | 'forge' | 'events';
export type ThemeKey = 'neo' | 'living' | 'civ';
export type TruthLayer = 'kernel' | 'bridge' | 'mock';
