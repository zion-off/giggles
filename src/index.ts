// giggles — a framework for ink apps

// Core
export { GigglesError } from './core/GigglesError';
export { GigglesProvider } from './core/GigglesProvider';

// Focus system
export { FocusGroup, useFocus, useFocusState } from './core/focus';
export type { FocusHandle } from './core/focus';

// Input system
export { useKeybindings, FocusTrap } from './core/input';
export type { Keybindings, KeybindingOptions, KeyHandler, Key } from './core/input';

// Router
export { Router, Screen, useNavigation } from './core/router';
export type { ScreenRoute, NavigationContextValue } from './core/router';
