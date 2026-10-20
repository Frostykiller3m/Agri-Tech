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
