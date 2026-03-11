/**
 * useDomainExtensions Hook - Domain extension list subscription
 *
 * Subscribes to store changes to detect when extensions are registered or unregistered,
 * and returns the current list of extensions for a domain.
 *
 * React Layer: L3
 */
// @cpt-FEATURE:cpt-hai3-flow-react-bindings-use-domain-extensions:p1
// @cpt-FEATURE:cpt-hai3-algo-react-bindings-mfe-context-guard:p1
// @cpt-FEATURE:cpt-hai3-algo-react-bindings-stable-snapshots:p1
// @cpt-FEATURE:cpt-hai3-dod-react-bindings-observation-hooks:p1

import { useSyncExternalStore, useCallback, useRef } from 'react';
import { useHAI3 } from '../../HAI3Context';
import type { Extension } from '@hai3/framework';

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for observing extensions registered for a domain.
 *
 * Subscribes to the HAI3 store to detect registration state changes,
 * and returns the current list of extensions for the specified domain.
 *
 * @param domainId - Domain ID to query extensions for
 * @returns Array of extensions currently registered for the domain
 *
 * @example
 * ```tsx
 * function SidebarExtensions() {
 *   const extensions = useDomainExtensions('gts.hai3.mfes.ext.domain.v1~hai3.screensets.layout.sidebar.v1');
 *
 *   return (
 *     <div>
 *       {extensions.map(ext => (
 *         <div key={ext.id}>{ext.id}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
// @cpt-begin:cpt-hai3-flow-react-bindings-use-domain-extensions:p1:inst-1
// @cpt-begin:cpt-hai3-algo-react-bindings-mfe-context-guard:p1:inst-6
// @cpt-begin:cpt-hai3-algo-react-bindings-stable-snapshots:p1:inst-1
// @cpt-begin:cpt-hai3-dod-react-bindings-observation-hooks:p1:inst-1
export function useDomainExtensions(domainId: string): Extension[] {
  const app = useHAI3();
  const registry = app.screensetsRegistry;

  if (!registry) {
    throw new Error(
      'useDomainExtensions requires the microfrontends plugin. ' +
      'Add microfrontends() to your HAI3 app configuration.'
    );
  }

  // Subscribe to store changes.
  // Any dispatch (including registration state updates) triggers a snapshot check.
  // The snapshot comparison ensures only actual extension list changes cause re-renders.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return app.store.subscribe(onStoreChange);
    },
    [app.store]
  );

  // Cache the snapshot to maintain referential stability for useSyncExternalStore.
  // Only update when the extension IDs actually change.
  const cacheRef = useRef<{ ids: string; extensions: Extension[] }>({ ids: '', extensions: [] });

  const getSnapshot = useCallback(() => {
    const extensions = registry.getExtensionsForDomain(domainId);
    const ids = extensions.map(e => e.id).join(',');
    if (ids !== cacheRef.current.ids) {
      cacheRef.current = { ids, extensions };
    }
    return cacheRef.current.extensions;
  }, [registry, domainId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
// @cpt-end:cpt-hai3-flow-react-bindings-use-domain-extensions:p1:inst-1
// @cpt-end:cpt-hai3-algo-react-bindings-mfe-context-guard:p1:inst-6
// @cpt-end:cpt-hai3-algo-react-bindings-stable-snapshots:p1:inst-1
// @cpt-end:cpt-hai3-dod-react-bindings-observation-hooks:p1:inst-1
