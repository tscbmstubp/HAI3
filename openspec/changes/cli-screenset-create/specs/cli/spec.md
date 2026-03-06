# CLI Spec Delta: Screenset Create Command

## New Command: `hai3 screenset create`

### Synopsis
```
hai3 screenset create <name> [--port <port>] [--screen <name>]
```

### Arguments
- `name` (required): Screenset name in camelCase (e.g., `contacts`, `dashboard`)

### Options
- `--port <port>`: MFE dev server port (auto-assigned from 3001+ if omitted)
- `--screen <name>`: Initial screen name (default: `home`)

### Behavior
1. Validate name: camelCase, not reserved, no existing `src/mfe_packages/{name}-mfe/`
2. Copy MFE template from CLI templates
3. Apply placeholder replacements (name, port, IDs, routes)
4. Rename files with placeholder names
5. Update `src/app/mfe/bootstrap.ts` to register the new MFE
6. Print success message with next steps

### Output
```
success Created screenset '{name}' at src/mfe_packages/{name}-mfe/

Next steps:
  cd src/mfe_packages/{name}-mfe
  npm install
  npm run dev
```

## Modified: Template Pipeline

### copy-templates.ts
- Copy `_blank-mfe` source files to `templates/mfe-template/`
- Copy `mfe_packages/shared/` to `templates/mfe-shared/`
- Remove dead `src/screensets/` copy loop

### manifest.yaml
- Remove `screensets:` and `screensetTemplate:` entries
- Document MFE template approach in comments

### Project Generator
- Remove screenset copy loop
- When `uikit === 'shadcn'`: scaffold demo MFE from template + register in bootstrap
- Copy `mfe-shared/` directory to standalone projects

## Modified: AI Command

### `hai3-new-screenset` command
- Replace OpenSpec command file references with skill invocations
- Replace `@hai3/uikit` → `local shadcn/ui components`
- Update MFE package structure references
