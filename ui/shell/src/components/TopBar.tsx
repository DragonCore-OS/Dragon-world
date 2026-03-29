import { Terminal } from 'lucide-react';
import { AnnotationsToggle } from './AnnotationsToggle';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { ThemeKey } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  theme: ThemeSpec;
  themeKey: ThemeKey;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  onChangeTheme: (key: ThemeKey) => void;
}

export function TopBar({
  theme,
  themeKey,
  showAnnotations,
  onToggleAnnotations,
  onChangeTheme,
}: Props) {
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

      <AnnotationsToggle enabled={showAnnotations} onToggle={onToggleAnnotations} />

      <ThemeSwitcher current={themeKey} onChange={onChangeTheme} />
    </div>
  );
}
