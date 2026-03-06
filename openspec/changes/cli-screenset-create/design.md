# Design: `hai3 screenset create` CLI Command

## Architecture Overview

Screensets are MFE (Microfrontend) packages under `src/mfe_packages/{name}-mfe/`. Each is an independently-built Vite + Module Federation package with its own `mfe.json`, `lifecycle.tsx`, screens, and i18n.

The `_blank-mfe` template at `src/mfe_packages/_blank-mfe/` serves as the source template for creating new screensets.

## Component A: `hai3 screenset create <name>` Command

### Command Interface

```
hai3 screenset create <name> [options]
  --port <port>    MFE dev server port (auto-assigned if omitted)
  --screen <name>  Initial screen name (default: "home")
```

### Screenset Generator (`packages/cli/src/generators/screenset.ts`)

**Input:** `{ name: string, port: number, screen: string, projectRoot: string }`

**Steps:**
1. Validate name (camelCase, not reserved, no collision with existing)
2. Copy `_blank-mfe` template from CLI templates to `src/mfe_packages/{name}-mfe/`
3. Apply placeholder replacements across all files:
   - `_blank` → `{name}` (lowercase)
   - `_Blank` → `{Name}` (PascalCase)
   - `blank` → `{name}` (camelCase in IDs)
   - `blankMfe` → `{name}Mfe` (federation name)
   - `@hai3/blank-mfe` → `@hai3/{name}-mfe` (package name)
   - Port `3099` → assigned port
   - Route `/blank-home` → `/{kebab-name}-home`
   - Label `Blank Home` → `{Name} Home`
   - GTS IDs: `hai3.blank.` → `hai3.{name}.`
4. Rename files containing `_blank`/`_Blank` in their names
5. Update `src/app/mfe/bootstrap.ts` to import and register the new MFE

### Bootstrap Update Strategy

Append to `bootstrap.ts`:
```typescript
import {nameCase}MfeConfig from '@/mfe_packages/{name}-mfe/mfe.json';
```
And in the `bootstrapMFE` function, add registration block before the mount step.

### Port Assignment

- Scan existing `mfe_packages/*/package.json` for used ports
- Start from 3100, increment until finding an unused port
- In standalone projects (no existing MFEs), start from 3001

## Component B: Template Pipeline Fix

### copy-templates.ts Changes

- Copy `src/mfe_packages/_blank-mfe/src/` (source only, no `dist/`, no `node_modules/`) into `templates/mfe-template/`
- Also copy `_blank-mfe/package.json`, `vite.config.ts`, `mfe.json`, `tsconfig.json`, `index.html`
- Copy `src/mfe_packages/shared/` (shared utilities like `vite-plugin-hai3-externalize.ts`, `ThemeAwareReactLifecycle.tsx`)

### manifest.yaml Changes

- Remove `screensets:` and `screensetTemplate:` entries (obsolete)
- Add `mfeTemplate: _blank-mfe` reference

### Project Generator Changes

- Remove the screenset copy loop (`for (const screenset of screensets)`)
- When `uikit === 'shadcn'`: copy `mfe-template/` as `src/mfe_packages/demo-mfe/` with placeholder replacements applied (name=demo)
- Copy `mfe_packages/shared/` directory
- Use the demo-specific standalone bootstrap template that registers the demo MFE

### Standalone Bootstrap Template

Create `standalone-mfe-bootstrap-with-demo.ts` that includes demo MFE registration. The generator selects this when `uikit === 'shadcn'` (i.e., demo screenset is included).

## Component C: Fix `hai3-new-screenset` AI Command

### File: `packages/react/commands/hai3-new-screenset.md`

Changes:
- Replace `.claude/commands/openspec-proposal.md` → `/opsx:new` skill
- Replace `.claude/commands/openspec-apply.md` → `/opsx:apply` skill
- Replace `@hai3/uikit` references → `local shadcn/ui components`
- Update Component Plan to reference MFE package structure
- Update task template to use `hai3 screenset create {name}`

## File Structure: New MFE Package (Output)

```
src/mfe_packages/{name}-mfe/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── mfe.json
├── index.html
├── src/
│   ├── lifecycle.tsx
│   ├── init.ts
│   ├── shared/
│   │   ├── ThemeAwareReactLifecycle.tsx
│   │   └── useScreenTranslations.ts
│   ├── screens/
│   │   └── home/
│   │       ├── HomeScreen.tsx
│   │       └── i18n/ (36 language files)
│   ├── slices/
│   ├── effects/
│   ├── events/
│   ├── actions/
│   ├── api/
│   ├── components/ui/
│   └── lib/utils.ts
```

## Key Decisions

1. **Template stored in CLI templates, not runtime copy** — The generator reads from `templates/mfe-template/`, not from the monorepo's live `_blank-mfe`. This ensures scaffolded projects get a stable snapshot.

2. **Shared utilities copied per-MFE** — `ThemeAwareReactLifecycle.tsx` and `useScreenTranslations.ts` are inside each MFE's `src/shared/`. For standalone projects, also copy the `shared/` directory with `vite-plugin-hai3-externalize.ts`.

3. **Single-screen default** — New screensets start with one screen. Users add more screens manually or via `/hai3-new-screen`.

4. **Bootstrap auto-update** — The CLI modifies `bootstrap.ts` directly using AST-free string insertion (find the mount section marker, insert registration above it).
