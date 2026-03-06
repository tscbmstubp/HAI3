# Proposal: Implement `hai3 screenset create` CLI Command

## Summary

Implement the `hai3 screenset create <name>` CLI command and fix the broken screenset scaffolding pipeline. The old `src/screensets/` directory approach was removed when screensets were converted to MFE packages (`src/mfe_packages/`), but the CLI was never updated. This change restores the ability to scaffold new screensets as MFE packages and fixes the `hai3-new-screenset` AI command.

## Problem

1. **`hai3 screenset create` doesn't exist** — Referenced in CLI output and AI commands but never implemented
2. **No demo screenset in scaffolded projects** — `src/screensets/demo` no longer exists (moved to `src/mfe_packages/demo-mfe/`), so the CLI silently produces projects with no screens
3. **`hai3-new-screenset` AI command broken** — References deleted `.claude/commands/openspec-proposal.md` and `openspec-apply.md`, plus stale `@hai3/uikit` references
4. **Template pipeline references dead paths** — Manifest lists `screensets: [demo]` and `screensetTemplate: _blank`, but `src/screensets/` doesn't exist

## Solution

### A. Implement `hai3 screenset create <name>` CLI command

New command that scaffolds an MFE package from the `_blank-mfe` template:
- Copies `_blank-mfe` template to `src/mfe_packages/{name}-mfe/`
- Renames all `_blank`/`_Blank`/`blank` placeholders to the user's screenset name
- Updates `mfe.json` IDs with the new namespace
- Updates `package.json` name, port (auto-assign)
- Updates `vite.config.ts` federation name
- Adds import + registration to `src/app/mfe/bootstrap.ts`

### B. Fix template pipeline for demo screenset

- Copy `_blank-mfe` (source files only, no `dist/`) into templates as the screenset template
- Update manifest to reference `mfe_packages` instead of `screensets`
- Update generator to copy MFE package instead of screenset directory
- Update standalone bootstrap template to register the demo MFE when included

### C. Fix `hai3-new-screenset` AI command

- Replace references to deleted `openspec-proposal.md`/`openspec-apply.md` with current OpenSpec skills (`/opsx:new`, `/opsx:apply`)
- Replace `@hai3/uikit` references with `local shadcn/ui components`
- Update `hai3 screenset create` usage to match the actual implemented command

## Scope

- `packages/cli/src/commands/screenset/` — New CLI command
- `packages/cli/src/index.ts` — Register command
- `packages/cli/src/generators/screenset.ts` — MFE package scaffolding logic
- `packages/cli/scripts/copy-templates.ts` — Copy `_blank-mfe` to templates
- `packages/cli/template-sources/manifest.yaml` — Update screenset references
- `packages/cli/src/generators/project.ts` — Update to copy MFE packages
- `packages/react/commands/hai3-new-screenset.md` — Fix AI command
- `packages/cli/template-sources/standalone-mfe-bootstrap.ts` — Template with demo MFE

## Out of Scope

- Multi-screen MFE scaffolding (start with single-screen, users add screens manually)
- MFE build/deploy pipeline changes
- Changes to the MFE runtime or federation setup
