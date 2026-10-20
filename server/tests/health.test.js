import request from 'supertest';

import app from '../src/app.js';

describe('GET /health', () => {
  it('returns the service health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        service: 'agri-tech-api',
      },
    });
  });
});

describe('development CORS origins', () => {
  it.each(['http://localhost:5173', 'http://127.0.0.1:5173'])(
    'allows the local preview origin %s',
    async (origin) => {
      const response = await request(app)
        .options('/auth/login')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    },
  );

  it('does not allow unrelated origins', async () => {
    const response = await request(app)
      .options('/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
