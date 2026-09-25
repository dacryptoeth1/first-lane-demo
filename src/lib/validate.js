// input validation helpers

function isObject(x) {
  return x !== null && typeof x === 'object';
}

// signup validation
// returns { ok, errors }
function validateSignup(body) {
  const errors = [];

  if (!isObject(body)) {
    errors.push('request body is required');
    return { ok: false, errors };
  }

  const { email, password, name } = body;

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('email must be a valid email address');
  }

  if (typeof password !== 'string' || password.length < 8) {
    errors.push('password must be at least 8 characters');
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required');
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { validateSignup };
