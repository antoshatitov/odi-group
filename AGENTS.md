# Agent Notes for This Repo

This repository may start empty. Use this document as the baseline for agent
behavior until project files exist.

If you add or discover build, lint, or test tooling, update this file with the
exact commands and conventions you find.

## CRITICAL: Repo boundary / sandbox rules (STRICT)

- Treat the repository root as the current working directory of the project.
- **DO NOT read, write, search, or modify anything outside the repo root.**
- **DO NOT use absolute paths outside the repo** (e.g. /Users, /etc, /var, ~/.ssh).
- **DO NOT `cd ..` out of the repo** and do not reference parent directories.
- If a task would require operating outside the repo, stop and ask for an explicit
  user instruction; default is to refuse.
- Never exfiltrate secrets. Never print or log local file contents unless the user
  explicitly asked and the file is inside the repo.

## Quick facts

- Repo root: the current repository working directory (do not assume a fixed absolute path)
- Git: yes
- Known config files: `package.json`, `package-lock.json`, `apps/web/package.json`,
  `apps/web/vite.config.ts`, `apps/web/eslint.config.js`, `apps/web/prettier.config.cjs`,
  `apps/web/tsconfig.json`, `apps/web/tsconfig.app.json`, `apps/web/tsconfig.node.json`,
  `apps/server/package.json`, `.github/workflows/ci.yml`, `deploy/nginx.conf`,
  `deploy/odi-leads.service`, `.env.example`

## Tech stack

- Frontend: React 18, Vite 6, TypeScript, React Router
- Backend: Node.js 20+, Fastify 5
- Deploy: Nginx, systemd

## Playwright MCP (ALLOWED)

Playwright MCP is explicitly allowed for UI checks and exploratory testing.

Allowed usage:
- Open pages in a browser to review layout, responsiveness, visual regressions.
- Take screenshots, inspect DOM, verify interactions.
- Use for the reference sites and the developed site when needed.

Safety constraints:
- **Read-only browsing only**: do not submit forms that trigger real actions, do not
  purchase, do not download executables, do not change account settings.
- **Never enter credentials**, tokens, or personal data into any website.
- If the Playwright MCP server supports an allowlist (e.g., `--allowed-hosts`),
  restrict hosts to only what is needed for the task.

## Build, lint, and test commands

Tooling detected:

- Install dependencies: `npm install`
- Build (frontend): `npm run build:web`
- Lint (frontend): `npm run lint:web`
- Format (frontend): `npm run format:web`
- Dev (frontend): `npm run dev:web`
- Preview (frontend): `npm run preview:web`
- Dev (server): `npm run dev:server`
- Start (server): `npm run start:server`
- Test (all): not configured
- Test (single): not configured

When tooling is added, list commands here in this format:

- Install dependencies: `...`
- Build: `...`
- Lint: `...`
- Format: `...`
- Test (all): `...`
- Test (single): `...` (include the exact flag for single test)

Single test guidance should be explicit. For example, prefer one of:

- `pytest path/to/test_file.py::test_name`
- `go test ./pkg -run TestName`
- `vitest path/to/test.test.ts -t "test name"`
- `jest path/to/file.test.ts -t "test name"`

## Code style guidelines

### Imports

- Prefer absolute imports rooted at the project entry point.
- Group imports by: standard library, third-party, local modules.
- One blank line between import groups.
- Do not use unused imports; remove them immediately.
- Avoid wildcard imports unless the language standard requires them.

### Formatting

- Keep line length at 100 characters unless tooling enforces otherwise.
- Use 2 spaces for indentation in JS/TS, JSON, YAML, and Markdown code blocks.
- Use 4 spaces in Python or follow the language standard if different.
- Prefer trailing commas where supported to minimize diff noise.
- Use double quotes in JSON and single quotes in JS/TS unless the formatter
  enforces double quotes.
- Prettier config: printWidth 100, singleQuote true, trailingComma all, semi false.
- Use ESM modules (package.json `type: module`).

### Types and interfaces

- Prefer explicit types at module boundaries and public APIs.
- Use type aliases for reusable shapes and interfaces for object contracts.
- Avoid `any`; use `unknown` and narrow with type guards.
- Keep type definitions close to the code that uses them.

### Naming conventions

- Use clear, intention-revealing names; avoid abbreviations.
- Variables and functions: `camelCase`.
- Classes and types: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` only for true constants.
- Files: `kebab-case` or `snake_case` depending on language convention.

### Error handling

- Prefer early returns and guard clauses to reduce nesting.
- Throw or return explicit errors; do not swallow exceptions silently.
- Attach enough context to errors to make debugging possible.
- In async code, always handle promise rejections.

### Logging

- Log only actionable information.
- Avoid logging secrets or personally identifiable information.
- Prefer structured logs when the language supports them.

### Testing

- Keep tests deterministic and isolated.
- Use descriptive test names that express behavior.
- Arrange, Act, Assert style when applicable.
- Avoid time-based sleeps; use fake timers or polling helpers.

### API and data handling

- Validate external inputs at boundaries.
- Normalize data shapes before core logic.
- Keep serialization and transport-specific logic at the edge.

### Documentation

- Add short module-level comments only when behavior is non-obvious.
- Prefer inline examples in tests for complex logic.
- Update README or docs if you add new commands or environment setup.

### Security and secrets

- Never commit secrets or credentials.
- When working with git, verify sensitive project info (phone numbers, addresses, names, etc.) is not exposed publicly or on github.com.
- Use environment variables for configuration.
- Redact sensitive data in logs and errors.

## Cursor and Copilot rules

No Cursor rules were found (.cursor/rules/ or .cursorrules).
No Copilot rules were found (.github/copilot-instructions.md).

If these files are added, summarize their guidance here and keep the originals.

## Repo discovery checklist

Use this checklist whenever new files appear in the repo:

- Check for package managers or build files: `package.json`, `pyproject.toml`,
  `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `Makefile`, `justfile`.
- Look for test frameworks or runners and record exact single-test flags.
- Scan for lint or format configs and record commands and versions.
- Note any runtime or engine requirements (Node, Python, Go, etc.).
- Capture environment setup steps or required services if present.

## Dependencies and tooling

- Do not add dependencies without a clear requirement.
- If a dependency is added, update this file with install/build/test commands.
- Prefer existing tooling over introducing new tools.
- Avoid global installs; use project-local tooling when available.

## Workspace hygiene

- Do not delete user files or changes without explicit request.
- Avoid running destructive commands (`rm -rf`, disk operations, privilege escalation).
- Avoid running destructive git commands.
- Keep edits minimal and focused on the task.
- Always operate **inside the repo root** (see sandbox rules above).

## Change checklist for agents

- Confirm there is still no tooling config before adding commands.
- Prefer incremental edits with minimal scope.
- Preserve existing formatting and naming if files are added later.
- Avoid introducing dependencies without documenting them.
- Update this file after adding any new tooling or standards.
