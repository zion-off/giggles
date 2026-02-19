// giggles — a framework for ink apps

// Core
export { GigglesError } from './core/GigglesError';
export { GigglesProvider } from './core/GigglesProvider';

// Focus system
export { FocusGroup, useFocus, useFocusState } from './core/focus';
export type { FocusHandle } from './core/focus';

// Input system
export { useKeybindings, FocusTrap, useKeybindingRegistry } from './core/input';
export type { Keybindings, KeybindingOptions, KeyHandler, Key, RegisteredKeybinding } from './core/input';
export type { KeybindingRegistry } from './core/input';

// Router
export { Router, Screen, useNavigation } from './core/router';
export type { NavigationContextValue } from './core/router';
