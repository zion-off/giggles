// giggles — a framework for ink apps

// Core
export { GigglesError } from './core/GigglesError';
export { GigglesProvider } from './core/GigglesProvider';
export { ThemeProvider, useTheme } from './core/theme';
export type { GigglesTheme } from './core/theme';

// Focus system
export { useFocusScope, FocusScope, useFocusNode } from './core/focus';
export type { FocusScopeHandle, FocusScopeHelpers, FocusScopeOptions, FocusNodeHandle } from './core/focus';

// Input system
export { useKeybindings, useGlobalKeybindings, FocusTrap, useKeybindingRegistry } from './core/input';
export type { Keybindings, KeybindingOptions, KeyHandler, Key, RegisteredKeybinding } from './core/input';
export type { KeybindingRegistry } from './core/input';

// Router
export { Router, Screen, useNavigation } from './core/router';
export type { NavigationContextValue } from './core/router';
