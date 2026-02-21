import React from 'react';
import { Box, type BoxProps, Text } from 'ink';
import { useFocus } from '../core/focus';
import { FocusTrap, useKeybindings } from '../core/input';
import { useTheme } from '../core/theme';

type ModalProps = Omit<BoxProps, 'children'> & {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
};

function ModalInner({ children, onClose, title, ...boxProps }: ModalProps) {
  const focus = useFocus();
  const theme = useTheme();

  useKeybindings(focus, {
    escape: onClose
  });

  return (
    <Box
      flexDirection="column"
      alignSelf="flex-start"
      borderStyle="round"
      borderColor={theme.borderColor}
      paddingX={1}
      {...boxProps}
    >
      {title != null && <Text bold>{title}</Text>}
      {children}
    </Box>
  );
}

export function Modal({ children, onClose, title, ...boxProps }: ModalProps) {
  return (
    <FocusTrap>
      <ModalInner onClose={onClose} title={title} {...boxProps}>
        {children}
      </ModalInner>
    </FocusTrap>
  );
}
