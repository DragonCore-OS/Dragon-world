import { useEffect, useRef } from 'react';
import { MessageSquare, Wifi } from 'lucide-react';
import { getAnnotationClasses } from '@/data/truthLayers';
import type { LogEntry } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  logs: LogEntry[];
  theme: ThemeSpec;
  showAnnotations: boolean;
}

export function LogPanel({ logs, theme, showAnnotations }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth">
      <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
        {logs.map((log) => {
          if (log.type === 'command' || log.type === 'system' || log.type === 'error') {
            const color =
              log.type === 'error'
                ? 'text-red-400'
                : log.type === 'system'
                ? 'text-gray-500'
                : 'text-gray-300';
            return (
              <div key={log.id} className={`${color} py-1 font-mono text-sm flex gap-3`}>
                <span className="opacity-50">{log.timestamp}</span>
                <span>
                  {log.type === 'command'
                    ? `> ${log.text}`
                    : `[${log.type.toUpperCase()}] ${log.text}`}
                </span>
              </div>
            );
          }

          if (log.type === 'world') {
            const annotation = getAnnotationClasses('kernel', showAnnotations);
            return (
              <div
                key={log.id}
                className={`my-3 p-3 border-l-4 ${theme.worldBorder} ${theme.worldBg} flex flex-col gap-1 ${annotation}`}
              >
                {log.title && (
                  <div className={`text-xs font-bold uppercase tracking-widest opacity-70 ${theme.text}`}>
                    {UI_LABELS.logPanel.worldTruthPrefix} {log.title}
                  </div>
                )}
                <div className="text-gray-200 leading-relaxed">{log.text}</div>
              </div>
            );
          }

          if (log.type === 'ai') {
            const annotation = getAnnotationClasses('bridge', showAnnotations);
            return (
              <div key={log.id} className={`my-3 flex gap-3 ${annotation}`}>
                <div className="w-8 h-8 rounded bg-purple-900/50 flex items-center justify-center border border-purple-500/30 shrink-0">
                  <MessageSquare size={14} className="text-purple-400" />
                </div>
                <div className="flex-1 bg-purple-950/10 border border-purple-500/20 rounded p-3">
                  <div className="text-xs text-purple-400 mb-1 font-bold">
                    {log.title || 'Agent'}
                  </div>
                  <div className="text-gray-300 italic">&quot;{log.text}&quot;</div>
                </div>
              </div>
            );
          }

          if (log.type === 'bridge') {
            const annotation = getAnnotationClasses('bridge', showAnnotations);
            return (
              <div key={log.id} className={`my-3 flex gap-3 ${annotation}`}>
                <div className="w-8 h-8 rounded bg-blue-900/50 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Wifi size={14} className="text-blue-400" />
                </div>
                <div className="flex-1 bg-blue-950/10 border border-blue-500/20 rounded p-3">
                  <div className="text-xs text-blue-400 mb-1 font-bold">
                    {log.title || 'Bridge'}
                  </div>
                  <div className="text-gray-300">{log.text}</div>
                </div>
              </div>
            );
          }

          return null;
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
