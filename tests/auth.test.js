const request = require('supertest');
const app = require('../src/app');
const store = require('../src/lib/usersStore');

beforeEach(() => {
  store.clear();
});

describe('POST /signup', () => {
  it('creates a user and does not return the password', async () => {
    const res = await request(app)
      .post('/signup')
      .send({ email: 'ada@example.com', password: 'correct-horse', name: 'Ada' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.user.name).toBe('Ada');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a duplicate email with 409', async () => {
    const payload = { email: 'ada@example.com', password: 'correct-horse', name: 'Ada' };
    await request(app).post('/signup').send(payload);

    const res = await request(app).post('/signup').send(payload);

    expect(res.status).toBe(409);
  });
});

describe('POST /login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/signup')
      .send({ email: 'grace@example.com', password: 'hopper-1906', name: 'Grace' });
  });

  it('logs in with the right password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'grace@example.com', password: 'hopper-1906' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('grace@example.com');
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'grace@example.com', password: 'nope' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });

    expect(res.status).toBe(401);
  });
});

describe('GET /users', () => {
  it('lists users without passwords', async () => {
    await request(app)
      .post('/signup')
      .send({ email: 'linus@example.com', password: 'penguin-1991', name: 'Linus' });

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].email).toBe('linus@example.com');
    expect(res.body.users[0].password).toBeUndefined();
    expect(res.body.users[0].passwordHash).toBeUndefined();
  });
});
