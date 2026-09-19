# Contributing to first-lane-demo

Thanks for picking up an issue. This guide covers everything you need for a first PR.

## Set up

Requires Node 18+.

```bash
npm install
npm start        # runs the API on http://localhost:3000 (PORT overrides)
```

## Run the tests

```bash
npm test
```

All tests must pass before you open a PR. Run them once *before* you change anything so you know the baseline is green.

## Picking work

Start with an issue labelled `good first issue` in `ISSUES/`. Read it fully, including the "files likely involved" and acceptance sections, before writing code.

## Making a change

1. Create a branch: `git checkout -b fix/<short-description>` (for example `fix/validate-signup`).
2. Write or extend a test first and confirm it fails for the right reason.
3. Make the smallest change that fixes it.
4. Run `npm test` and confirm everything is green.
5. Commit with a clear message and open a PR.

## PR rules

- One issue per PR. Reference it in the description (for example "Closes #001").
- Keep the diff small and focused. No drive-by refactors, renames or formatting sweeps.
- Every behavior change needs a test. Bug fixes need a test that fails without the fix.
- Do not change existing test expectations to make them pass. If one has to change, explain why in the PR.
- PR description must include: a summary, a test plan (commands you ran and results), and a short risk note (what could break, what you did not touch).
- No new dependencies without discussing it in the issue first.
- JavaScript only. No TypeScript, database, or auth libraries.

## Don't touch store internals unless needed

`src/lib/usersStore.js` is the single source of truth for user data. Other code should only use its exported functions. Do **not** change its data shape, hashing, id generation or exports unless your issue requires it. If you think you need to, say so in the PR and explain why. Most validation work belongs in `src/lib/validate.js` and the route that calls it.

## Style

Match the surrounding code. There is no linter yet, so keep it simple: 2-space indent, single quotes, semicolons, CommonJS `require`.

## Where things live

See [docs/architecture.md](docs/architecture.md) for the route, store and test layout, and the files you should not casually rewrite.
