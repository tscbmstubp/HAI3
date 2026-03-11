/**
 * HAI3 Context - React context for HAI3 application
 *
 * React Layer: L3 (Depends on @hai3/framework)
 */
// @cpt-FEATURE:cpt-hai3-flow-react-bindings-use-hai3:p2
// @cpt-FEATURE:cpt-hai3-algo-react-bindings-mfe-context-guard:p1

import { createContext, useContext } from 'react';
import type { HAI3App } from '@hai3/framework';

// ============================================================================
// Context Definition
// ============================================================================

/**
 * HAI3 Context
 * Holds the HAI3 app instance for the application.
 */
export const HAI3Context = createContext<HAI3App | null>(null);

/**
 * Use the HAI3 context.
 * Throws if used outside of HAI3Provider.
 *
 * @returns The HAI3 app instance
 */
// @cpt-begin:cpt-hai3-flow-react-bindings-use-hai3:p2:inst-1
// @cpt-begin:cpt-hai3-algo-react-bindings-mfe-context-guard:p1:inst-1
export function useHAI3(): HAI3App {
  const context = useContext(HAI3Context);

  if (!context) {
    throw new Error(
      'useHAI3 must be used within a HAI3Provider. ' +
      'Wrap your application with <HAI3Provider> to access HAI3 features.'
    );
  }

  return context;
}
// @cpt-end:cpt-hai3-flow-react-bindings-use-hai3:p2:inst-1
// @cpt-end:cpt-hai3-algo-react-bindings-mfe-context-guard:p1:inst-1
