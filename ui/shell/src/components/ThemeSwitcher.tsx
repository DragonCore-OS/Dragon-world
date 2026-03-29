import type { ThemeKey } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';
import { THEMES } from '@/types/ui';

interface Props {
  current: ThemeKey;
  onChange: (key: ThemeKey) => void;
}

export function ThemeSwitcher({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {(Object.entries(THEMES) as [ThemeKey, ThemeSpec][]).map(([k, v]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`w-3 h-3 rounded-full border transition-all ${
            current === k ? 'border-white scale-125' : 'border-transparent opacity-50 hover:opacity-100'
          } ${v.bgAccent}`}
          title={v.name}
        />
      ))}
    </div>
  );
}
