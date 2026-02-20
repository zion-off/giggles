import React from 'react';
import { Box, Text } from 'ink';
import { useFocus } from '../core/focus';
import { FocusTrap, useKeybindings } from '../core/input';
import { useTheme } from '../core/theme';

type BorderStyle = 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic' | 'arrow';

type ModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  borderStyle?: BorderStyle;
};

function ModalInner({ children, onClose, title, borderStyle = 'round' }: ModalProps) {
  const focus = useFocus();
  const theme = useTheme();

  useKeybindings(focus, {
    escape: onClose
  });

  return (
    <Box
      flexDirection="column"
      alignSelf="flex-start"
      borderStyle={borderStyle}
      borderColor={theme.borderColor}
      paddingX={1}
    >
      {title != null && <Text bold>{title}</Text>}
      {children}
    </Box>
  );
}

export function Modal({ children, onClose, title, borderStyle }: ModalProps) {
  return (
    <FocusTrap>
      <ModalInner onClose={onClose} title={title} borderStyle={borderStyle}>
        {children}
      </ModalInner>
    </FocusTrap>
  );
}
