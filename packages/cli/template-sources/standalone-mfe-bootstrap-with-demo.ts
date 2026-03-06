/**
 * MFE Bootstrap (standalone project template with demo MFE)
 *
 * Registers MFE domains, the demo MFE, and URL routing.
 * This file is imported in main.tsx via MfeScreenContainer.
 */

import type { HAI3App } from '@hai3/react';
import {
  screenDomain,
  sidebarDomain,
  popupDomain,
  overlayDomain,
  HAI3_ACTION_MOUNT_EXT,
  HAI3_SHARED_PROPERTY_THEME,
  HAI3_SHARED_PROPERTY_LANGUAGE,
  RefContainerProvider,
} from '@hai3/react';
import demoMfeConfig from '@/mfe_packages/demo-mfe/mfe.json';

/**
 * DetachedContainerProvider for domains without a visible host element.
 */
class DetachedContainerProvider extends RefContainerProvider {
  constructor() {
    const detachedElement = document.createElement('div');
    super({ current: detachedElement });
  }
}

/**
 * Bootstrap MFE system for the host application.
 * Registers the four extension domains, the demo MFE, and URL routing.
 *
 * @param app - HAI3 application instance
 * @param screenContainerRef - React ref for the screen domain container element
 */
export async function bootstrapMFE(
  app: HAI3App,
  screenContainerRef: React.RefObject<HTMLDivElement>
): Promise<void> {
  const { screensetsRegistry } = app;

  if (!screensetsRegistry) {
    throw new Error('[MFE Bootstrap] screensetsRegistry is not available on app instance');
  }

  // Register all 4 extension domains
  const screenContainerProvider = new RefContainerProvider(screenContainerRef);
  screensetsRegistry.registerDomain(screenDomain, screenContainerProvider);

  const sidebarContainerProvider = new DetachedContainerProvider();
  screensetsRegistry.registerDomain(sidebarDomain, sidebarContainerProvider);

  const popupContainerProvider = new DetachedContainerProvider();
  screensetsRegistry.registerDomain(popupDomain, popupContainerProvider);

  const overlayContainerProvider = new DetachedContainerProvider();
  screensetsRegistry.registerDomain(overlayDomain, overlayContainerProvider);

  // Initialize domain shared properties (theme and language)
  const domainIds = [screenDomain.id, sidebarDomain.id, popupDomain.id, overlayDomain.id];
  const currentThemeId = app.themeRegistry?.getCurrent()?.id ?? 'default';

  for (const domainId of domainIds) {
    screensetsRegistry.updateDomainProperty(domainId, HAI3_SHARED_PROPERTY_THEME, currentThemeId);
    screensetsRegistry.updateDomainProperty(domainId, HAI3_SHARED_PROPERTY_LANGUAGE, 'en');
  }

  // Register Demo MFE manifest
  screensetsRegistry.typeSystem.register(demoMfeConfig.manifest);

  // Register Demo MFE entries
  for (const entry of demoMfeConfig.entries) {
    screensetsRegistry.typeSystem.register({ ...entry, manifest: demoMfeConfig.manifest });
  }

  // Register Demo MFE extensions
  for (const extension of demoMfeConfig.extensions) {
    await screensetsRegistry.registerExtension(extension);
  }

  // Standalone: no mfe.json or extensions registered here.
  // Register your MFE manifests and extensions, then mount as needed.

  // Mount the extension matching the current URL, or the default (first)
  const screenExtensions = demoMfeConfig.extensions as Array<{
    id: string;
    presentation: { route: string };
  }>;
  const currentPath = window.location.pathname;
  const matchingExt = screenExtensions.find((ext) => ext.presentation.route === currentPath);
  const targetExtId = matchingExt?.id ?? screenExtensions[0].id;

  await screensetsRegistry.executeActionsChain({
    action: {
      type: HAI3_ACTION_MOUNT_EXT,
      target: screenDomain.id,
      payload: { extensionId: targetExtId },
    },
  });

  if (!matchingExt) {
    window.history.replaceState(null, '', screenExtensions[0].presentation.route);
  }

  // URL routing: sync browser URL on every screen mount
  const screenRouteMap = new Map(screenExtensions.map((ext) => [ext.id, ext.presentation.route]));
  const origExecuteActionsChain = screensetsRegistry.executeActionsChain.bind(screensetsRegistry);
  screensetsRegistry.executeActionsChain = (async (chain: Parameters<typeof origExecuteActionsChain>[0]) => {
    await origExecuteActionsChain(chain);
    if (chain.action.type === HAI3_ACTION_MOUNT_EXT && chain.action.target === screenDomain.id) {
      const extensionId = chain.action.payload?.extensionId as string | undefined;
      const route = screenRouteMap.get(extensionId ?? '');
      if (route && window.location.pathname !== route) {
        window.history.pushState(null, '', route);
      }
    }
  }) as typeof screensetsRegistry.executeActionsChain;

  window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    const ext = screenExtensions.find((e) => e.presentation.route === path);
    if (ext) {
      screensetsRegistry.executeActionsChain({
        action: {
          type: HAI3_ACTION_MOUNT_EXT,
          target: screenDomain.id,
          payload: { extensionId: ext.id },
        },
      });
    }
  });
}
