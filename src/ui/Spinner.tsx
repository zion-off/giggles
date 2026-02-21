import { useEffect, useState } from 'react';
import { Text } from 'ink';
import { useTheme } from '../core/theme';

export type SpinnerDef = {
  frames: string[];
  interval: number;
};

export const spinners = {
  line: { frames: ['-', '\\', '|', '/'], interval: 130 },
  dot: { frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'], interval: 130 },
  miniDot: { frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], interval: 80 },
  jump: { frames: ['⢄', '⢂', '⢁', '⡁', '⡈', '⡐', '⡠'], interval: 100 },
  pulse: { frames: ['█', '▓', '▒', '░'], interval: 120 },
  points: { frames: ['∙∙∙', '●∙∙', '∙●∙', '∙∙●'], interval: 200 },
  clock: { frames: ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'], interval: 100 },
  hearts: { frames: ['❤️', '🧡', '💛', '💚', '💙', '💜'], interval: 120 },
  moon: { frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'], interval: 180 },
  meter: { frames: ['▱▱▱', '▰▱▱', '▰▰▱', '▰▰▰', '▰▰▱', '▰▱▱', '▱▱▱'], interval: 100 },
  hamburger: { frames: ['☱', '☲', '☴'], interval: 100 },
  ellipsis: { frames: ['.  ', '.. ', '...', '   '], interval: 300 }
} satisfies Record<string, SpinnerDef>;

type SpinnerProps = {
  spinner?: SpinnerDef;
  color?: string;
};

export function Spinner({ spinner = spinners.line, color }: SpinnerProps) {
  const theme = useTheme();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % spinner.frames.length);
    }, spinner.interval);
    return () => clearInterval(id);
  }, [spinner]);

  return <Text color={color ?? theme.accentColor}>{spinner.frames[frame]}</Text>;
}
