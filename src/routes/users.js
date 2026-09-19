const express = require('express');
const store = require('../lib/usersStore');

const router = express.Router();

// list users (no passwords)
router.get('/', (req, res) => {
  const list = store.getAllUsers().map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt,
  }));

  res.json({ users: list });
});

module.exports = router;
