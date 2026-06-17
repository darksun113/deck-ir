# Contributing to deck-ir

Thanks for your interest in improving `deck-ir`. Contributions of all kinds are welcome — bug reports, fidelity fixes, tests, and docs.

## The most useful bug report

`deck-ir` is a rendering engine, so the single most useful thing you can send is **a `.pptx` that renders wrong**, together with a note (or screenshot) of how it *should* look. That lets us reproduce the problem deterministically.

## Development setup

`deck-ir` uses [pnpm](https://pnpm.io) and [Vitest](https://vitest.dev).

```bash
corepack enable        # makes the pinned pnpm available
pnpm install
pnpm typecheck         # tsc --noEmit
pnpm test              # vitest run
pnpm build             # tsup
```

## Pull request flow

1. **Fork** the repository and create a branch off `main`.
2. Make your change. If you fix a rendering bug, **add a test** (a unit test for a deterministic transform, or a fixture under `tests/`) so it doesn't regress.
3. Run `pnpm typecheck && pnpm test` and make sure everything is green.
4. Open a **pull request** with a clear description of what changed and why.

## Code style

- TypeScript, ES modules.
- Keep the dependency footprint minimal — `deck-ir` deliberately ships with only `jszip` + `fast-xml-parser`. Please don't add runtime dependencies without discussion.

## Contributor License Agreement

`deck-ir` is dual-licensed (AGPL-3.0 + commercial). To preserve that, all contributors must agree to the [CLA](./CLA.md). By opening a pull request, you confirm that your contribution is offered under the terms described there.

---

Copyright (C) 2026 deck-ir authors.
