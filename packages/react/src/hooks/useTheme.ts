/**
 * useTheme Hook - Theme utilities
 *
 * React Layer: L3
 */
// @cpt-FEATURE:cpt-hai3-flow-react-bindings-use-theme:p1
// @cpt-FEATURE:cpt-hai3-dod-react-bindings-theme-hook:p1

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useHAI3 } from '../HAI3Context';
import type { UseThemeReturn } from '../types';

/**
 * Hook for theme utilities.
 *
 * @returns Theme utilities
 *
 * @example
 * ```tsx
 * const { currentTheme, themes, setTheme } = useTheme();
 *
 * return (
 *   <select
 *     value={currentTheme}
 *     onChange={(e) => setTheme(e.target.value)}
 *   >
 *     {themes.map((theme) => (
 *       <option key={theme.id} value={theme.id}>
 *         {theme.name}
 *       </option>
 *     ))}
 *   </select>
 * );
 * ```
 */
// @cpt-begin:cpt-hai3-flow-react-bindings-use-theme:p1:inst-1
// @cpt-begin:cpt-hai3-dod-react-bindings-theme-hook:p1:inst-1
export function useTheme(): UseThemeReturn {
  const app = useHAI3();
  const { themeRegistry } = app;

  // Subscribe to theme changes using useSyncExternalStore
  // Uses version counter to trigger re-renders when theme changes
  const version = useSyncExternalStore(
    useCallback(
      (callback: () => void) => {
        return themeRegistry.subscribe(callback);
      },
      [themeRegistry]
    ),
    () => themeRegistry.getVersion(),
    () => themeRegistry.getVersion()
  );

  // Get current theme (memoized, recalculates on version change)
  const currentTheme = useMemo(() => {
    // Reference version to trigger recalculation on theme change
    void version;
    const theme = themeRegistry.getCurrent();
    return theme?.id;
  }, [themeRegistry, version]);

  // Get all themes
  const themes = useMemo(() => {
    return themeRegistry.getAll().map((theme) => ({
      id: theme.id,
      name: theme.name,
    }));
  }, [themeRegistry]);

  // Set theme
  const setTheme = useCallback(
    (themeId: string) => {
      if (app.actions.changeTheme) {
        app.actions.changeTheme({ themeId });
      }
    },
    [app.actions]
  );

  return {
    currentTheme,
    themes,
    setTheme,
  };
}
// @cpt-end:cpt-hai3-flow-react-bindings-use-theme:p1:inst-1
// @cpt-end:cpt-hai3-dod-react-bindings-theme-hook:p1:inst-1
