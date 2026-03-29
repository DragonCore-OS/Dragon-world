import { useState, useRef, useCallback } from 'react';
import type {
  RoomId,
  AgentId,
  ShellMode,
  LeftTab,
  RightTab,
  ThemeKey,
  LogEntry,
  WorldEvent,
} from '@/types/world';
import { executeKernelCommand, getStatus } from '@/adapters/kernelAdapter';
import { sendAgentDialogue } from '@/adapters/bridgeAdapter';
import { WORLD_DATA } from '@/data/kernelMockData';

export interface ShellState {
  currentRoom: RoomId;
  mode: ShellMode;
  talkAgent: AgentId | null;
  leftTab: LeftTab;
  rightTab: RightTab;
  theme: ThemeKey;
  input: string;
  showAnnotations: boolean;
  logs: LogEntry[];
  events: WorldEvent[];
}

function makeTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export function useShellState() {
  const [currentRoom, setCurrentRoom] = useState<RoomId>('core_room');
  const [mode, setMode] = useState<ShellMode>('world');
  const [talkAgent, setTalkAgent] = useState<AgentId | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>('room');
  const [rightTab, setRightTab] = useState<RightTab>('status');
  const [theme, setTheme] = useState<ThemeKey>('neo');
  const [input, setInput] = useState('');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      type: 'system',
      text: 'DragonWorld OS Shell [Version 2.2.0-kernel-truth]',
      timestamp: makeTimestamp(),
    },
    {
      id: 2,
      type: 'world',
      text: WORLD_DATA['core_room'].desc,
      title: `Enter [${WORLD_DATA['core_room'].name}]`,
      timestamp: makeTimestamp(),
    },
  ]);
  const [events, setEvents] = useState<WorldEvent[]>([
    { time: makeTimestamp(), desc: 'System boot sequence completed.' },
  ]);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  const addLog = useCallback((type: LogEntry['type'], text: string, title?: string) => {
    setLogs((prev) => [
      ...prev,
      { id: Date.now(), type, text, title, timestamp: makeTimestamp() },
    ]);
  }, []);

  const addEvent = useCallback((desc: string) => {
    setEvents((prev) => [{ time: makeTimestamp(), desc }, ...prev]);
  }, []);

  const processCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      addLog('command', trimmed);

      // If in talk mode and not a kernel command, treat as bridge message
      const head = trimmed.toLowerCase().split(/\s+/)[0];
      const isKernelCommand =
        head.startsWith('/') || head === 'exit' || head === 'quit';

      if (mode === 'talk' && talkAgent && !isKernelCommand) {
        const bridgeRes = await sendAgentDialogue(talkAgent, trimmed);
        addLog('ai', bridgeRes.reply.text, talkAgent);
        return;
      }

      const result = executeKernelCommand(currentRoom, trimmed);

      if (result.type === 'move' && result.newRoom) {
        setCurrentRoom(result.newRoom);
        setMode('world');
        setTalkAgent(null);
        addLog('world', result.message, result.title);
        addEvent(`Moved to ${result.newRoom}`);
        return;
      }

      if (result.type === 'talk' && result.targetAgent) {
        setMode('talk');
        setTalkAgent(result.targetAgent);
        setRightTab('memory');
        addLog('ai', result.message, result.targetAgent);
        return;
      }

      if (result.type === 'look' || result.type === 'inspect') {
        addLog('world', result.message, result.title);
        return;
      }

      if (result.type === 'status' || result.type === 'help' || result.type === 'exit') {
        addLog(result.type === 'exit' ? 'system' : 'system', result.message);
        return;
      }

      if (result.type === 'error') {
        addLog('error', result.message);
        return;
      }

      // Fallback for anything unexpected
      addLog('error', `Unknown command: ${head}. Type /help for supported kernel commands.`);
    },
    [currentRoom, mode, talkAgent, addLog, addEvent]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const value = input.trim();
        if (value) {
          setInput('');
          processCommand(value);
        }
      }
    },
    [input, processCommand]
  );

  const status = getStatus(currentRoom);

  return {
    state: {
      currentRoom,
      mode,
      talkAgent,
      leftTab,
      rightTab,
      theme,
      input,
      showAnnotations,
      logs,
      events,
    },
    actions: {
      setCurrentRoom,
      setMode,
      setTalkAgent,
      setLeftTab,
      setRightTab,
      setTheme,
      setInput,
      setShowAnnotations,
      processCommand,
      handleInputKeyDown,
      addLog,
      addEvent,
    },
    refs: {
      logEndRef,
    },
    computed: {
      status,
    },
  };
}
