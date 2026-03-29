import { Terminal } from 'lucide-react';
import { AnnotationsToggle } from './AnnotationsToggle';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { ThemeKey } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';
import type { BridgeStatus } from '@/types/bridge';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  theme: ThemeSpec;
  themeKey: ThemeKey;
  showAnnotations: boolean;
  bridgeStatus: BridgeStatus;
  onToggleAnnotations: () => void;
  onChangeTheme: (key: ThemeKey) => void;
}

export function TopBar({
  theme,
  themeKey,
  showAnnotations,
  bridgeStatus,
  onToggleAnnotations,
  onChangeTheme,
}: Props) {
  const bridgeDotColor =
    bridgeStatus.mode === 'disabled'
      ? 'bg-gray-500'
      : bridgeStatus.mode === 'mock'
      ? 'bg-blue-500'
      : bridgeStatus.connected
      ? 'bg-green-500'
      : 'bg-red-500';

  return (
    <div
      className={`h-12 border-b ${theme.border} flex items-center justify-between px-4 bg-black/40 backdrop-blur shrink-0`}
    >
      <div className="flex items-center gap-3">
        <Terminal className={theme.text} size={18} />
        <span className="font-bold tracking-widest text-sm text-gray-100">
          {UI_LABELS.topBar.title}{' '}
          <span className="text-red-500 text-[10px] ml-1">{UI_LABELS.topBar.versionBadge}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Bridge mode indicator */}
        <div className="flex items-center gap-2 px-2 py-1 rounded border border-gray-800 bg-black/30">
          <span className={`w-2 h-2 rounded-full ${bridgeDotColor}`}></span>
          <span className="text-[10px] text-gray-400 uppercase font-bold">{bridgeStatus.mode}</span>
        </div>

        <AnnotationsToggle enabled={showAnnotations} onToggle={onToggleAnnotations} />
        <ThemeSwitcher current={themeKey} onChange={onChangeTheme} />
      </div>
    </div>
  );
}
