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
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { validateSignup };
