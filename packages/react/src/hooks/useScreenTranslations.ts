/**
 * useScreenTranslations Hook - Screen-level translation loading
 *
 * React Layer: L3
 */
// @cpt-FEATURE:cpt-hai3-flow-react-bindings-use-screen-translations:p1
// @cpt-FEATURE:cpt-hai3-algo-react-bindings-load-screen-translations:p1
// @cpt-FEATURE:cpt-hai3-state-react-bindings-screen-translation:p1
// @cpt-FEATURE:cpt-hai3-dod-react-bindings-screen-translation-hook:p1

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import type { TranslationMap, TranslationLoader } from '@hai3/framework';
import { useHAI3 } from '../HAI3Context';
import type { UseScreenTranslationsReturn } from '../types';

// Re-export TranslationMap for consumers who need it
export type { TranslationMap };

/**
 * Check if the input is a TranslationLoader function (from I18nRegistry.createLoader)
 * vs a TranslationMap object
 */
function isTranslationLoader(
  input: TranslationMap | TranslationLoader
): input is TranslationLoader {
  return typeof input === 'function';
}

/**
 * Hook for loading screen-level translations.
 * Use this in screen components to lazy-load translations.
 * Automatically reloads translations when language changes.
 *
 * @param screensetId - The screenset ID
 * @param screenId - The screen ID
 * @param translations - Either a TranslationMap object or a TranslationLoader function
 *   (from I18nRegistry.createLoader)
 * @returns Loading state
 *
 * @example
 * ```tsx
 * // Option 1: Using I18nRegistry.createLoader (recommended)
 * const translations = I18nRegistry.createLoader({
 *   en: () => import('./i18n/en.json'),
 *   es: () => import('./i18n/es.json'),
 * });
 *
 * // Option 2: Using raw TranslationMap
 * const translations = {
 *   en: () => import('./i18n/en.json'),
 *   es: () => import('./i18n/es.json'),
 * };
 *
 * export const HomeScreen: React.FC = () => {
 *   const { isLoaded, error } = useScreenTranslations(
 *     'demo',
 *     'home',
 *     translations
 *   );
 *
 *   if (!isLoaded) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return <div>...</div>;
 * };
 * ```
 */
// @cpt-begin:cpt-hai3-flow-react-bindings-use-screen-translations:p1:inst-1
// @cpt-begin:cpt-hai3-algo-react-bindings-load-screen-translations:p1:inst-1
// @cpt-begin:cpt-hai3-state-react-bindings-screen-translation:p1:inst-1
// @cpt-begin:cpt-hai3-dod-react-bindings-screen-translation-hook:p1:inst-1
export function useScreenTranslations(
  screensetId: string,
  screenId: string,
  translations: TranslationMap | TranslationLoader
): UseScreenTranslationsReturn {
  const app = useHAI3();
  const { i18nRegistry } = app;

  // Track loading state per language to handle language changes
  const [loadedLanguage, setLoadedLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to translation changes using useSyncExternalStore
  // This ensures we reload when language changes
  const version = useSyncExternalStore(
    useCallback(
      (callback: () => void) => i18nRegistry.subscribe(callback),
      [i18nRegistry]
    ),
    () => i18nRegistry.getVersion(),
    () => i18nRegistry.getVersion()
  );

  // Get current language (changes when version changes)
  // version is used to trigger recalculation when translations change
  const currentLanguage = useMemo(() => {
    void version; // Trigger recalculation when version changes
    return i18nRegistry.getLanguage();
  }, [i18nRegistry, version]);

  // Create a TranslationLoader function from the translation map or use directly if already a loader
  const loader: TranslationLoader = useMemo(() => {
    if (isTranslationLoader(translations)) {
      // Already a loader function (from I18nRegistry.createLoader)
      return translations;
    }

    // Convert TranslationMap to TranslationLoader
    return async (language: string) => {
      const importFn = translations[language as keyof typeof translations];
      if (!importFn) {
        // Return empty dictionary if language not in map
        return {};
      }
      const module = await importFn();
      return module.default;
    };
  }, [translations]);

  useEffect(() => {
    // Skip if no language or already loaded for this language
    if (!currentLanguage || currentLanguage === loadedLanguage) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const loadTranslations = async () => {
      try {
        const namespace = `screen.${screensetId}.${screenId}`;

        // Register the loader for future language changes
        i18nRegistry.registerLoader(namespace, loader);

        // Actually load the translations for current language
        const loadedTranslations = await loader(currentLanguage);
        i18nRegistry.register(namespace, currentLanguage, loadedTranslations);

        if (!cancelled) {
          setLoadedLanguage(currentLanguage);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [screensetId, screenId, loader, i18nRegistry, currentLanguage, loadedLanguage]);

  // Derive isLoaded from whether we've loaded translations for the current language
  const isLoaded = currentLanguage !== null && currentLanguage === loadedLanguage && !isLoading;

  return { isLoaded, error };
}
// @cpt-end:cpt-hai3-flow-react-bindings-use-screen-translations:p1:inst-1
// @cpt-end:cpt-hai3-algo-react-bindings-load-screen-translations:p1:inst-1
// @cpt-end:cpt-hai3-state-react-bindings-screen-translation:p1:inst-1
// @cpt-end:cpt-hai3-dod-react-bindings-screen-translation-hook:p1:inst-1
