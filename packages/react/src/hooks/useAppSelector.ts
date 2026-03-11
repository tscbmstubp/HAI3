/**
 * useAppSelector Hook - Type-safe selector hook
 *
 * React Layer: L3
 */
// @cpt-FEATURE:cpt-hai3-flow-react-bindings-use-selector:p1
// @cpt-FEATURE:cpt-hai3-dod-react-bindings-redux-hooks:p1

import { useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '@hai3/framework';

/**
 * Type-safe selector hook.
 *
 * @example
 * ```tsx
 * const activeScreen = useAppSelector(selectActiveScreen);
 * const menuCollapsed = useAppSelector(selectMenuCollapsed);
 * ```
 */
// @cpt-begin:cpt-hai3-flow-react-bindings-use-selector:p1:inst-1
// @cpt-begin:cpt-hai3-dod-react-bindings-redux-hooks:p1:inst-1
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// @cpt-end:cpt-hai3-flow-react-bindings-use-selector:p1:inst-1
// @cpt-end:cpt-hai3-dod-react-bindings-redux-hooks:p1:inst-1
