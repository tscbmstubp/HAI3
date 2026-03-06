## Why

The `@hai3/uikit` package is being deprecated in favor of locally-owned shadcn/ui components (per `pure-shadcn-theming` and `pure-shadcn-table-screenset` changes). The `hai3 create` CLI still offers `@hai3/uikit` as the default UI kit option. This needs to be updated so new projects scaffold with shadcn components instead.

## What Changes

- **BREAKING**: Remove `'hai3'` choice from `uikit` option in `hai3 create` command
- Add `'shadcn'` choice as the new default for `uikit` option
- Update type `uikit: 'hai3' | 'none'` to `uikit: 'shadcn' | 'none'` across all types (`CreateCommandArgs`, `ProjectGeneratorInput`, `Hai3Config`)
- Scaffold `components/ui/` with starter shadcn components when `uikit=shadcn`
- Add `components.json` (shadcn config) to project template
- Rewrite layout templates (`Header`, `Footer`, `Menu`, `Sidebar`, etc.) to use shadcn components instead of `@hai3/uikit`
- Remove `@hai3/uikit` from generated `package.json` dependencies
- Remove `generate:colors` script and its wiring in `dev`/`build`/`type-check` npm scripts
- Remove `src/app/uikit/` and `src/app/themes/` from template directories
- Rename template variants: `.no-uikit.tsx` becomes `.no-ui.tsx`
- Update prompt text: "HAI3 UIKit (@hai3/uikit)" becomes "shadcn/ui (locally-owned components)"
- Update demo screenset exclusion message for `uikit=none`

## Capabilities

### New Capabilities

(none - this modifies existing CLI behavior)

### Modified Capabilities

- `cli`: The `create` command's `uikit` option changes from `'hai3' | 'none'` to `'shadcn' | 'none'`, altering project scaffolding output (dependencies, templates, layout, scripts)

## Impact

- **@hai3/cli package**: `commands/create/index.ts`, `generators/project.ts`, `core/types.ts`
- **Template sources**: `manifest.yaml`, layout templates, App/main variants, new shadcn component templates
- **Template assembly**: `copy-templates.ts` must handle new shadcn sources and drop uikit sources
- **Generated projects**: New projects will no longer depend on `@hai3/uikit`; existing projects are unaffected (migration is a separate concern)
- **Registries**: `uikitRegistry` initialization in scaffolded apps changes since `@hai3/uikit` is no longer a dependency
- **Risk**: Low - this is a forward-only change aligned with the pure-shadcn migration. No rollback needed since `@hai3/uikit` remains available on npm for existing projects.
