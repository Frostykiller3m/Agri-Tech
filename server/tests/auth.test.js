import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import app from '../src/app.js';
import User from '../src/models/User.js';

let mongoServer;

jest.setTimeout(120000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

async function registerFarmer(overrides = {}) {
  return request(app)
    .post('/auth/register')
    .send({
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: 'correct-password',
      ...overrides,
    });
}

describe('authentication API', () => {
  it('registers a farmer and sets an httpOnly refresh cookie', async () => {
    const response = await registerFarmer();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: { email: 'farmer@example.com', role: 'farmer' },
        accessToken: expect.any(String),
      },
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
  });

  it('rejects duplicate email registration', async () => {
    await registerFarmer();

    const response = await registerFarmer({ name: 'Another Farmer' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ success: false, errors: [] });
  });

  it('rejects a bad password at validation and login', async () => {
    const shortPassword = await registerFarmer({ password: 'short' });
    expect(shortPassword.status).toBe(400);

    await registerFarmer();
    const badLogin = await request(app).post('/auth/login').send({
      email: 'farmer@example.com',
      password: 'wrong-password',
    });

    expect(badLogin.status).toBe(401);
    expect(badLogin.body.message).toBe('Invalid email or password');
  });

  it('rejects a NoSQL operator supplied as the login password', async () => {
    await registerFarmer();
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'farmer@example.com',
        password: { $gt: '' },
      });

    expect([400, 401]).toContain(response.status);
    expect(response.body.data?.accessToken).toBeUndefined();
  });

  it('logs in and can refresh after a page reload', async () => {
    await registerFarmer();
    const login = await request(app).post('/auth/login').send({
      email: 'farmer@example.com',
      password: 'correct-password',
    });

    expect(login.status).toBe(200);
    const refresh = await request(app)
      .post('/auth/refresh')
      .set('Cookie', login.headers['set-cookie']);

    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toEqual(expect.any(String));
    expect(refresh.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('returns the authenticated user from /auth/me', async () => {
    const registration = await registerFarmer();

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${registration.body.data.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      email: 'farmer@example.com',
      role: 'farmer',
    });
  });

  it('allows an authenticated user to save a language preference', async () => {
    const registration = await registerFarmer();

    const response = await request(app)
      .patch('/auth/me/language')
      .set('Authorization', `Bearer ${registration.body.data.accessToken}`)
      .send({ language: 'hi' });

    expect(response.status).toBe(200);
    expect(response.body.data.user.language).toBe('hi');
  });

  it('rejects a farmer from an admin-only route with 403', async () => {
    const registration = await registerFarmer();

    const response = await request(app)
      .get('/admin/ping')
      .set('Authorization', `Bearer ${registration.body.data.accessToken}`);

    expect(response.status).toBe(403);
  });

  it('rejects public attempts to register an admin role', async () => {
    const response = await registerFarmer({ role: 'admin' });

    expect(response.status).toBe(400);
  });
});
