## MODIFIED Requirements

### Requirement: UIKit Option for Project Creation

The CLI SHALL provide a `--uikit` option for the `hai3 create` command that controls whether shadcn/ui components are included in generated projects.

#### Scenario: UIKit option definition

**Given** the `hai3 create` command definition
**When** examining available options
**Then** the system SHALL provide:
- Option name: `uikit`
- Type: string
- Choices: `['shadcn', 'none']`
- Default: `'shadcn'`
- Description: "UI components ('shadcn' for shadcn/ui, 'none' for no UI components)"

#### Scenario: Default behavior

**Given** a developer running `hai3 create my-app` without `--uikit` flag
**When** the command executes
**Then** the system SHALL:
- Use default value `'shadcn'`
- NOT include `@hai3/uikit` in package.json dependencies
- Copy shadcn component files to `src/app/components/ui/`
- Copy layout templates that import from `@/app/components/ui/` to `src/app/layout/`
- Include `components.json` (shadcn CLI config) at project root

#### Scenario: UIKit excluded

**Given** a developer running `hai3 create my-app --uikit none`
**When** the command executes
**Then** the system SHALL:
- NOT copy shadcn component files to `src/app/components/ui/`
- NOT copy layout templates
- Display info message: "Demo screenset excluded (no UI components). Create your own screenset with `hai3 screenset create`."

#### Scenario: Interactive UIKit selection

**Given** a developer running `hai3 create my-app` in interactive mode without `--uikit` flag
**When** prompting for configuration
**Then** the system SHALL prompt:
- Question: "Select UI components:"
- Type: select
- Choices:
  - `{ value: 'shadcn', label: 'shadcn/ui (locally-owned components)' }`
  - `{ value: 'none', label: 'None (implement your own)' }`
- Default: `'shadcn'`

#### Scenario: UIKit dependency removal

**Given** the `generateProject()` function
**When** generating package.json with `uikit: 'shadcn'`
**Then** dependencies SHALL NOT include `@hai3/uikit`

**And Given** generating package.json with `uikit: 'none'`
**Then** dependencies SHALL NOT include `@hai3/uikit`

#### Scenario: Layout template conditional copying

**Given** the `generateProject()` function
**When** `uikit` parameter is `'shadcn'`
**Then** the system SHALL copy layout files to `src/app/layout/` that import from `@/app/components/ui/` (not from `@hai3/uikit`)

**And Given** `uikit` parameter is `'none'`
**Then** the system SHALL NOT copy any layout files

#### Scenario: Template variant naming

**Given** the project template variants
**When** generating files based on `uikit` option
**Then** the system SHALL use these variant file names:
- `main.tsx` — shadcn version (default)
- `main.no-ui.tsx` — none version
- `App.tsx` — shadcn + studio
- `App.no-studio.tsx` — shadcn, no studio
- `App.no-ui.tsx` — none + studio
- `App.no-ui.no-studio.tsx` — none, no studio

#### Scenario: Generate colors script removal

**Given** the `generateProject()` function
**When** generating package.json scripts
**Then** the system SHALL NOT include `generate:colors` script
**And** `dev` script SHALL be `'vite'` (not prefixed with `npm run generate:colors &&`)
**And** `build` script SHALL be `'vite build'` (not prefixed with `npm run generate:colors &&`)
**And** `type-check` script SHALL be `'tsc --noEmit'` (not prefixed with `npm run generate:colors &&`)

#### Scenario: Removed template directories

**Given** the `generateProject()` function
**When** `uikit` parameter is `'shadcn'`
**Then** the system SHALL NOT copy `src/app/uikit/` directory
**And** the system SHALL NOT copy `src/app/themes/` directory

### Requirement: Demo Screenset Conditional Inclusion

The demo screenset SHALL be excluded when `--uikit none` is selected, as it has no UI components to render with.

#### Scenario: Demo screenset included with shadcn

**Given** a developer running `hai3 create my-app` or `hai3 create my-app --uikit shadcn`
**When** the project is created
**Then** the system SHALL copy demo screenset from templates to `src/screensets/demo/`
**And** the screensetRegistry.tsx SHALL include demo screenset registration

#### Scenario: Demo screenset excluded without UI

**Given** a developer running `hai3 create my-app --uikit none`
**When** the project is created
**Then** the system SHALL NOT copy demo screenset to `src/screensets/`
**And** the system SHALL display message: "Demo screenset excluded (no UI components). Create your own screenset with `hai3 screenset create`."
**And** the screensetRegistry.tsx SHALL be generated without demo screenset imports

#### Scenario: Project without demo compiles successfully

**Given** a developer running `hai3 create my-app --uikit none`
**When** the project is created without demo screenset
**Then** the generated project SHALL compile without errors
**And** `npm run type-check` SHALL succeed
**And** `npm run build` SHALL succeed

### Requirement: Generated Package.json Layer Enforcement

The CLI-generated project's package.json MUST NOT have dependencies on Layer 1 (L1) or Layer 2 (L2) packages. Only Layer 3 (L3) packages are allowed.

#### Scenario: Allowed HAI3 dependencies

**Given** the `generateProject()` function generating package.json
**When** adding HAI3 dependencies
**Then** the system SHALL ONLY include:
- `@hai3/react` (L3) - REQUIRED for all generated projects
- `@hai3/studio` (L3+) - CONDITIONAL, only when `--studio` is enabled

#### Scenario: Forbidden HAI3 dependencies

**Given** the `generateProject()` function generating package.json
**When** adding dependencies
**Then** the system SHALL NOT include:
- `@hai3/uikit` (removed - replaced by local shadcn components)
- `@hai3/framework` (L2)
- `@hai3/state` (L1)
- `@hai3/api` (L1)
- `@hai3/i18n` (L1)

### Requirement: Hai3Config Type Update

The `Hai3Config` interface SHALL reflect the new uikit options.

#### Scenario: Config type definition

**Given** the `Hai3Config` interface in `core/types.ts`
**When** defining the `uikit` field
**Then** the type SHALL be `'shadcn' | 'none'` (not `'hai3' | 'none'`)

#### Scenario: Config file content

**Given** a project created with `hai3 create my-app`
**When** examining `hai3.config.json`
**Then** the `uikit` field SHALL be `'shadcn'`

**And Given** a project created with `hai3 create my-app --uikit none`
**When** examining `hai3.config.json`
**Then** the `uikit` field SHALL be `'none'`
