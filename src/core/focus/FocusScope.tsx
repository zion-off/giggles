import React from 'react';
import { ScopeIdContext } from './StoreContext';
import type { FocusScopeHandle } from './useFocusScope';

type FocusScopeProps = {
  handle: FocusScopeHandle;
  children: React.ReactNode;
};

// Sets ScopeIdContext so that child components can discover their parent scope
// implicitly via useContext(ScopeIdContext), without having to pass the handle
// explicitly through props.
//
// Every useFocusScope call must have a corresponding <FocusScope> in the render
// output. Without it, children register under the grandparent scope and
// navigation silently breaks.
//
// A handle must not be passed to more than one <FocusScope> at a time.
export function FocusScope({ handle, children }: FocusScopeProps) {
  return <ScopeIdContext.Provider value={handle.id}>{children}</ScopeIdContext.Provider>;
}
