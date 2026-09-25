# Plan: Validate Signup Email, Password, and Name (Issue #001)

## 1. Goal

Add field-level validation to `POST /signup` so that invalid email, short/missing password, and empty/missing name each return `400 { errors: [...] }` without creating a user.

---

## 2. File-by-File Change List

| # | File | Action | What changes | Why |
|---|------|--------|--------------|-----|
| 1 | `src/lib/validate.js` | **modify** | Replace the stub body of `validateSignup` with real rules for `email`, `password`, and `name`. All three fields are checked in one pass; every failing rule appends a message to the `errors` array. | This is the designated home for signup rules per the issue, architecture doc, and CONTRIBUTING.md. |
| 2 | `tests/auth.test.js` | **modify** (append only) | Add a new `describe` block (or additional `it` cases inside the existing `POST /signup` describe) for each new rule. Existing cases are not touched. | The issue requires tests that fail before the fix and pass after. New cases go in the existing test file per the architecture doc. |
| 3 | `src/routes/auth.js` | **do not touch** | Already returns `400 { errors: result.errors }` when `result.ok` is false (lines 10–12). No change needed. | The response contract is already correct. Touching this file would be a drive-by change. |
| 4 | `src/lib/usersStore.js` | **do not touch** | Store internals are explicitly protected in CONTRIBUTING.md. Validation is not its responsibility. | — |
| 5 | `src/app.js` | **do not touch** | Middleware order and error handler are not affected. | — |
| 6 | `package.json` | **do not touch** | No new dependencies. Native `String` methods are sufficient for email format checking. | — |

**Change set size:** two files touched, one with logic changes, one with appended tests only.

---

## 3. Validation Rules and Response Contract

### Rules (all evaluated regardless of each other — collect all errors)

| Field | Rule | Error message (example wording) |
|-------|------|----------------------------------|
| `email` | Present, must be a string, must match `something@domain.tld` pattern | `"email must be a valid email address"` |
| `password` | Present, must be a string, length ≥ 8 | `"password must be at least 8 characters"` |
| `name` | Present, must be a string, not empty after `.trim()` | `"name is required"` |

**Email format rule:** a minimal regex is sufficient — the issue does not require RFC 5321 strictness. Acceptable: `something@domain.tld` where there is at least one character before `@`, at least one character between `@` and `.`, and at least one character after `.`. Example pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. No new npm package.

**Non-string values:** if a field is present but not a `string` (e.g. `email: 123`), it fails the "must be a string" check and gets the same error as a missing field. The check `typeof x !== 'string'` covers both missing and wrong-type cases in one branch.

### Response contract on failure (HTTP 400)

```json
{ "errors": ["email must be a valid email address", "password must be at least 8 characters"] }
```

- Status: `400`
- Body: `{ "errors": [ ...strings ] }` — one string per failing rule, field name in every message
- **All failing fields are reported in a single response** — the validator loops through all three checks before returning
- Order of messages: email first, password second, name third (matches field order in the issue table)

### Contract on success (unchanged)

- Status: `201`
- Body: `{ "user": { id, email, name, createdAt } }` — no `password` or `passwordHash`

---

## 4. Test Plan

### File: `tests/auth.test.js` — append a new `describe` block

**Existing tests: zero modifications.** All 5 existing cases (`creates a user`, `rejects duplicate`, `logs in`, `wrong password`, `unknown email`, `lists users`) remain byte-for-byte identical.

### New test cases to add

Each case below must **fail on current code** (current `validateSignup` only checks that a body exists, so all of these return `201` today).

| # | Test name | Input | Expected status | Expected body (key check) |
|---|-----------|-------|-----------------|--------------------------|
| 1 | `returns 400 for an invalid email` | `{ email: 'not-an-email', password: 'correct-horse', name: 'Ada' }` | `400` | `errors` array contains an email message |
| 2 | `returns 400 when email is missing` | `{ password: 'correct-horse', name: 'Ada' }` | `400` | `errors` array contains an email message |
| 3 | `returns 400 when email is not a string` | `{ email: 123, password: 'correct-horse', name: 'Ada' }` | `400` | `errors` array contains an email message |
| 4 | `returns 400 for an empty password` | `{ email: 'ada@example.com', password: '', name: 'Ada' }` | `400` | `errors` array contains a password message |
| 5 | `returns 400 for a short password (7 chars)` | `{ email: 'ada@example.com', password: 'abc1234', name: 'Ada' }` | `400` | `errors` array contains a password message |
| 6 | `returns 400 when password is missing` | `{ email: 'ada@example.com', name: 'Ada' }` | `400` | `errors` array contains a password message |
| 7 | `returns 400 when name is missing` | `{ email: 'ada@example.com', password: 'correct-horse' }` | `400` | `errors` array contains a name message |
| 8 | `returns 400 for a whitespace-only name` | `{ email: 'ada@example.com', password: 'correct-horse', name: '   ' }` | `400` | `errors` array contains a name message |
| 9 | `returns 400 when name is not a string` | `{ email: 'ada@example.com', password: 'correct-horse', name: null }` | `400` | `errors` array contains a name message |
| 10 | `reports multiple errors at once` | `{ email: 'bad', password: 'short', name: '   ' }` | `400` | `errors` has length ≥ 3; each of email, password, name is mentioned |
| 11 | `rejected signup does not create a user` | Send invalid body, then `GET /users` | First call `400`; second call `200` with `users` of length `0` | Store untouched |
| 12 | `valid signup still returns 201` | `{ email: 'ada@example.com', password: 'correct-horse', name: 'Ada' }` | `201` | `user.email` is `'ada@example.com'` |

**Why tests 1–11 fail today:** `validateSignup` only checks `isObject(body)`. A body with fields always passes, so `201` is returned instead of `400`.

**Why test 12 passes today and must continue to pass:** it mirrors the existing happy-path test and confirms no regression.

---

## 5. Step Order

1. **Write tests first** — append all 12 new test cases to `tests/auth.test.js`. Do not change any existing case.
2. **Confirm they fail** — run `npm test`; tests 1–11 must show `Expected: 400, Received: 201` (or similar). Test 12 must pass.
3. **Implement validation** — modify `src/lib/validate.js` only: replace the stub body of `validateSignup` with the full three-field check loop.
4. **Confirm green** — run `npm test`; all tests (old + new) must pass.

---

## 6. Risks and Edge Cases

| Risk / Edge Case | Handling |
|-----------------|----------|
| **Whitespace-only name** (`"   "`) | `name.trim() === ''` catches this. Must be tested explicitly (test #8). |
| **Non-string field values** (`email: 123`, `name: null`, `password: []`) | `typeof x !== 'string'` check before any string-specific operations. Returns same error message as missing field. |
| **Completely missing fields** (`undefined`) | `typeof undefined !== 'string'` — falls into the same branch as non-string. |
| **Missing entire body / non-object body** | Existing `isObject(body)` guard already pushes `'request body is required'`. Keep this guard in place — it short-circuits before per-field checks, which would crash on `undefined.email`. |
| **Email format strictness** | Use minimal regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Does not validate TLD length or Unicode domains — the issue does not require RFC strictness and forbids new dependencies. |
| **Exactly 8-character password** | Must pass (`>= 8`). A 7-character password must fail (test #5 uses 7 chars). |
| **Rejected signup must not create a user** | Because `validateSignup` runs before `store.addUser`, a validation failure returns early before the store is touched. Test #11 verifies this with a `GET /users` assertion. |
| **Duplicate email + invalid password** | Validation runs first; the `409` duplicate check is only reached for valid input. No change to this ordering needed. |
| **`POST /login` and `GET /users`** | Not called by `validateSignup`; completely unaffected. |

---

## 7. Out of Scope

- `POST /login` — no validation changes; not mentioned in the issue.
- `GET /users` — read-only; not mentioned in the issue.
- Email uniqueness normalization in `usersStore.js` — not part of this issue.
- Password strength rules beyond minimum length (uppercase, special chars, etc.) — not requested.
- Sanitizing or trimming email/name before storing — the issue only requires rejecting bad input, not normalizing good input.
- Error message i18n or configurable wording — fixed English strings are sufficient.
- TypeScript migration, linting setup, or any refactor of surrounding code.
- New npm packages of any kind.

---

## 8. Rollback Checkpoint

**Before starting:** confirm the baseline is green with `npm test`. The current branch is `fix/validate-signup`.

**Checkpoint:** after baseline is confirmed green but before any file is modified, create a git commit (or note the current HEAD SHA) as the rollback point:

```
git stash   # or: git commit -m "chore: baseline checkpoint before validate-signup implementation"
```

**Rollback trigger condition:** if, after implementing `validateSignup`, any **existing** test that was green at baseline starts failing — specifically any test inside the existing `POST /signup`, `POST /login`, or `GET /users` describe blocks — revert immediately to the checkpoint SHA and re-examine the change before proceeding.

New tests that fail are expected until implementation is complete and are not a rollback trigger.

---

## Sub-Tasks (for implementation in Agent mode)

### Sub-Task 1 — Write failing tests
- **Status:** `[ ] pending`
- **Intent:** Append the 12 new test cases (Section 4) to `tests/auth.test.js` without modifying any existing case.
- **Expected outcome:** `npm test` shows tests 1–11 failing with `400`-vs-`201` mismatches; test 12 passes; all 6 existing tests still pass.
- **Relevant context:** `tests/auth.test.js` lines 1–80 (existing); append after line 80 inside a new `describe('POST /signup - validation', ...)` block.

### Sub-Task 2 — Implement validateSignup
- **Status:** `[ ] pending`
- **Intent:** Replace the stub body of `validateSignup` in `src/lib/validate.js` with per-field checks for email (format), password (min 8 chars), and name (non-empty after trim), collecting all errors before returning.
- **Expected outcome:** `npm test` shows all tests (old + new) green. `src/routes/auth.js` and all other files are unchanged.
- **Relevant context:** `src/lib/validate.js` lines 9–17 (current stub); `src/routes/auth.js` lines 9–12 (already correct response contract — no changes needed there).
