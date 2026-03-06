## 1. Type and Interface Updates

- [x] 1.1 Update `CreateCommandArgs.uikit` type from `'hai3' | 'none'` to `'shadcn' | 'none'` in `packages/cli/src/commands/create/index.ts`
- [x] 1.2 Update `ProjectGeneratorInput.uikit` type from `'hai3' | 'none'` to `'shadcn' | 'none'` in `packages/cli/src/generators/project.ts`
- [x] 1.3 Update `Hai3Config.uikit` comment to reflect `'shadcn' | 'none'` in `packages/cli/src/core/types.ts`

## 2. Create Command Updates

- [x] 2.1 Change `choices` from `['hai3', 'none']` to `['shadcn', 'none']` in command option definition in `packages/cli/src/commands/create/index.ts`
- [x] 2.2 Update interactive prompt choices: `'HAI3 UIKit (@hai3/uikit)'` → `'shadcn/ui (locally-owned components)'` and default from `'hai3'` → `'shadcn'`
- [x] 2.3 Update `uikit === 'none'` message from "Demo screenset excluded (requires @hai3/uikit)" to "Demo screenset excluded (no UI components)"

## 3. Project Generator Updates

- [x] 3.1 Replace all `uikit === 'hai3'` conditionals with `uikit === 'shadcn'` in `packages/cli/src/generators/project.ts`
- [x] 3.2 Change default from `uikit = 'hai3'` to `uikit = 'shadcn'`
- [x] 3.3 Remove `@hai3/uikit` from dependencies when `uikit === 'shadcn'`
- [x] 3.4 Remove `generate:colors` script and its wiring from `dev`, `build`, `type-check` npm scripts
- [x] 3.5 Remove `src/app/uikit/` and `src/app/themes/` from template directories list
- [x] 3.6 Add `src/app/components/ui/` to template directories when `uikit === 'shadcn'`
- [x] 3.7 Update layout template source path from `layout/hai3-uikit/` to `layout/shadcn/`
- [x] 3.8 Add `components.json` to root config files list when `uikit === 'shadcn'`

## 4. Template Variant Renaming

- [x] 4.1 Rename `src/app/main.no-uikit.tsx` to `src/app/main.no-ui.tsx` in monorepo root
- [x] 4.2 Rename `src/app/App.no-uikit.tsx` to `src/app/App.no-ui.tsx` in monorepo root
- [x] 4.3 Rename `src/app/App.no-uikit.no-studio.tsx` to `src/app/App.no-ui.no-studio.tsx` in monorepo root
- [x] 4.4 Update all variant file references in `packages/cli/src/generators/project.ts`
- [x] 4.5 Update `packages/cli/template-sources/manifest.yaml` file list to use `.no-ui` naming

## 5. Layout Template Rewrites

- [x] 5.1 Update `src/app/layout/Header.tsx` — replace `@hai3/uikit` `UserInfo` import with local shadcn `Avatar` component
- [x] 5.2 Update `src/app/layout/Menu.tsx` — replace `@hai3/uikit` Sidebar imports with local shadcn sidebar component imports from `@/app/components/ui/sidebar`
- [x] 5.3 Verify `src/app/layout/Sidebar.tsx`, `Layout.tsx`, `Footer.tsx`, `Screen.tsx`, `Popup.tsx`, `Overlay.tsx` have no `@hai3/uikit` imports (update if needed)
- [x] 5.4 Update `src/app/layout/index.ts` barrel exports if any names changed

## 6. Template Assembly Updates

- [x] 6.1 Update `packages/cli/template-sources/manifest.yaml` — change layout source from `../../src/app/layout/` to shadcn layout path, remove `src/app/uikit` and `src/app/themes` from directories
- [x] 6.2 Add `src/app/components/ui` to directories list in manifest
- [x] 6.3 Add `components.json` to root files list in manifest
- [x] 6.4 Update `copy-templates.ts` if it has hardcoded references to `hai3-uikit` or `@hai3/uikit`

## 7. Main/App Template Updates

- [x] 7.1 Update `src/app/main.tsx` default variant to not import from `@hai3/uikit` (use shadcn CSS variable approach)
- [x] 7.2 Update `src/app/App.tsx` default variant to remove any `@hai3/uikit` references
- [x] 7.3 Update `src/app/App.no-studio.tsx` to remove any `@hai3/uikit` references

## 8. Verification

- [x] 8.1 Build CLI package (`npm run build` in packages/cli) — verify no TypeScript errors
- [x] 8.2 Run `hai3 create test-project --local` and verify scaffolded project has shadcn components, no `@hai3/uikit` references
- [x] 8.3 Run `hai3 create test-project --uikit none --local` and verify bare project scaffolds correctly
