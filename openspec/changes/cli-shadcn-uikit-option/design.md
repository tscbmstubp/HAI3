## Context

The `hai3 create` CLI scaffolds new projects. Currently it offers `uikit: 'hai3' | 'none'` where `'hai3'` adds `@hai3/uikit` as a dependency and scaffolds layout components that import from it (e.g., `Sidebar`, `SidebarMenu`, `UserInfo` from `@hai3/uikit`).

With `pure-shadcn-theming` and `pure-shadcn-table-screenset` completed, the monorepo app already uses locally-owned shadcn components. The CLI must now scaffold this pattern for new projects instead of the deprecated `@hai3/uikit`.

Key files:
- `packages/cli/src/commands/create/index.ts` — command definition, prompts
- `packages/cli/src/generators/project.ts` — file generation, dependencies, scripts
- `packages/cli/src/core/types.ts` — `Hai3Config` type
- `packages/cli/template-sources/manifest.yaml` — template assembly config
- `src/app/layout/` — layout templates (Header, Footer, Menu, Sidebar, etc.)

## Goals / Non-Goals

**Goals:**
- New projects scaffold with shadcn/ui components by default
- Layout templates work without any `@hai3/uikit` imports
- Clean removal of all `@hai3/uikit` references from the create flow
- `uikit: 'none'` continues to work for developers who want a bare project

**Non-Goals:**
- Migrating existing projects from `@hai3/uikit` to shadcn (separate concern)
- Removing `@hai3/uikit` package from the monorepo
- Changing `hai3 update` or `hai3 migrate` commands

## Decisions

### D1: Type change — `'shadcn' | 'none'`

Replace `'hai3' | 'none'` with `'shadcn' | 'none'` everywhere. No backward-compat shim — this is a clean break. The `Hai3Config.uikit` field in `hai3.config.json` will store `'shadcn'` or `'none'`.

**Why not keep `'hai3'` as deprecated?** No existing projects use the CLI to re-scaffold. The config file is a marker, not a runtime dependency. Clean break is simpler.

### D2: Layout templates — rewrite imports to local shadcn components

Current layout templates import from `@hai3/uikit`:
```tsx
import { Sidebar, SidebarContent, SidebarMenu, ... } from '@hai3/uikit';
import { UserInfo } from '@hai3/uikit';
```

New templates will import from local `@/app/components/ui/`:
```tsx
import { Sidebar, SidebarContent, SidebarMenu, ... } from '@/app/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
```

The layout component logic stays identical — only imports change. `UserInfo` gets inlined as an `Avatar` + display name pattern since it's a simple composite.

Layout source in `manifest.yaml` changes from `../../src/app/layout/` to a new `layout/shadcn/` directory under `template-sources/` (or directly from the monorepo `src/app/layout/` once those files are updated).

### D3: Starter shadcn components — copy from monorepo `src/app/components/ui/`

When `uikit=shadcn`, scaffold includes `src/app/components/ui/` with the shadcn components needed by the layout and demo screenset. Source these from the monorepo's own `src/app/components/ui/` directory (same approach as current layout template copying).

Also include `components.json` at project root (shadcn CLI config).

### D4: Remove `generate:colors` — CSS variables only

The `generate:colors` script reads `@hai3/uikit` theme tokens and writes a Tailwind plugin. With shadcn, theming is pure CSS custom properties in `globals.css`. No build-time generation needed.

Remove from npm scripts: `dev`, `build`, `type-check` no longer run `generate:colors` as a prerequisite. Remove the `scripts/generate-colors.ts` template.

### D5: Template variant renaming — `.no-uikit` → `.no-ui`

Rename variant files:
- `main.no-uikit.tsx` → `main.no-ui.tsx`
- `App.no-uikit.tsx` → `App.no-ui.tsx`
- `App.no-uikit.no-studio.tsx` → `App.no-ui.no-studio.tsx`

Update all references in `project.ts` and `manifest.yaml`.

### D6: Remove `src/app/uikit/` and `src/app/themes/` from template directories

These directories in `manifest.yaml` are only relevant to `@hai3/uikit`. With shadcn, theming lives in CSS files and `tailwind.config.ts`. Remove them from the `directories` list.

## Risks / Trade-offs

- **[Breaking change for CLI users]** → Anyone running `hai3 create` after this change gets shadcn instead of uikit. This is intentional — the migration is one-directional. Existing projects on `@hai3/uikit` are unaffected.
- **[Shadcn components must exist in monorepo first]** → The `pure-shadcn-theming` change already added these components. No additional risk.
- **[Layout template divergence]** → The monorepo `src/app/layout/` files serve as template sources. If they're updated for shadcn (which they should be as part of pure-shadcn-theming), the CLI copies them directly. If not yet updated, we need new template variants under `template-sources/`.
