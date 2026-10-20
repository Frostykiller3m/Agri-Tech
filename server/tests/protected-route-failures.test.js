import request from 'supertest';

import app from '../src/app.js';

const id = '0123456789abcdef01234567';
const protectedEndpoints = [
  ['GET', '/auth/me'], ['PATCH', '/auth/me/language'],
  ['GET', '/admin/ping'], ['GET', '/admin/stats'], ['GET', '/admin/users'], ['PATCH', `/admin/users/${id}`],
  ['GET', '/admin/resources'], ['PATCH', `/admin/resources/${id}/status`], ['GET', '/admin/orders'],
  ['PATCH', `/admin/orders/${id}/status`], ['POST', '/admin/alerts'], ['GET', '/admin/reports'], ['PATCH', `/admin/reports/${id}`],
  ['GET', '/farms'], ['POST', '/farms'], ['GET', `/farms/${id}`], ['PATCH', `/farms/${id}`], ['DELETE', `/farms/${id}`],
  ['GET', '/crops'], ['POST', '/crops'], ['GET', `/crops/${id}`], ['PATCH', `/crops/${id}`], ['DELETE', `/crops/${id}`],
  ['POST', `/crops/${id}/activities`], ['DELETE', `/crops/${id}/activities/${id}`],
  ['GET', '/soil'], ['POST', '/soil'], ['GET', `/soil/${id}`], ['GET', `/soil/${id}/recommendations`],
  ['PATCH', `/soil/${id}`], ['DELETE', `/soil/${id}`], ['GET', `/weather/${id}`],
  ['GET', '/alerts'], ['POST', '/alerts'], ['GET', '/notifications'], ['PATCH', `/notifications/${id}/read`],
  ['GET', '/resources'], ['POST', '/resources'], ['GET', `/resources/${id}`], ['PATCH', `/resources/${id}/status`],
  ['GET', '/orders'], ['POST', '/orders'], ['GET', `/orders/${id}`], ['PATCH', `/orders/${id}/cancel`], ['PATCH', `/orders/${id}/status`],
  ['GET', '/forum/posts'], ['POST', '/forum/posts'], ['GET', `/forum/posts/${id}`], ['PATCH', `/forum/posts/${id}`],
  ['DELETE', `/forum/posts/${id}`], ['POST', `/forum/posts/${id}/like`], ['PATCH', `/forum/posts/${id}/moderation`],
  ['GET', `/forum/posts/${id}/comments`], ['POST', `/forum/posts/${id}/comments`], ['PATCH', `/forum/comments/${id}`],
  ['DELETE', `/forum/comments/${id}`], ['POST', '/forum/report'], ['GET', '/forum/reports'], ['PATCH', `/forum/reports/${id}`],
  ['GET', '/consultations'], ['POST', '/consultations'], ['GET', `/consultations/${id}`],
  ['GET', `/consultations/${id}/images/00000000-0000-4000-8000-000000000000.jpg`],
  ['POST', `/consultations/${id}/responses`], ['PATCH', `/consultations/${id}/close`],
];

describe('protected endpoint authentication failures', () => {
  it.each(protectedEndpoints)('%s %s rejects a missing bearer token with the standard error envelope', async (method, path) => {
    const response = await request(app)[method.toLowerCase()](path);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, message: expect.any(String), errors: [] });
  });

  it('rejects refresh without an httpOnly refresh-cookie session', async () => {
    const response = await request(app).post('/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, message: expect.any(String), errors: [] });
  });
});
