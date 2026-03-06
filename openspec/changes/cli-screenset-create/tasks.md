## 1. Template Pipeline: Copy MFE Template to CLI Templates

- [x] 1.1 Update `copy-templates.ts` to copy `src/mfe_packages/_blank-mfe/` source files (excluding `dist/`, `node_modules/`) to `templates/mfe-template/`
- [x] 1.2 Update `copy-templates.ts` to copy `src/mfe_packages/shared/` to `templates/mfe-shared/`
- [x] 1.3 Remove dead `src/screensets/` copy loop from `copy-templates.ts`
- [x] 1.4 Update `manifest.yaml` — remove `screensets:` and `screensetTemplate:` entries, add comments about MFE template
- [x] 1.5 Run `copy-templates.ts` and verify `templates/mfe-template/` and `templates/mfe-shared/` are created correctly

## 2. Screenset Generator

- [x] 2.1 Create `packages/cli/src/generators/screenset.ts` with `generateScreenset()` function
- [x] 2.2 Implement placeholder replacement logic: `_blank`/`_Blank`/`blank`/`blankMfe` → new name variants, port, route, GTS IDs
- [x] 2.3 Implement file rename logic for files containing `_blank`/`_Blank` in their names
- [x] 2.4 Implement bootstrap.ts update logic — add import and registration block for new MFE
- [x] 2.5 Implement port auto-assignment — scan existing `mfe_packages/*/package.json` for used ports, assign next available from 3001+

## 3. CLI Command Registration

- [x] 3.1 Create `packages/cli/src/commands/screenset/index.ts` with `hai3 screenset create` command
- [x] 3.2 Register `screenset` command group in `packages/cli/src/index.ts`
- [x] 3.3 Add name validation (camelCase, not reserved, no collision with existing MFE)

## 4. Project Generator: Demo MFE in Scaffolded Projects

- [x] 4.1 Remove the screenset copy loop from `packages/cli/src/generators/project.ts`
- [x] 4.2 When `uikit === 'shadcn'`: copy `mfe-template/` as `src/mfe_packages/demo-mfe/` with demo placeholder replacements
- [x] 4.3 Copy `mfe-shared/` directory to `src/mfe_packages/shared/` in scaffolded projects
- [x] 4.4 Create `standalone-mfe-bootstrap-with-demo.ts` template that registers the demo MFE
- [x] 4.5 Update generator to select demo-bootstrap vs empty-bootstrap based on uikit flag

## 5. Fix AI Command

- [x] 5.1 Update `packages/react/commands/hai3-new-screenset.md` — replace `.claude/commands/openspec-proposal.md` with `/opsx:new` skill reference
- [x] 5.2 Update `packages/react/commands/hai3-new-screenset.md` — replace `.claude/commands/openspec-apply.md` with `/opsx:apply` skill reference
- [x] 5.3 Replace `@hai3/uikit` references with `local shadcn/ui components`
- [x] 5.4 Update Component Plan to reference MFE package structure (`src/mfe_packages/`)
- [x] 5.5 Update task template to use `hai3 screenset create {name}` correctly

## 6. Verification

- [x] 6.1 Build CLI package — verify no TypeScript errors
- [x] 6.2 Run `copy-templates.ts` — verify MFE template and shared are in templates/
- [x] 6.3 Test `hai3 screenset create test-screenset` in the monorepo — verify MFE package created, bootstrap updated
- [x] 6.4 Test `hai3 create test-project --uikit shadcn --studio --local` — verify demo MFE included, bootstrap registers it
- [x] 6.5 Test `hai3 create test-project --uikit none --local` — verify no MFE packages included
- [x] 6.6 Clean up test artifacts
