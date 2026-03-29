import { Bug } from 'lucide-react';

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export function AnnotationsToggle({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1 text-xs rounded border transition-colors ${
        enabled
          ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
          : 'border-gray-800 text-gray-500 hover:text-gray-300'
      }`}
    >
      <Bug size={14} />
      {enabled ? 'Annotations: ON' : 'Annotations: OFF'}
    </button>
  );
}
