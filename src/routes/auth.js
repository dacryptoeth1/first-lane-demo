const express = require('express');
const store = require('../lib/usersStore');
const { validateSignup } = require('../lib/validate');

const router = express.Router();

// create account
router.post('/signup', (req, res) => {
  const result = validateSignup(req.body);
  if (!result.ok) {
    return res.status(400).json({ errors: result.errors });
  }

  const { email, password, name } = req.body;

  if (store.findByEmail(email)) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const usr = store.addUser({ email, password, name });
  const { passwordHash, ...safe } = usr;

  res.status(201).json({ user: safe });
});

// login - no sessions/tokens yet, just checks credentials
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  const found = store.findByEmail(email);
  if (!found || !store.checkPassword(found, password)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  res.json({
    message: 'login ok',
    user: { id: found.id, email: found.email, name: found.name },
  });
});

module.exports = router;
