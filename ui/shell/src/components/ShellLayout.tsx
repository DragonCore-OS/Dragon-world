import type { ReactNode } from 'react';
import type { ThemeSpec } from '@/types/ui';

interface Props {
  theme: ThemeSpec;
  topBar: ReactNode;
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
}

export function ShellLayout({ theme, topBar, leftColumn, centerColumn, rightColumn }: Props) {
  return (
    <div className={`h-screen w-full ${theme.bg} text-gray-300 font-mono flex flex-col overflow-hidden transition-colors duration-500`}>
      {topBar}
      <div className="flex-1 flex overflow-hidden">
        {leftColumn}
        {centerColumn}
        {rightColumn}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 100, 100, 0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 100, 100, 0.5); }
      `}} />
    </div>
  );
}
