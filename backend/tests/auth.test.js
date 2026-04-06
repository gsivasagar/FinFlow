const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123',
    role: 'admin',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('userId');
      expect(res.body.message).toBe('User registered successfully.');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered.');
    });

    it('should reject weak password via Zod', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Weak', email: 'weak@test.com', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed.');
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('should reject missing fields via Zod', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.role).toBe('admin');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPass1' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noone@test.com', password: 'Pass1234' });

      expect(res.status).toBe(401);
    });
  });
});
