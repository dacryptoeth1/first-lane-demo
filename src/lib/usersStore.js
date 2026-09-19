// in-memory users, gone on restart
const crypto = require('crypto');

let users = [];
let nextId = 1;

// TODO: use a salted, slow hash before this goes anywhere real
function hashPw(pw) {
  return crypto.createHash('sha256').update(String(pw)).digest('hex');
}

function norm(email) {
  return String(email || '').trim().toLowerCase();
}

function addUser({ email, password, name }) {
  const user = {
    id: nextId++,
    email,
    name,
    passwordHash: hashPw(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

function findByEmail(email) {
  return users.find((u) => norm(u.email) === norm(email)) || null;
}

function getAllUsers() {
  return users.slice();
}

function checkPassword(user, password) {
  return user.passwordHash === hashPw(password);
}

// used by tests
function clear() {
  users = [];
  nextId = 1;
}

module.exports = { addUser, findByEmail, getAllUsers, checkPassword, clear };
