import { Text } from 'ink';
import { useTheme } from '../core/theme';

export type BadgeVariant = 'round' | 'arrow' | 'plain';

const glyphs: Record<BadgeVariant, [string, string]> = {
  round: ['\uE0B6', '\uE0B4'],
  arrow: ['\uE0B2', '\uE0B0'],
  plain: ['', '']
};

export type BadgeProps = {
  children: string;
  color?: string;
  background?: string;
  variant?: BadgeVariant;
};

export function Badge({ children, color, background, variant = 'round' }: BadgeProps) {
  const theme = useTheme();
  const bg = background ?? theme.accentColor;
  const fg = color ?? '#000000';
  const [left, right] = glyphs[variant];
  const label = variant === 'plain' ? ` ${children} ` : children;

  return (
    <Text>
      {left && <Text color={bg}>{left}</Text>}
      <Text color={fg} backgroundColor={bg} bold>
        {label}
      </Text>
      {right && <Text color={bg}>{right}</Text>}
    </Text>
  );
}
