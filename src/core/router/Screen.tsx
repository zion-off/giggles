import React from 'react';

export type ScreenProps = {
  name: string;
  component: React.ComponentType<Record<string, unknown>>;
};

export function Screen(_props: ScreenProps) {
  return null;
}
