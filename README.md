# first-lane-demo

A small Express API used to demo **First Lane**: a first-PR onboarding workflow where an AI dev partner takes a new contributor from *understand → plan → implement + test + PR*, with rollback if tests fail.

The app itself is a tiny in-memory user service with signup, login and a user list. It has one deliberate gap, tracked in [ISSUES/001-validate-signup.md](ISSUES/001-validate-signup.md), which is the good-first-issue for the demo.

## Stack

Node.js, Express 4, Jest + Supertest. JavaScript only. No database, no auth libraries, no UI.

## Quick start

```bash
npm install
npm start        # http://localhost:3000
npm test
```

Requires Node 18+.

## API

| Method | Path      | Body                          | Success                     | Errors                                  |
| ------ | --------- | ----------------------------- | --------------------------- | --------------------------------------- |
| POST   | `/signup` | `{ email, password, name }`   | `201 { user }`              | `409` email already registered          |
| POST   | `/login`  | `{ email, password }`         | `200 { message, user }`     | `401` invalid credentials               |
| GET    | `/users`  | none                          | `200 { users: [...] }`      | none                                    |
| GET    | `/health` | none                          | `200 { status: "ok" }`      | none                                    |

Users never include a password or hash in responses. Data lives in memory and resets when the server restarts.

### Try it

```bash
curl -X POST localhost:3000/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"correct-horse","name":"Ada"}'

curl localhost:3000/users
```

## Known gap (the good-first-issue)

`POST /signup` does not validate its input. It currently accepts an invalid email, an empty or short password, and a missing name. See [ISSUES/001-validate-signup.md](ISSUES/001-validate-signup.md).

## Project layout

```
src/
  app.js              Express app + error handling
  routes/auth.js      POST /signup, POST /login
  routes/users.js     GET /users
  lib/validate.js     input validation (weak on purpose)
  lib/usersStore.js   in-memory user store
tests/auth.test.js    API tests
ISSUES/               issues to pick up
docs/architecture.md  how the pieces fit
CONTRIBUTING.md       how to run, test and open a PR
PLAYBOOK.md           copy-paste prompts for the IBM Bob demo run
```

## Demo metrics

Fill in once for the baseline (unassisted) run and once for the run with IBM Bob 2.0, both on issue 001.

| Metric                      | Before (unassisted) | After (with Bob) |
| --------------------------- | ------------------- | ---------------- |
| Time to first correct file  |                     |                  |
| Time to green tests         |                     |                  |
| Files opened / changed      |                     |                  |
| Blocking review comments    |                     |                  |
