import { Eye, Map as MapIcon } from 'lucide-react';
import { ShellLayout } from '@/components/ShellLayout';
import { TopBar } from '@/components/TopBar';
import { RoomPanel } from '@/components/RoomPanel';
import { MapPanel } from '@/components/MapPanel';
import { VisualArea } from '@/components/VisualArea';
import { LogPanel } from '@/components/LogPanel';
import { CommandBar } from '@/components/CommandBar';
import { StatusPanel } from '@/components/StatusPanel';
import { MemoryPanel } from '@/components/MemoryPanel';
import { ForgePanel } from '@/components/ForgePanel';
import { getAnnotationClasses } from '@/data/truthLayers';
import { useShellState } from '@/hooks/useShellState';
import { THEMES } from '@/types/ui';
import { UI_LABELS } from '@/data/localizedDisplayCopy';
import type { ThemeKey } from '@/types/world';

function App() {
  const { state, actions, computed } = useShellState();
  const theme = THEMES[state.theme];

  const leftTabs = (
    <div className={`flex border-b ${theme.border}`}>
      <button
        onClick={() => actions.setLeftTab('room')}
        className={`flex-1 py-3 text-xs tracking-wider flex justify-center items-center gap-2 ${
          state.leftTab === 'room' ? theme.text : 'text-gray-600 hover:text-gray-400'
        }`}
      >
        <Eye size={14} /> {UI_LABELS.leftTabs.room}
      </button>
      <button
        onClick={() => actions.setLeftTab('map')}
        className={`flex-1 py-3 text-xs tracking-wider flex justify-center items-center gap-2 border-l ${theme.border} ${
          state.leftTab === 'map' ? theme.text : 'text-gray-600 hover:text-gray-400'
        }`}
      >
        <MapIcon size={14} /> {UI_LABELS.leftTabs.map}
      </button>
    </div>
  );

  const rightTabs = (
    <div className={`flex border-b ${theme.border} text-[10px] font-bold tracking-wider uppercase`}>
      {(['status', 'memory', 'forge', 'events'] as const).map((tab, idx) => (
        <button
          key={tab}
          onClick={() => {
            actions.setRightTab(tab);
            if (tab === 'forge') actions.setMode('world');
          }}
          className={`flex-1 py-3 ${
            idx < 3 ? `border-r ${theme.border}` : ''
          } flex items-center justify-center gap-1 ${
            state.rightTab === tab
              ? tab === 'memory'
                ? 'bg-purple-950/30 text-purple-400'
                : tab === 'forge'
                ? 'bg-orange-950/30 text-orange-400'
                : `${theme.bg} ${theme.text}`
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          {UI_LABELS.rightTabs[tab]}
        </button>
      ))}
    </div>
  );

  const eventsAnnotation = getAnnotationClasses('kernel', state.showAnnotations);

  return (
    <ShellLayout
      theme={theme}
      topBar={
        <TopBar
          theme={theme}
          themeKey={state.theme}
          showAnnotations={state.showAnnotations}
          bridgeStatus={state.bridgeStatus}
          onToggleAnnotations={() => actions.setShowAnnotations(!state.showAnnotations)}
          onChangeTheme={(k: ThemeKey) => actions.setTheme(k)}
        />
      }
      leftColumn={
        <div className={`w-72 border-r ${theme.border} flex flex-col bg-black/20 shrink-0`}>
          {leftTabs}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {state.leftTab === 'room' ? (
              <RoomPanel
                roomId={state.currentRoom}
                theme={theme}
                showAnnotations={state.showAnnotations}
                onTalk={(id) => actions.processCommand(`/talk ${id}`)}
                onInspect={(id) => actions.processCommand(`/inspect ${id}`)}
                onNavigate={(dir) => actions.processCommand(`/${dir}`)}
              />
            ) : (
              <MapPanel
                currentRoom={state.currentRoom}
                theme={theme}
                showAnnotations={state.showAnnotations}
                onNavigate={(dir) => actions.processCommand(`/${dir}`)}
              />
            )}
          </div>
        </div>
      }
      centerColumn={
        <div className="flex-1 flex flex-col relative bg-[#050505]">
          <VisualArea
            roomId={state.currentRoom}
            mode={state.mode}
            talkAgent={state.talkAgent}
            theme={theme}
            showAnnotations={state.showAnnotations}
          />
          <LogPanel logs={state.logs} theme={theme} showAnnotations={state.showAnnotations} />
          <CommandBar
            mode={state.mode}
            talkAgent={state.talkAgent}
            theme={theme}
            input={state.input}
            showAnnotations={state.showAnnotations}
            onInputChange={actions.setInput}
            onKeyDown={actions.handleInputKeyDown}
          />
        </div>
      }
      rightColumn={
        <div className={`w-80 border-l ${theme.border} flex flex-col bg-black/20 shrink-0`}>
          {rightTabs}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {state.rightTab === 'status' && (
              <StatusPanel
                totalRooms={computed.status.totalRooms}
                totalAgents={computed.status.totalAgents}
                theme={theme}
                showAnnotations={state.showAnnotations}
                bridgeStatus={state.bridgeStatus}
              />
            )}
            {state.rightTab === 'memory' && (
              <MemoryPanel
                showAnnotations={state.showAnnotations}
                agentId={state.talkAgent}
                roomId={state.currentRoom}
              />
            )}
            {state.rightTab === 'forge' && <ForgePanel showAnnotations={state.showAnnotations} />}
            {state.rightTab === 'events' && (
              <div className={`relative border-l border-gray-800 ml-3 pl-4 space-y-6 pt-2 ${eventsAnnotation}`}>
                {state.events.map((ev, i) => (
                  <div key={i} className="relative">
                    <div
                      className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ${
                        i === 0 ? `${theme.bgAccent} ${theme.mapGlow}` : 'bg-gray-700'
                      }`}
                    ></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">{ev.time}</div>
                    <div className={`text-xs ${i === 0 ? 'text-gray-200' : 'text-gray-400'}`}>
                      {ev.desc}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}

export default App;
