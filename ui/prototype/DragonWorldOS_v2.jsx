import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Cpu, Map as MapIcon, Database, Users, Box, 
  ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  MessageSquare, History, FileEdit, Settings, Eye, Zap, 
  GitCommit, Check, X, Compass, ShieldAlert, AlertTriangle, Bug
} from 'lucide-react';

// --- KERNEL TRUTH vs UI DISPLAY COPY ---
// WORLD_DATA: Directly aligned with kernel seed world (world/rooms/*.yaml)
// AGENTS: name/title/role aligned with kernel (world/agents/*.yaml)
// OBJECTS: 'desc' is UI display copy because kernel object schema has no description field.
//          (kernel fields: id, name, type, room, interactions, status)

const WORLD_DATA = {
  core_room: { 
    id: 'core_room', name: 'Core Room', 
    desc: 'The deterministic heart of DragonWorld where bootstrap records are maintained.', 
    exits: { south: 'nursery_room', east: 'archive_hall' }, 
    agents: ['huaxia_zhenlongce'], objects: [] 
  },
  archive_hall: { 
    id: 'archive_hall', name: 'Archive Hall', 
    desc: 'Shelves of immutable timelines and governance annex references.', 
    exits: { west: 'core_room', east: 'council_hall' }, 
    agents: ['taishi_recorder'], objects: ['matrix_brain', 'archive_console'] 
  },
  nursery_room: { 
    id: 'nursery_room', name: 'Nursery Room', 
    desc: 'A calm incubation space for lifeform prototypes and repair rituals.', 
    exits: { north: 'core_room', south: 'workshop' }, 
    agents: ['nuwa'], objects: ['embryo_pool'] 
  },
  council_hall: {
    id: 'council_hall', name: 'Council Hall',
    desc: 'An octagonal hall where governance proposals are discussed and ratified.',
    exits: { west: 'archive_hall', north: 'observatory' },
    agents: ['xuanshu_guard'], objects: ['forge_table_council']
  },
  workshop: {
    id: 'workshop', name: 'Workshop',
    desc: 'A production floor filled with metalwork, arcs of light, and half-built devices.',
    exits: { north: 'nursery_room', east: 'observatory' },
    agents: ['tiangong_supervisor'], objects: ['forge_table_workshop']
  },
  observatory: {
    id: 'observatory', name: 'Observatory',
    desc: 'A transparent domed tower projecting the void and stars beyond DragonWorld.',
    exits: { west: 'workshop', south: 'council_hall' },
    agents: [], objects: ['star_map']
  }
};

const AGENTS = { 
  'huaxia_zhenlongce': { name: '华夏真龙策', title: '世界书记', role: 'secretary', color: 'text-purple-400' },
  'nuwa': { name: '女娲', title: '生命工匠', role: 'creator', color: 'text-emerald-400' },
  'tiangong_supervisor': { name: '天工监理', title: '建造总监', role: 'engineer', color: 'text-amber-400' },
  'xuanshu_guard': { name: '玄枢守卫', title: '秩序守护者', role: 'guard', color: 'text-red-400' },
  'taishi_recorder': { name: '太史录官', title: '历史保管员', role: 'archivist', color: 'text-blue-400' }
};

// OBJECTS desc is UI display copy (kernel has no description field for objects)
const OBJECTS = { 
  'matrix_brain': { desc: 'The central model carrier of the world, the center device for observation and dialogue.' },
  'archive_console': { desc: 'A terminal interface for retrieving world history and previous memories.' },
  'embryo_pool': { desc: 'A cultivation tank emitting a faint biological glow, with unformed code blocks swimming inside.' },
  'forge_table_workshop': { desc: 'The forge table in the workshop, used for physical object generation.' },
  'forge_table_council': { desc: 'The forge table in the council hall, used for proposal signing and polishing.' },
  'star_map': { desc: 'An observation instrument that macroscopically displays the current world topology.' }
};

const COMMANDS = ['/look', '/go', '/north', '/south', '/east', '/west', '/talk', '/inspect', '/status', '/help', 'exit', 'quit'];

// --- THEMES (Pre-baked Tailwind classes to avoid tree-shake issues) ---
const THEMES = {
  neo: { 
    name: 'Neo Terminal', 
    bg: 'bg-black', 
    border: 'border-cyan-500/30', 
    text: 'text-cyan-500', 
    accent: 'cyan', 
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    bgAccent: 'bg-cyan-500',
    bgAccentLight: 'bg-cyan-950',
    textAccent: 'text-cyan-500',
    borderAccent: 'border-cyan-500',
    worldBorder: 'border-cyan-500',
    worldBg: 'bg-cyan-950/30',
    mapGlow: 'shadow-[0_0_8px_#06b6d4]'
  },
  living: { 
    name: 'Living Core', 
    bg: 'bg-slate-950', 
    border: 'border-fuchsia-500/30', 
    text: 'text-fuchsia-400', 
    accent: 'fuchsia', 
    glow: 'shadow-[0_0_20px_rgba(217,70,239,0.2)]',
    bgAccent: 'bg-fuchsia-500',
    bgAccentLight: 'bg-fuchsia-950',
    textAccent: 'text-fuchsia-400',
    borderAccent: 'border-fuchsia-500',
    worldBorder: 'border-fuchsia-500',
    worldBg: 'bg-fuchsia-950/20',
    mapGlow: 'shadow-[0_0_8px_#d946ef]'
  },
  civ: { 
    name: 'Civilization', 
    bg: 'bg-stone-950', 
    border: 'border-amber-500/30', 
    text: 'text-amber-500', 
    accent: 'amber', 
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    bgAccent: 'bg-amber-500',
    bgAccentLight: 'bg-amber-950',
    textAccent: 'text-amber-500',
    borderAccent: 'border-amber-500',
    worldBorder: 'border-amber-500',
    worldBg: 'bg-amber-950/30',
    mapGlow: 'shadow-[0_0_8px_#f59e0b]'
  }
};

export default function DragonWorldOS_v2() {
  const [currentRoom, setCurrentRoom] = useState('core_room');
  const [mode, setMode] = useState('world'); 
  const [talkAgent, setTalkAgent] = useState(null);
  const [leftTab, setLeftTab] = useState('room'); 
  const [rightTab, setRightTab] = useState('status'); 
  const [themeKey, setThemeKey] = useState('neo');
  const [input, setInput] = useState('');
  const [showAnnotations, setShowAnnotations] = useState(false);
  
  const [logs, setLogs] = useState([
    { id: 1, type: 'system', text: 'DragonWorld OS Shell [Version 2.1.0-kernel-truth]', timestamp: '00:00:00' },
    { id: 2, type: 'world', text: WORLD_DATA['core_room'].desc, title: `Enter [${WORLD_DATA['core_room'].name}]`, timestamp: '00:00:01' }
  ]);
  const [events, setEvents] = useState([{ time: '00:00:01', desc: 'System boot sequence completed.' }]);

  const logEndRef = useRef(null);
  const theme = THEMES[themeKey];
  const roomData = WORLD_DATA[currentRoom];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type, text, title = null) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { id: Date.now(), type, text, title, timestamp }]);
  };

  const addEvent = (desc) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setEvents(prev => [{ time, desc }, ...prev]);
  };

  const handleCommand = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      const cmd = input.trim();
      addLog('command', cmd);
      setInput('');
      processCommand(cmd);
    }
  };

  // V2.1 STRICT KERNEL COMMAND PARSER (Aligned with crates/command-parser)
  const processCommand = (cmd) => {
    const trimmed = cmd.trim();
    const lower = trimmed.toLowerCase();
    const head = lower.split(/\s+/)[0];

    const tryMove = (dir) => {
      if (roomData.exits[dir]) {
        setCurrentRoom(roomData.exits[dir]);
        const newRoom = WORLD_DATA[roomData.exits[dir]];
        setMode('world');
        setTalkAgent(null);
        addLog('world', newRoom.desc, `Go ${dir.toUpperCase()} -> [${newRoom.name}]`);
        addEvent(`Moved ${dir} to ${newRoom.id}`);
      } else {
        addLog('error', `Cannot go ${dir}: no exit in that direction.`);
      }
    };

    switch (head) {
      case '/look':
        addLog('world', roomData.desc, `Observe [${roomData.name}]`);
        break;
      case '/north': tryMove('north'); break;
      case '/south': tryMove('south'); break;
      case '/east':  tryMove('east'); break;
      case '/west':  tryMove('west'); break;
      case '/go': {
        const dir = trimmed.substring(3).trim().toLowerCase();
        if (dir) tryMove(dir);
        else addLog('error', 'Syntax error: /go <direction>');
        break;
      }
      case '/talk': {
        // Aligned with kernel parser: takes everything after "/talk" as argument
        const targetAgent = trimmed.substring(5).trim();
        if (!targetAgent) {
           addLog('error', 'Syntax error: /talk <agent_id>');
           break;
        }
        if (roomData.agents.includes(targetAgent)) {
          setMode('talk');
          setTalkAgent(targetAgent);
          setRightTab('memory');
          addLog('ai', `Hello, I am ${AGENTS[targetAgent].name}. How can I help?`, targetAgent);
        } else {
          addLog('error', `Agent not found in this room: ${targetAgent}`);
        }
        break;
      }
      case '/inspect': {
        // Aligned with kernel parser: takes everything after "/inspect" as argument
        const targetObj = trimmed.substring(8).trim();
        if (!targetObj) {
           addLog('error', 'Syntax error: /inspect <object_id>');
           break;
        }
        if (roomData.objects.includes(targetObj)) {
          addLog('world', OBJECTS[targetObj].desc, `Inspect object: ${targetObj}`);
        } else {
          addLog('error', `Object not found in this room: ${targetObj}`);
        }
        break;
      }
      case '/status':
        addLog('system', `CURRENT NODE: ${roomData.id} | EXITS: ${Object.keys(roomData.exits).join(', ')}`);
        break;
      case '/help':
        addLog('system', `Supported kernel commands: ${COMMANDS.join(', ')}`);
        break;
      case 'exit':
      case 'quit':
        addLog('system', 'Disconnecting from DragonWorld OS...');
        break;
      default:
        if (mode === 'talk' && talkAgent) {
          addLog('ai', `[Bridge Pending] Regarding "${cmd}", I need to wait for the dialogue bridge.`, talkAgent);
        } else {
          addLog('error', `Unknown command: ${head}. Type /help for supported kernel commands.`);
        }
    }
  };

  // --- Annotation Helper ---
  const annotateClass = (type) => {
    if (!showAnnotations) return '';
    const base = "relative before:absolute before:-top-3 before:-left-1 before:text-[9px] before:font-bold before:px-1 before:rounded before:z-50 ring-2 ring-offset-1 ring-offset-black ";
    switch (type) {
      case 'kernel': return base + "ring-green-500/50 before:bg-green-600 before:text-white before:content-['KERNEL-BACKED']";
      case 'bridge': return base + "ring-blue-500/50 before:bg-blue-600 before:text-white before:content-['BRIDGE-BACKED']";
      case 'mock': return base + "ring-orange-500/50 before:bg-orange-600 before:text-white before:content-['MOCK-ONLY']";
      default: return '';
    }
  };

  // --- Map Coordinates (Strict to 6-room graph) ---
  const mapNodes = {
    core_room: { x: 25, y: 40 },
    archive_hall: { x: 50, y: 40 },
    council_hall: { x: 75, y: 40 },
    nursery_room: { x: 25, y: 65 },
    workshop: { x: 25, y: 90 },
    observatory: { x: 75, y: 15 }
  };

  return (
    <div className={`h-screen w-full ${theme.bg} text-gray-300 font-mono flex flex-col overflow-hidden transition-colors duration-500`}>
      
      {/* --- TOP BAR --- */}
      <div className={`h-12 border-b ${theme.border} flex items-center justify-between px-4 bg-black/40 backdrop-blur shrink-0`}>
        <div className="flex items-center gap-3">
          <Terminal className={theme.text} size={18} />
          <span className="font-bold tracking-widest text-sm text-gray-100">DRAGONWORLD OS <span className="text-red-500 text-[10px] ml-1">v2.1-kernel</span></span>
        </div>
        
        {/* Annotations Toggle */}
        <button 
          onClick={() => setShowAnnotations(!showAnnotations)}
          className={`flex items-center gap-2 px-3 py-1 text-xs rounded border transition-colors ${showAnnotations ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
        >
          <Bug size={14}/> 
          {showAnnotations ? 'Annotations: ON' : 'Annotations: OFF'}
        </button>

        {/* Theme Switcher */}
        <div className="flex items-center gap-2">
          {Object.entries(THEMES).map(([k, v]) => (
            <button 
              key={k} 
              onClick={() => setThemeKey(k)}
              className={`w-3 h-3 rounded-full border ${themeKey === k ? 'border-white scale-125' : 'border-transparent opacity-50 hover:opacity-100'} ${v.bgAccent} transition-all`}
              title={v.name}
            />
          ))}
        </div>
      </div>

      {/* --- MAIN CONTENT (3 Columns) --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Entity & Map */}
        <div className={`w-72 border-r ${theme.border} flex flex-col bg-black/20 shrink-0`}>
          <div className={`flex border-b ${theme.border}`}>
            <button onClick={() => setLeftTab('room')} className={`flex-1 py-3 text-xs tracking-wider flex justify-center items-center gap-2 ${leftTab === 'room' ? theme.text : 'text-gray-600 hover:text-gray-400'}`}><Eye size={14}/> Entity View</button>
            <button onClick={() => setLeftTab('map')} className={`flex-1 py-3 text-xs tracking-wider flex justify-center items-center gap-2 border-l ${theme.border} ${leftTab === 'map' ? theme.text : 'text-gray-600 hover:text-gray-400'}`}><MapIcon size={14}/> Topology</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {leftTab === 'room' ? (
              <div className={`space-y-6 ${annotateClass('kernel')}`}>
                {/* Room Card - KERNEL BACKED */}
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1"><Compass size={12}/> Current Room</div>
                  <div className={`border ${theme.border} bg-gray-900/40 rounded p-3 relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${theme.bgAccent}`}></div>
                    <div className={`text-lg font-bold ${theme.text} mb-1`}>{roomData.name}</div>
                    <div className="text-xs text-gray-400 mb-3 font-bold">{roomData.id}</div>
                    
                    {/* Direction Navigator (Strict Exits) */}
                    <div className="grid grid-cols-3 gap-1 w-24 mx-auto mt-4 mb-2">
                      <div/>
                      <button onClick={()=>processCommand('/north')} className={`p-1 rounded bg-gray-800 flex justify-center border ${roomData.exits.north ? `${theme.border} ${theme.text} hover:bg-gray-700` : 'border-transparent text-gray-800 opacity-30 cursor-not-allowed'}`} disabled={!roomData.exits.north}><ArrowUp size={14}/></button>
                      <div/>
                      <button onClick={()=>processCommand('/west')} className={`p-1 rounded bg-gray-800 flex justify-center border ${roomData.exits.west ? `${theme.border} ${theme.text} hover:bg-gray-700` : 'border-transparent text-gray-800 opacity-30 cursor-not-allowed'}`} disabled={!roomData.exits.west}><ArrowLeft size={14}/></button>
                      <div className="p-1 flex justify-center items-center text-xs text-gray-500">◎</div>
                      <button onClick={()=>processCommand('/east')} className={`p-1 rounded bg-gray-800 flex justify-center border ${roomData.exits.east ? `${theme.border} ${theme.text} hover:bg-gray-700` : 'border-transparent text-gray-800 opacity-30 cursor-not-allowed'}`} disabled={!roomData.exits.east}><ArrowRight size={14}/></button>
                      <div/>
                      <button onClick={()=>processCommand('/south')} className={`p-1 rounded bg-gray-800 flex justify-center border ${roomData.exits.south ? `${theme.border} ${theme.text} hover:bg-gray-700` : 'border-transparent text-gray-800 opacity-30 cursor-not-allowed'}`} disabled={!roomData.exits.south}><ArrowDown size={14}/></button>
                      <div/>
                    </div>
                  </div>
                </div>

                {/* Agents - KERNEL BACKED */}
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1"><Users size={12}/> Agents In Room ({roomData.agents.length})</div>
                  {roomData.agents.length === 0 ? <div className="text-xs text-gray-600 flex items-center justify-center p-3 border border-gray-800 border-dashed rounded bg-black/50">No agents present</div> : 
                    roomData.agents.map(agent => (
                      <div key={agent} onClick={() => processCommand(`/talk ${agent}`)} className="mb-2 p-2 border border-gray-800 rounded bg-gray-900/30 flex items-start gap-3 cursor-pointer hover:border-purple-500/50 transition-colors group">
                        <div className={`mt-1 ${AGENTS[agent].color}`}><MessageSquare size={14}/></div>
                        <div>
                          <div className="text-sm font-bold text-gray-200 group-hover:text-purple-300 transition-colors">{agent}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{AGENTS[agent].role}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>

                {/* Objects - KERNEL BACKED */}
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1"><Box size={12}/> Objects In Room ({roomData.objects.length})</div>
                  {roomData.objects.length === 0 ? <div className="text-xs text-gray-600 flex items-center justify-center p-3 border border-gray-800 border-dashed rounded bg-black/50">No objects present</div> : 
                    roomData.objects.map(obj => (
                      <div key={obj} onClick={() => processCommand(`/inspect ${obj}`)} className="mb-2 p-2 border border-gray-800 rounded bg-gray-900/30 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-colors group">
                        <div className="flex items-center gap-2">
                          <Database size={12} className="text-gray-500 group-hover:text-cyan-400" />
                          <span className="text-xs text-gray-300 group-hover:text-cyan-300 font-bold">{obj}</span>
                        </div>
                        <ChevronRight size={12} className="text-gray-600 group-hover:text-cyan-400" />
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              /* Map - KERNEL BACKED (Strict 6 nodes) */
              <div className={`h-full relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGMxMS4wNDYgMCAyMC04Ljk1NCAyMC0yMFMwIDExLjA0NiAwIDIwcS0xMS4wNDYgMC0yMCAyMnoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] rounded-lg border border-gray-800 overflow-hidden ${annotateClass('kernel')}`}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{stroke: 'rgba(100,100,100,0.5)', strokeWidth: 2}}>
                  {/* core(E) -> archive */}
                  <line x1={`${mapNodes.core_room.x}%`} y1={`${mapNodes.core_room.y}%`} x2={`${mapNodes.archive_hall.x}%`} y2={`${mapNodes.archive_hall.y}%`} />
                  {/* archive(E) -> council */}
                  <line x1={`${mapNodes.archive_hall.x}%`} y1={`${mapNodes.archive_hall.y}%`} x2={`${mapNodes.council_hall.x}%`} y2={`${mapNodes.council_hall.y}%`} />
                  {/* core(S) -> nursery */}
                  <line x1={`${mapNodes.core_room.x}%`} y1={`${mapNodes.core_room.y}%`} x2={`${mapNodes.nursery_room.x}%`} y2={`${mapNodes.nursery_room.y}%`} />
                  {/* nursery(S) -> workshop */}
                  <line x1={`${mapNodes.nursery_room.x}%`} y1={`${mapNodes.nursery_room.y}%`} x2={`${mapNodes.workshop.x}%`} y2={`${mapNodes.workshop.y}%`} />
                  {/* council(N) -> observatory */}
                  <line x1={`${mapNodes.council_hall.x}%`} y1={`${mapNodes.council_hall.y}%`} x2={`${mapNodes.observatory.x}%`} y2={`${mapNodes.observatory.y}%`} />
                  {/* workshop(E) -> observatory (Diagonal) */}
                  <line x1={`${mapNodes.workshop.x}%`} y1={`${mapNodes.workshop.y}%`} x2={`${mapNodes.observatory.x}%`} y2={`${mapNodes.observatory.y}%`} strokeDasharray="4 4" />
                </svg>
                
                {Object.entries(mapNodes).map(([id, pos]) => {
                  const isCurrent = currentRoom === id;
                  // V2.1 FIX: Only allow clicking adjacent nodes (valid exits)
                  const exitDir = Object.keys(roomData.exits).find(k => roomData.exits[k] === id);
                  const isAdjacent = !!exitDir;
                  return (
                    <div 
                      key={id} 
                      className={`absolute flex flex-col items-center justify-center ${isAdjacent ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default opacity-60'}`} 
                      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }} 
                      onClick={() => isAdjacent && processCommand(`/go ${exitDir}`)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isCurrent ? `${theme.border} ${theme.glow} ${theme.bgAccentLight}/80` : 'border-gray-700 bg-gray-900'} z-10`}>
                        {id === 'core_room' ? <Cpu size={16} className={isCurrent ? theme.text : 'text-gray-500'} /> : <Box size={14} className={isCurrent ? theme.text : 'text-gray-500'} />}
                      </div>
                      <div className={`mt-1 text-[9px] font-mono whitespace-nowrap px-1 bg-black/80 rounded ${isCurrent ? theme.text : 'text-gray-500'}`}>{id}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Core Visual & Terminal */}
        <div className="flex-1 flex flex-col relative bg-[#050505]">
          
          {/* Visual Area (Responsive to real room object) */}
          <div className="h-1/3 border-b border-gray-900 relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
             
             <div className={`relative w-40 h-40 flex items-center justify-center ${annotateClass('kernel')}`}>
                {mode === 'talk' ? (
                  // BRIDGE BACKED VISUAL
                  <div className={`relative z-10 flex flex-col items-center ${annotateClass('bridge')}`}>
                     <div className="w-16 h-16 bg-purple-900/40 rounded border border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-sm">
                       <MessageSquare size={24} className="text-purple-300 animate-pulse" />
                     </div>
                     <div className="mt-4 text-purple-400 font-bold tracking-widest text-sm bg-black/60 px-3 py-1 rounded">{talkAgent}</div>
                     <div className="text-[10px] text-purple-500/70 mt-1 uppercase">Bridge Dialogue Active</div>
                  </div>
                ) : roomData.objects.includes('matrix_brain') ? (
                   // KERNEL VISUAL: Matrix Brain exists in this room (archive_hall)
                   <div className="relative z-10">
                     <div className={`absolute inset-0 rounded-full opacity-20 blur-2xl animate-pulse ${theme.bgAccent} transition-colors duration-700`}></div>
                     <div className={`absolute inset-2 rounded-full border-2 border-dashed ${theme.border} animate-[spin_20s_linear_infinite] opacity-30`}></div>
                     <div className={`w-20 h-20 rounded-full ${theme.bgAccentLight} border ${theme.border} ${theme.glow} flex items-center justify-center relative overflow-hidden mx-auto`}>
                       <Cpu size={32} className={`${theme.text} z-10 animate-pulse`} />
                     </div>
                     <div className={`mt-4 text-[10px] tracking-[0.3em] ${theme.text} whitespace-nowrap opacity-70 text-center font-bold`}>[OBJECT: MATRIX_BRAIN]</div>
                   </div>
                ) : (
                   // KERNEL VISUAL: Default Room
                   <div className="relative z-10 flex flex-col items-center opacity-40">
                     <Box size={32} className="text-gray-600" />
                     <div className="mt-4 text-gray-500 tracking-widest text-xs uppercase">{roomData.id}</div>
                     <div className="text-[9px] text-gray-600 mt-1">Objects: {roomData.objects.length} | Agents: {roomData.agents.length}</div>
                   </div>
                )}
             </div>

             {/* HUD Overlays */}
             <div className="absolute top-4 right-4 flex flex-col items-end text-[10px] font-mono z-20">
               <div className={theme.text}>[ WORLD TRUTH SENSOR: ONLINE ]</div>
               <div className="text-gray-500">KERNEL_LOC: {roomData.id}</div>
             </div>
          </div>

          {/* Terminal Log Area - KERNEL & BRIDGE MIX */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth">
            <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
              {logs.map(log => {
                if (log.type === 'command' || log.type === 'system' || log.type === 'error') {
                   const color = log.type === 'error' ? 'text-red-400' : log.type === 'system' ? 'text-gray-500' : 'text-gray-300';
                   return <div key={log.id} className={`${color} py-1 font-mono text-sm flex gap-3`}><span className="opacity-50">{log.timestamp}</span><span>{log.type==='command'?`> ${log.text}`:`[${log.type.toUpperCase()}] ${log.text}`}</span></div>;
                }
                if (log.type === 'world') {
                  return (
                    <div key={log.id} className={`my-3 p-3 border-l-4 ${theme.worldBorder} ${theme.worldBg} flex flex-col gap-1 ${annotateClass('kernel')}`}>
                      {log.title && <div className={`text-xs font-bold uppercase tracking-widest opacity-70 ${theme.text}`}>WORLD TRUTH // {log.title}</div>}
                      <div className="text-gray-200 leading-relaxed">{log.text}</div>
                    </div>
                  );
                }
                if (log.type === 'ai') {
                  return (
                    <div key={log.id} className={`my-3 flex gap-3 ${annotateClass('bridge')}`}>
                      <div className="w-8 h-8 rounded bg-purple-900/50 flex items-center justify-center border border-purple-500/30 shrink-0"><MessageSquare size={14} className="text-purple-400" /></div>
                      <div className="flex-1 bg-purple-950/10 border border-purple-500/20 rounded p-3">
                        <div className="text-xs text-purple-400 mb-1 font-bold">{log.title || 'Agent'}</div>
                        <div className="text-gray-300 italic">"{log.text}"</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Command Input Bar - KERNEL BACKED */}
          <div className={`h-14 border-t ${theme.border} bg-black/80 backdrop-blur flex items-center px-4 shrink-0 ${annotateClass('kernel')}`}>
            <div className={`mr-3 ${mode === 'talk' ? 'text-purple-500' : theme.text} font-bold`}>
              {mode === 'talk' ? `[${talkAgent}]>` : `root@world:~#`}
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleCommand}
              placeholder={mode === 'talk' ? "Type message (Bridge Pending)..." : "Enter command (/help, /look, /south, /talk)..."}
              className="flex-1 bg-transparent outline-none text-gray-200 font-mono placeholder-gray-600"
              autoFocus
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Status / Memory / Forge */}
        <div className={`w-80 border-l ${theme.border} flex flex-col bg-black/20 shrink-0`}>
           <div className={`flex border-b ${theme.border} text-[10px] font-bold tracking-wider uppercase`}>
            <button onClick={() => setRightTab('status')} className={`flex-1 py-3 border-r ${theme.border} ${rightTab === 'status' ? `${theme.bg} ${theme.text}` : 'text-gray-600 hover:text-gray-400'}`}>Status</button>
            <button onClick={() => setRightTab('memory')} className={`flex-1 py-3 border-r ${theme.border} flex items-center justify-center gap-1 ${rightTab === 'memory' ? `bg-purple-950/30 text-purple-400` : 'text-gray-600 hover:text-gray-400'}`}>Memory</button>
            <button onClick={() => {setRightTab('forge'); setMode('world');}} className={`flex-1 py-3 border-r ${theme.border} flex items-center justify-center gap-1 ${rightTab === 'forge' ? `bg-orange-950/30 text-orange-400` : 'text-gray-600 hover:text-gray-400'}`}>Forge</button>
            <button onClick={() => setRightTab('events')} className={`flex-1 py-3 ${rightTab === 'events' ? `${theme.bg} ${theme.text}` : 'text-gray-600 hover:text-gray-400'}`}>Events</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            
            {/* STATUS - KERNEL BACKED */}
            {rightTab === 'status' && (
              <div className={`space-y-6 ${annotateClass('kernel')}`}>
                <div className={`p-4 border ${theme.border} bg-gray-900/30 rounded flex items-center justify-between`}>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">World State</div>
                    <div className={`text-lg font-bold ${theme.text} flex items-center gap-2`}><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ALIGNED</div>
                  </div>
                  <Zap className="text-gray-700" size={24}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-900/40 border border-gray-800 rounded"><div className="text-[10px] text-gray-500 mb-1">Total Rooms</div><div className="text-xl text-gray-200">6</div></div>
                  <div className="p-3 bg-gray-900/40 border border-gray-800 rounded"><div className="text-[10px] text-gray-500 mb-1">Active Agents</div><div className="text-xl text-gray-200">5</div></div>
                </div>
              </div>
            )}

            {/* MEMORY - BRIDGE BACKED */}
            {rightTab === 'memory' && (
              <div className={`space-y-4 ${annotateClass('bridge')}`}>
                <div className="flex items-center gap-2 mb-4 border-b border-purple-900/50 pb-2">
                  <FileEdit size={14} className="text-purple-400" />
                  <div className="text-sm font-bold text-purple-400">Secretary View (Bridge)</div>
                </div>
                <div className="p-3 border border-purple-500/30 bg-purple-950/10 rounded">
                  <div className="text-xs text-purple-300/80 mb-2 italic">This panel depends on AI Bridge generation. Currently showing default mock.</div>
                  <div className="text-xs font-bold text-gray-300 mb-2">Matrix Brain Status Record</div>
                  <div className="text-xs text-gray-400 leading-relaxed mb-3">"In the last 10 ticks, the pulse frequency of the Matrix Brain in the Archive Hall rose by 0.4%."</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] px-2 py-0.5 bg-black border border-purple-900 text-purple-400 rounded">matrix_brain</span>
                    <span className="text-[9px] px-2 py-0.5 bg-black border border-purple-900 text-purple-400 rounded">archive_hall</span>
                  </div>
                </div>
              </div>
            )}

            {/* FORGE - MOCK ONLY */}
            {rightTab === 'forge' && (
              <div className={`space-y-4 ${annotateClass('mock')}`}>
                <div className="bg-orange-950/50 border border-orange-500/50 p-2 rounded flex items-start gap-2 mb-4">
                  <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-orange-400">MOCK ONLY PANEL</div>
                    <div className="text-[10px] text-orange-500/70">Future Proposal Flow / Not bound to kernel. The world will not be actually modified.</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <GitCommit size={14} className="text-orange-400" />
                  <div className="text-sm font-bold text-orange-400">Proposal Preview</div>
                </div>

                <div className="p-4 border border-orange-500/40 bg-orange-950/20 rounded relative opacity-80 cursor-not-allowed">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-orange-600 text-black text-[10px] font-bold px-2 py-1 rounded uppercase">Bridge Pending</div>
                    <div className="text-xs text-orange-500/60 font-mono">PR-882</div>
                  </div>
                  <div className="text-sm font-bold text-gray-400 mb-1">Add room to the south (Mock)</div>
                  <div className="text-xs text-gray-500 mb-4 line-clamp-2">AI proposes: suggest expanding a new room to the south of core_room.</div>
                  <div className="flex gap-2">
                    <button disabled className="flex-1 py-2 bg-gray-900 border border-gray-700 text-gray-600 text-xs font-bold rounded">Approve (Disabled)</button>
                    <button disabled className="flex-1 py-2 bg-gray-900 border border-gray-700 text-gray-600 text-xs font-bold rounded">Reject (Disabled)</button>
                  </div>
                </div>
              </div>
            )}

            {/* EVENTS - KERNEL BACKED */}
            {rightTab === 'events' && (
              <div className={`relative border-l border-gray-800 ml-3 pl-4 space-y-6 pt-2 ${annotateClass('kernel')}`}>
                {events.map((ev, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ${i === 0 ? `${theme.bgAccent} ${theme.mapGlow}` : 'bg-gray-700'}`}></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">{ev.time}</div>
                    <div className={`text-xs ${i === 0 ? 'text-gray-200' : 'text-gray-400'}`}>{ev.desc}</div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 100, 100, 0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 100, 100, 0.5); }
      `}} />
    </div>
  );
}
