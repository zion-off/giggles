export type ScreenRoute = {
  id: number;
  name: string;
  params?: Record<string, unknown>;
};

export type NavigationContextValue = {
  currentRoute: ScreenRoute;
  canGoBack: boolean;
  active: boolean;
  push(name: string, params?: Record<string, unknown>): void;
  pop(): void;
  replace(name: string, params?: Record<string, unknown>): void;
  reset(name: string, params?: Record<string, unknown>): void;
};
