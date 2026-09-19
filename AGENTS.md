# Repository Guidelines

## Project Structure & Module Organization

SignalFeed is a WXT browser extension built with React and TypeScript. Entry points live in `src/entrypoints/`: `background/` handles browser events, `content/` integrates with X, and `popup/` and `options/` provide UI pages. Domain logic belongs in `src/core/`, persistence in `src/storage/`, translations in `src/i18n/`, and presentation code in `src/ui/`. Test fixtures are under `src/test/fixtures/`; global setup is in `test/setup.ts`. Keep plans and specifications in `docs/superpowers/`. Do not edit generated `.wxt/` or `dist/` content.

## Build, Test, and Development Commands

- `npm install` installs dependencies and prepares WXT types.
- `npm run dev` starts development mode with extension rebuilding.
- `npm run build` creates a production extension in `dist/`.
- `npm run zip` packages the extension for distribution.
- `npm test` runs the complete Vitest suite once.
- `npm run test:watch` reruns affected tests while developing.
- `npm run typecheck` validates strict TypeScript types without emitting files.

Before opening a pull request, run `npm test && npm run typecheck && npm run build`.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, no semicolons, and trailing commas in multiline structures. Name React components and exported types with `PascalCase`, functions and variables with `camelCase`, and constant collections with uppercase names such as `TOPICS`. Keep browser-facing code thin; place business rules in `src/core/`. No formatter or linter is configured, so preserve surrounding style and run the type checker.

## Testing Guidelines

Vitest runs in `jsdom`, with Testing Library, `fake-indexeddb`, and a fake WebExtension browser configured in `test/setup.ts`. Co-locate tests using `*.test.ts` or `*.test.tsx`; name UI tests after their component. Test observable behavior and edge cases. No coverage threshold is enforced, but behavior changes should include regression tests. Diagnostic `src/__*.test.ts` probes are excluded from the main suite.

## Commit & Pull Request Guidelines

Recent commits use Conventional Commit prefixes, such as `chore:` and `docs:`. Use concise, imperative subjects like `feat: add focus-mode filtering` or `fix: persist score threshold`. Pull requests should explain the user-visible change, link relevant issues or design docs, list verification performed, and include screenshots for UI changes. Exclude generated artifacts and unrelated refactors.

## Security & Configuration

Never commit API keys or user data. Keep manifest permissions and `host_permissions` in `wxt.config.ts` narrowly scoped, and document any new permission in the pull request.
