# First Lane Playbook (IBM Bob 2.0)

Copy-paste prompts for one run: **understand -> plan -> implement + test + PR**, with rollback if tests fail. Target: [ISSUES/001-validate-signup.md](ISSUES/001-validate-signup.md).

Run the steps in order, each in the mode named in its heading. Start a stopwatch at step 0 and note the times listed in the README "Demo metrics" table as you go.

## Step 0: Baseline (you, not Bob)

```bash
npm install
npm test        # expect: all green before any change
git checkout -b fix/validate-signup
```

Record the start time. Note it again when Bob first names the correct file (`src/lib/validate.js`) and again when tests are green.

---

## 1. ASK: map the repo for a new contributor

Mode: **Ask** (read-only). Attach or reference: `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `ISSUES/001-validate-signup.md`.

```text
I'm a new contributor to this repo and want to fix ISSUES/001-validate-signup.md as my first PR. Don't change any files.

Read README.md, CONTRIBUTING.md, docs/architecture.md, ISSUES/001-validate-signup.md, and the code under src/ and tests/.

Give me:
1. A short map of the repo: what each file under src/ and tests/ does, and how a POST /signup request flows from app.js to the store.
2. The exact file(s) where the fix for issue 001 belongs, and why. Say which files I should NOT need to touch (and why), based on CONTRIBUTING.md and docs/architecture.md.
3. What currently happens for each broken input in the issue (invalid email, empty password, short password, missing name), traced through the code with file and function names.
4. Anything confusing, inconsistent or risky in the code that could trip up a first-time contributor (naming, comments, leftover notes). List it, but don't propose fixing it as part of this issue.
5. How the existing tests are laid out and how they reset state between cases.

Keep it under 400 words. Cite file paths for every claim.
```

---

## 2. PLAN: turn the issue into a file-level plan (no code)

Mode: **Plan**. Do not let it write code.

```text
Create an implementation plan for ISSUES/001-validate-signup.md. Do NOT write or modify any code or test files. Output a plan only.

Inputs to follow strictly: ISSUES/001-validate-signup.md, CONTRIBUTING.md (PR rules and "don't touch store internals"), and docs/architecture.md (files not to casually rewrite).

The plan must include:
1. Goal, in one sentence.
2. File-by-file change list. For each file: the path, what changes, and why. Mark each as "modify", "add", or "do not touch". Keep the change set as small as possible.
3. Validation rules and the exact response contract ({ errors: [...] } with status 400), and how all failing fields are reported at once.
4. Test plan: the list of test cases to add (name + input + expected status/body), which file they go in, and confirmation that existing tests stay unmodified. The new tests must fail on current code before the fix.
5. Step order: write tests first, confirm they fail, implement, confirm green.
6. Risks and edge cases (whitespace-only name, non-string values, missing fields, email format strictness, rejected signup must not create a user).
7. Out of scope: what we are deliberately not changing.
8. Rollback checkpoint: where to create a checkpoint before implementation and the exact condition that triggers a rollback.

Stop after the plan and wait for my approval.
```

---

## 3. AGENT / SUBAGENTS

Mode: **Agent**. Only start after you have reviewed and approved the plan. Each prompt below is for one subagent (or one sequential agent turn if subagents aren't available).

### 3a. Scout: similar patterns in repo

```text
You are the Scout. Read-only: do not modify any files.

Task: find existing patterns in this repo that I should match when implementing input validation for POST /signup (ISSUES/001-validate-signup.md).

Report:
1. How validateSignup in src/lib/validate.js is structured and how src/routes/auth.js consumes its result.
2. Existing error response shapes across all routes (status codes and JSON bodies), so the new 400 response is consistent.
3. Code style to match (indentation, quotes, semicolons, module format, comment style, naming).
4. How existing tests in tests/auth.test.js are written (setup/teardown, request helper, assertion style) so new tests look the same.
5. Any helper already in the repo that I should reuse instead of adding a new one.

Return a concise bullet list with file paths and line references. No code changes.
```

### 3b. Implement: only the planned change

```text
You are the Implementer. Follow the approved plan for ISSUES/001-validate-signup.md exactly.

Before writing code, create a rollback checkpoint.

Rules:
- Only modify the files listed as "modify" in the plan. Expected: src/lib/validate.js (and src/routes/auth.js only if the plan says it's needed).
- Do NOT touch src/lib/usersStore.js, src/app.js, package.json, or any existing test case.
- No new dependencies. JavaScript only, CommonJS, match the existing code style.
- Implement these rules in validateSignup: email required, string, valid email format; password required, string, at least 8 characters; name required, string, non-empty after trim.
- Return { ok, errors } where errors lists every failing field, each message naming the field.
- Do not refactor, rename or reformat anything unrelated.

When done, show me the diff and list exactly which files changed. Don't run the full test suite yet. That is the Test step.
```

### 3c. Test: add/extend tests

Run this **before** 3b if you follow the plan's test-first order (tests should fail on the unfixed code), then run the same test command again after 3b to show green.

```text
You are the Tester. Add tests for ISSUES/001-validate-signup.md in tests/auth.test.js (or a new tests/validate.test.js if the plan says so). Do not edit or delete any existing test case.

Add cases for:
- invalid email format -> 400, errors mention email
- missing email -> 400
- empty password -> 400, errors mention password
- password of 7 characters -> 400
- password of exactly 8 characters -> 201
- missing name -> 400, errors mention name
- whitespace-only name -> 400
- multiple invalid fields in one request -> 400 and errors mention every failing field
- rejected signup does not create a user (GET /users returns an empty list)
- a fully valid signup still returns 201 without password or passwordHash in the body

Match the style of the existing tests (supertest, store.clear() in beforeEach).

Then run `npm test` and report:
1. Which new tests pass and which fail.
2. If the implementation is not in place yet, the new validation tests MUST fail for the right reason (a 201 where 400 was expected). Show the failing output.
3. If the implementation is in place, everything must be green. Show the summary.
```

### 3d. PR: title, summary, test plan, risk

```text
You are the PR author. Only run after `npm test` is fully green.

Write a pull request description for the change that resolves ISSUES/001-validate-signup.md, following CONTRIBUTING.md PR rules. Base it on the actual diff and the actual test output, not on the plan.

Format:

Title: <imperative, under 70 chars>

## Summary
2-4 bullets: what changed and why. Reference the issue ("Closes 001").

## Changes
List each file changed with one line on what changed. Confirm src/lib/usersStore.js, src/app.js and package.json were not modified (or explain if they were).

## Test plan
- Commands run and their results (paste the pass/fail counts)
- New test cases added (one line each)
- Confirmation that the new tests failed before the fix and pass after
- Confirmation that no existing test was modified

## Risk
- What could break (for example stricter email regex rejecting an unusual but valid address)
- What was intentionally not touched
- Rollback: how to revert (single commit revert)

Also output the suggested commit message. Do not push or open the PR; just give me the text.
```

---

## If tests fail: rollback, fix, re-run

Use this whenever `npm test` fails after the Implement step (or when the Implementer touched a file outside the plan).

```text
Tests failed after the implementation. Do the following in order:

1. STOP. Do not make further edits yet.
2. Show me the failing test names and the assertion errors from `npm test`.
3. Roll back to the checkpoint created before the Implement step so the working tree matches it. Confirm with `git status` and `git diff` that the implementation changes are gone. Keep the new tests if they were added in a separate step.
4. Diagnose the cause of each failure. Say whether it is (a) a bug in the implementation, (b) a wrong or too-strict test, or (c) an existing test that broke because of an out-of-scope change. Do not weaken or edit existing tests to get green.
5. Propose the smallest fix as a short description, and tell me which files it touches. Confirm none are outside the approved plan. Wait for my approval if it is not.
6. Re-apply the fix, run `npm test`, and report the full result.
7. If it still fails after two attempts, stop and give me a summary of what you tried and what you think is wrong.
```

---

## Recording the demo metrics

Fill the table in [README.md](README.md#demo-metrics) for both runs:

| Metric                     | How to measure                                                             |
| -------------------------- | -------------------------------------------------------------------------- |
| Time to first correct file | Start of run until the correct file (`src/lib/validate.js`) is identified  |
| Time to green tests        | Start of run until `npm test` is green with the new tests included         |
| Files opened / changed     | Count of files opened while working, and files in the final diff           |
| Blocking review comments   | Comments from a reviewer that must be resolved before merge                |

To reset for a second run: `git checkout main` (or your base branch), delete the working branch, and start again from Step 0.
