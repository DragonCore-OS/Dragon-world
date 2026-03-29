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
import type { KernelStatus } from '@/types/world';
import { executeKernelCommand, getStatus, getVisibleAgents } from '@/adapters/kernelAdapter';
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
  kernelStatus: KernelStatus | null;
  isLoading: boolean;
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
      text: 'DragonWorld OS Shell [Version 2.3.0-kernel-ready]',
      timestamp: makeTimestamp(),
    },
  ]);
  const [events, setEvents] = useState<WorldEvent[]>([
    { time: makeTimestamp(), desc: 'System boot sequence completed.' },
  ]);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(getBridgeStatus());
  const [kernelStatus, setKernelStatus] = useState<KernelStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Poll bridge status lightly on mount and after commands
  const refreshBridgeStatus = useCallback(() => {
    setBridgeStatus(getBridgeStatus());
  }, []);

  useEffect(() => {
    refreshBridgeStatus();
  }, [refreshBridgeStatus]);

  // Fetch kernel status when room changes
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getStatus(currentRoom).then((status) => {
      if (mounted) {
        setKernelStatus(status);
        setIsLoading(false);
      }
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [currentRoom]);

  // Initial room description
  useEffect(() => {
    let mounted = true;
    // Use WORLD_DATA only for initial mock data if kernel not ready yet
    const initialRoom = WORLD_DATA['core_room'];
    if (mounted) {
      setLogs((prev) => [
        ...prev,
        {
          id: 2,
          type: 'world',
          text: initialRoom.desc,
          title: `Enter [${initialRoom.name}]`,
          timestamp: makeTimestamp(),
        },
      ]);
    }
    return () => {
      mounted = false;
    };
  }, []);

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
    async (agentId: AgentId): Promise<boolean> => {
      try {
        const agents = await getVisibleAgents(currentRoom);
        if (!agents.some((a) => a.id === agentId)) {
          addLog('error', `Agent not found in this room: ${agentId}`);
          return false;
        }
        return true;
      } catch (err) {
        addLog('error', `Failed to check agents: ${err}`);
        return false;
      }
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
        if (!(await kernelTalkGate(targetAgent))) {
          return;
        }
        setMode('talk');
        setTalkAgent(targetAgent);
        setRightTab('memory');
        // Initial stub greeting
        addLog('ai', `Hello, I am ${targetAgent}. How can I help?`, targetAgent);
        return;
      }

      const result = await executeKernelCommand(currentRoom, trimmed);

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

  // Use kernelStatus if available, fallback to defaults
  const status: KernelStatus = kernelStatus ?? {
    currentRoom,
    totalRooms: 6,
    totalAgents: 5,
    totalObjects: 6,
    exits: [],
  };

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
      kernelStatus,
      isLoading,
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
