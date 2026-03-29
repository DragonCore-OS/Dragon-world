import { useState, useRef, useCallback, useEffect } from 'react';
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
import type { BridgeStatus } from '@/types/bridge';
import { executeKernelCommand, getStatus } from '@/adapters/kernelAdapter';
import {
  sendAgentDialogue,
  getBridgeStatus,
} from '@/adapters/bridgeAdapter';
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
  bridgeStatus: BridgeStatus;
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
      text: 'DragonWorld OS Shell [Version 2.3.0-bridge-ready]',
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
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(getBridgeStatus());

  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Poll bridge status lightly on mount and after commands
  const refreshBridgeStatus = useCallback(() => {
    setBridgeStatus(getBridgeStatus());
  }, []);

  useEffect(() => {
    refreshBridgeStatus();
  }, [refreshBridgeStatus]);

  const addLog = useCallback((type: LogEntry['type'], text: string, title?: string) => {
    setLogs((prev) => [
      ...prev,
      { id: Date.now(), type, text, title, timestamp: makeTimestamp() },
    ]);
  }, []);

  const addEvent = useCallback((desc: string) => {
    setEvents((prev) => [{ time: makeTimestamp(), desc }, ...prev]);
  }, []);

  // Kernel Gate: validates that the agent is present in the current room
  const kernelTalkGate = useCallback(
    (agentId: AgentId): boolean => {
      const room = WORLD_DATA[currentRoom];
      if (!room.agents.includes(agentId)) {
        addLog('error', `Agent not found in this room: ${agentId}`);
        return false;
      }
      return true;
    },
    [currentRoom, addLog]
  );

  // Bridge Stage: sends dialogue through bridge adapter
  const bridgeTalkStage = useCallback(
    async (agentId: AgentId, message: string) => {
      const res = await sendAgentDialogue(currentRoom, agentId, message);
      refreshBridgeStatus();

      if (res.responseType === 'runtime_error' || res.errors.length > 0) {
        const errMsg = res.errors.map((e) => `[${e.code}] ${e.message}`).join('; ');
        addLog('bridge', errMsg || 'Bridge runtime error', 'Bridge Error');
        return;
      }

      addLog('ai', res.reply.text, agentId);
    },
    [currentRoom, addLog, refreshBridgeStatus]
  );

  const processCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      addLog('command', trimmed);

      const head = trimmed.toLowerCase().split(/\s+/)[0];
      const isKernelCommand =
        head.startsWith('/') || head === 'exit' || head === 'quit';

      // Bridge free-text messages in talk mode
      if (mode === 'talk' && talkAgent && !isKernelCommand) {
        await bridgeTalkStage(talkAgent, trimmed);
        return;
      }

      // Kernel gate for /talk
      if (head === '/talk') {
        const targetAgent = trimmed.substring(5).trim() as AgentId;
        if (!targetAgent) {
          addLog('error', 'Syntax error: /talk <agent_id>');
          return;
        }
        if (!kernelTalkGate(targetAgent)) {
          return;
        }
        setMode('talk');
        setTalkAgent(targetAgent);
        setRightTab('memory');
        // Initial stub greeting (kernel-backed), then bridge can take over for follow-ups
        addLog('ai', `Hello, I am ${WORLD_DATA[currentRoom].agents.includes(targetAgent) ? targetAgent : 'Agent'}. How can I help?`, targetAgent);
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

      addLog('error', `Unknown command: ${head}. Type /help for supported kernel commands.`);
    },
    [currentRoom, mode, talkAgent, addLog, addEvent, kernelTalkGate, bridgeTalkStage]
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
      bridgeStatus,
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
      refreshBridgeStatus,
    },
    refs: {
      logEndRef,
    },
    computed: {
      status,
    },
  };
}
