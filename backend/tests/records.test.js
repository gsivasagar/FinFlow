const request = require('supertest');
const app = require('../src/app');

describe('Records Endpoints', () => {
  let adminToken;
  let viewerToken;
  let recordId;

  const adminUser = {
    name: 'Records Admin',
    email: `rec_admin_${Date.now()}@example.com`,
    password: 'AdminPass1',
    role: 'admin',
  };

  const viewerUser = {
    name: 'Records Viewer',
    email: `rec_viewer_${Date.now()}@example.com`,
    password: 'ViewerPass1',
    role: 'viewer',
  };

  beforeAll(async () => {
    // Register and login admin
    await request(app).post('/api/auth/register').send(adminUser);
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminRes.headers['set-cookie'];

    // Register and login viewer
    await request(app).post('/api/auth/register').send(viewerUser);
    const viewerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: viewerUser.email, password: viewerUser.password });
    viewerToken = viewerRes.headers['set-cookie'];
  });

  describe('POST /api/records (Admin)', () => {
    it('should create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Cookie', adminToken)
        .send({ amount: 1500, type: 'income', category: 'Salary', date: '2024-01-15', notes: 'Monthly salary' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('recordId');
      recordId = res.body.recordId;
    });

    it('should reject invalid type via Zod', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Cookie', adminToken)
        .send({ amount: 100, type: 'invalid', category: 'Test', date: '2024-01-15' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed.');
    });

    it('should reject negative amount via Zod', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Cookie', adminToken)
        .send({ amount: -50, type: 'expense', category: 'Test', date: '2024-01-15' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/records', () => {
    it('should list records for admin', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('records');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should list records for viewer', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Cookie', viewerToken);

      expect(res.status).toBe(200);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/records');
      expect(res.status).toBe(401);
    });
  });

  describe('RBAC enforcement', () => {
    it('should prevent viewer from creating records', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Cookie', viewerToken)
        .send({ amount: 100, type: 'income', category: 'Test', date: '2024-01-15' });

      expect(res.status).toBe(403);
    });

    it('should prevent viewer from deleting records', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Cookie', viewerToken);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/records/:id (Admin)', () => {
    it('should update a record', async () => {
      const res = await request(app)
        .put(`/api/records/${recordId}`)
        .set('Cookie', adminToken)
        .send({ amount: 2000, notes: 'Updated salary' });

      expect(res.status).toBe(200);
      expect(res.body.record.amount).toBe(2000);
    });
  });

  describe('DELETE /api/records/:id (Admin)', () => {
    it('should soft-delete a record', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Record deleted successfully.');
    });

    it('should return 404 for already deleted record', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Cookie', adminToken);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/records/export', () => {
    it('should export CSV for admin', async () => {
      const res = await request(app)
        .get('/api/records/export')
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('should reject export for viewer', async () => {
      const res = await request(app)
        .get('/api/records/export')
        .set('Cookie', viewerToken);

      expect(res.status).toBe(403);
    });
  });
});
