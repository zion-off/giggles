import { Text } from 'ink';
import { useFocusNode } from '../core/focus';
import { useKeybindings } from '../core/input';

type ConfirmProps = {
  message: string;
  defaultValue?: boolean;
  onSubmit: (value: boolean) => void;
  focusKey?: string;
};

export function Confirm({ message, defaultValue = true, onSubmit, focusKey }: ConfirmProps) {
  const focus = useFocusNode({ focusKey });

  useKeybindings(focus, {
    y: () => onSubmit(true),
    n: () => onSubmit(false),
    enter: () => onSubmit(defaultValue)
  });

  const hint = defaultValue ? 'Y/n' : 'y/N';

  return (
    <Text dimColor={!focus.hasFocus}>
      {message} <Text dimColor>({hint})</Text>
    </Text>
  );
}
