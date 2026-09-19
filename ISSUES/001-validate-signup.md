# Validate signup email and password before creating a user

**Labels:** `good first issue`

## Summary

`POST /signup` creates a user no matter what the input looks like. Bad data ends up in the store and can't be used sensibly later.

## Current behavior

These all return `201 Created` today:

```bash
# invalid email
curl -X POST localhost:3000/signup -H 'Content-Type: application/json' \
  -d '{"email":"not-an-email","password":"correct-horse","name":"Ada"}'

# empty password
curl -X POST localhost:3000/signup -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"","name":"Ada"}'

# short password
curl -X POST localhost:3000/signup -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"abc","name":"Ada"}'

# missing name
curl -X POST localhost:3000/signup -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"correct-horse"}'
```

The only check today is that a request body exists.

## Expected behavior

`POST /signup` must respond `400` and **not** create a user when any of these rules fail:

| Field      | Rule                                                              |
| ---------- | ----------------------------------------------------------------- |
| `email`    | Required, a string, and a valid email format (`something@domain.tld`) |
| `password` | Required, a string, at least 8 characters                         |
| `name`     | Required, a string, not empty after trimming whitespace           |

Response shape on failure:

```json
{ "errors": ["email must be a valid email address", "password must be at least 8 characters"] }
```

- Report **all** failing fields in one response, not just the first.
- Exact wording of messages is up to you, but each message should name the field.
- Valid signups behave exactly as they do now (`201`, user without password).
- Duplicate email still returns `409`.
- `POST /login` and `GET /users` are unchanged.

## Files likely involved

- `src/lib/validate.js` - add the rules to `validateSignup` (most of the change goes here)
- `src/routes/auth.js` - should already return 400 with `errors`; confirm, and change only if needed
- `tests/auth.test.js` (or a new `tests/validate.test.js`) - add tests for each rule

Not expected to change: `src/lib/usersStore.js`, `src/app.js`, `package.json`. See [CONTRIBUTING.md](../CONTRIBUTING.md) and [docs/architecture.md](../docs/architecture.md).

## Acceptance criteria

- [ ] New tests are written **first** and fail on the current code
- [ ] Tests cover: invalid email, missing email, empty password, short password (7 chars), missing name, whitespace-only name, multiple errors at once, and a valid signup still succeeding
- [ ] After the fix, all new tests pass
- [ ] All existing tests still pass, unmodified
- [ ] A rejected signup does not add a user (`GET /users` stays empty)
- [ ] No new dependencies
- [ ] PR follows the rules in CONTRIBUTING.md (summary, test plan, risk)
