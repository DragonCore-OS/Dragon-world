import { getAnnotationClasses } from '@/data/truthLayers';
import type { ShellMode, AgentId } from '@/types/world';
import type { ThemeSpec } from '@/types/ui';
import { UI_LABELS } from '@/data/localizedDisplayCopy';

interface Props {
  mode: ShellMode;
  talkAgent: AgentId | null;
  theme: ThemeSpec;
  input: string;
  showAnnotations: boolean;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function CommandBar({
  mode,
  talkAgent,
  theme,
  input,
  showAnnotations,
  onInputChange,
  onKeyDown,
}: Props) {
  const annotation = getAnnotationClasses('kernel', showAnnotations);
  const prompt =
    mode === 'talk' && talkAgent
      ? UI_LABELS.commandBar.bridgePrompt(talkAgent)
      : UI_LABELS.commandBar.kernelPrompt;
  const placeholder =
    mode === 'talk' && talkAgent
      ? UI_LABELS.commandBar.bridgePlaceholder
      : UI_LABELS.commandBar.kernelPlaceholder;

  return (
    <div
      className={`h-14 border-t ${theme.border} bg-black/80 backdrop-blur flex items-center px-4 shrink-0 ${annotation}`}
    >
      <div className={`mr-3 ${mode === 'talk' ? 'text-purple-500' : theme.text} font-bold`}>
        {prompt}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-gray-200 font-mono placeholder-gray-600"
        autoFocus
      />
    </div>
  );
}
