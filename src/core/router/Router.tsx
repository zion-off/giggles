import React, { useCallback, useReducer, useRef } from 'react';
import { GigglesError } from '../GigglesError';
import { Screen, type ScreenProps } from './Screen';
import { ScreenEntry } from './ScreenEntry';
import type { ScreenRoute } from './types';

type RouterProps = {
  children: React.ReactNode;
  initialScreen: string;
  initialParams?: Record<string, unknown>;
};

type NavigationAction =
  | { type: 'push'; route: ScreenRoute }
  | { type: 'pop' }
  | { type: 'replace'; route: ScreenRoute }
  | { type: 'reset'; route: ScreenRoute };

function routerReducer(stack: ScreenRoute[], action: NavigationAction): ScreenRoute[] {
  switch (action.type) {
    case 'push':
      return [...stack, action.route];
    case 'pop':
      return stack.length > 1 ? stack.slice(0, -1) : stack;
    case 'replace':
      return [...stack.slice(0, -1), action.route];
    case 'reset':
      return [action.route];
  }
}

export function Router({ children, initialScreen, initialParams }: RouterProps) {
  const screenId = useRef(0);
  const routes = React.Children.toArray(children)
    .filter((child): child is React.ReactElement<ScreenProps> => React.isValidElement(child) && child.type === Screen)
    .map((child) => child.props);

  const screenNamesRef = useRef<Set<string>>(new Set());
  screenNamesRef.current = new Set(routes.map((r) => r.name));

  const assertScreen = useCallback((name: string) => {
    if (!screenNamesRef.current.has(name)) {
      throw new GigglesError(
        `Screen "${name}" is not registered. Available screens: ${[...screenNamesRef.current].join(', ')}`
      );
    }
  }, []);

  const [stack, dispatch] = useReducer(routerReducer, initialScreen, (name) => {
    if (!screenNamesRef.current.has(name)) {
      throw new GigglesError(
        `Initial screen "${name}" is not registered. Available screens: ${[...screenNamesRef.current].join(', ')}`
      );
    }
    return [{ id: screenId.current++, name, params: initialParams }];
  });
  const push = useCallback(
    (name: string, params?: Record<string, unknown>) => {
      assertScreen(name);
      dispatch({ type: 'push', route: { id: screenId.current++, name, params } });
    },
    [assertScreen]
  );
  const pop = useCallback(() => {
    dispatch({ type: 'pop' });
  }, []);
  const replace = useCallback(
    (name: string, params?: Record<string, unknown>) => {
      assertScreen(name);
      dispatch({ type: 'replace', route: { id: screenId.current++, name, params } });
    },
    [assertScreen]
  );
  const reset = useCallback(
    (name: string, params?: Record<string, unknown>) => {
      assertScreen(name);
      dispatch({ type: 'reset', route: { id: screenId.current++, name, params } });
    },
    [assertScreen]
  );

  const components = new Map<string, React.ComponentType<Record<string, unknown>>>();
  for (const route of routes) {
    components.set(route.name, route.component);
  }

  const canGoBack = stack.length > 1;

  return (
    <>
      {stack.map((entry, i) => {
        const Component = components.get(entry.name);
        if (!Component) return null;
        return (
          <ScreenEntry
            key={entry.id}
            entry={entry}
            isTop={i === stack.length - 1}
            canGoBack={canGoBack}
            component={Component}
            push={push}
            pop={pop}
            replace={replace}
            reset={reset}
          />
        );
      })}
    </>
  );
}
