# Architecture

A small Express API with an in-memory store. Request flow:

```
request -> src/app.js -> routes/auth.js | routes/users.js -> lib/validate.js (signup only)
                                                          -> lib/usersStore.js
```

## Routes

| File                  | Endpoints                                  | Notes                                                                 |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `src/routes/auth.js`  | `POST /signup`, `POST /login`              | Signup calls `validateSignup`, then checks for duplicate email, then creates the user. Login checks email + password and returns 401 on failure. |
| `src/routes/users.js` | `GET /users`                               | Returns users without password hashes.                                |
| `src/app.js`          | `GET /health`, 404 handler, error handler  | Mounts routers, JSON body parsing, bad-JSON -> 400. Only listens on a port when run directly. |

Validation contract: `validateSignup(body)` returns `{ ok, errors }`. When `ok` is false, `POST /signup` responds `400 { errors: [...] }`.

## Store

`src/lib/usersStore.js` keeps users in a module-level array. Exports:

- `addUser({ email, password, name })` - hashes the password and stores the user
- `findByEmail(email)` - case-insensitive lookup, returns user or `null`
- `getAllUsers()` - copy of all users (includes `passwordHash`; routes must strip it)
- `checkPassword(user, password)` - compares against the stored hash
- `clear()` - empties the store; tests use it between cases

Data is lost on restart. There is no database by design.

## Validation

`src/lib/validate.js` holds input checks. Right now it only verifies that a request body exists. This is where signup rules belong.

## Tests

- `tests/auth.test.js` - Supertest against the Express app (`require('../src/app')`), covering signup, login and `GET /users`.
- Each test resets the store with `store.clear()` in `beforeEach`.
- The app does not bind a port during tests.
- New test files go in `tests/` and are named `<area>.test.js`.

## Files a first-time contributor should not casually rewrite

| File                      | Why                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `src/lib/usersStore.js`   | Every route depends on its shape and exports. Changing hashing or ids breaks login and tests. |
| `src/app.js`              | Middleware order matters (JSON parser before routers, error handler last).               |
| `tests/auth.test.js` (existing cases) | These define current behavior. Add new cases; don't edit or delete existing ones. |
| `package.json`            | No new dependencies or script changes without discussion.                                |

Safe places to work for most issues: `src/lib/validate.js`, the relevant route handler, and new tests.
