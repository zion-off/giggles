import { useState } from 'react';

export function useFocusState<T extends string>(initial: T) {
  const [focused, setFocused] = useState<T>(initial);

  return [focused, setFocused] as const;
}
