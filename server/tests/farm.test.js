import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import app from '../src/app.js';
import Farm from '../src/models/Farm.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/auth.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Farm.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function registerUser(email) {
  const response = await request(app).post('/auth/register').send({
    name: 'Farm Owner',
    email,
    password: 'correct-password',
  });
  return response.body.data.accessToken;
}

async function createAdminToken() {
  const admin = await User.create({
    name: 'Farm Admin',
    email: 'admin@example.com',
    passwordHash: await hashPassword('correct-password'),
    role: 'admin',
  });
  const response = await request(app).post('/auth/login').send({
    email: admin.email,
    password: 'correct-password',
  });
  return response.body.data.accessToken;
}

function farmPayload(name = 'North Field') {
  return {
    name,
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    areaInAcres: 5.5,
    soilType: 'loamy',
    irrigationType: 'drip',
  };
}

describe('farm API', () => {
  it('creates and lists only the authenticated farmer\'s farms', async () => {
    const ownerToken = await registerUser('owner@example.com');
    await registerUser('other@example.com');

    const created = await request(app)
      .post('/farms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(farmPayload());

    expect(created.status).toBe(201);
    expect(created.body.data.farm.owner.email).toBe('owner@example.com');

    const listResponse = await request(app)
      .get('/farms')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.farms).toHaveLength(1);
    expect(listResponse.body.data.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it('prevents another farmer from reading, updating, or deleting a farm', async () => {
    const ownerToken = await registerUser('owner@example.com');
    const otherToken = await registerUser('other@example.com');
    const created = await request(app)
      .post('/farms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(farmPayload());
    const farmId = created.body.data.farm._id;

    const read = await request(app).get(`/farms/${farmId}`).set('Authorization', `Bearer ${otherToken}`);
    const update = await request(app).patch(`/farms/${farmId}`).set('Authorization', `Bearer ${otherToken}`).send({ name: 'Stolen Field' });
    const remove = await request(app).delete(`/farms/${farmId}`).set('Authorization', `Bearer ${otherToken}`);

    expect(read.status).toBe(404);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
    expect((await Farm.findById(farmId)).name).toBe('North Field');
  });

  it('allows an admin to list farms across owners', async () => {
    const firstToken = await registerUser('first@example.com');
    const secondToken = await registerUser('second@example.com');
    await request(app).post('/farms').set('Authorization', `Bearer ${firstToken}`).send(farmPayload('First Field'));
    await request(app).post('/farms').set('Authorization', `Bearer ${secondToken}`).send(farmPayload('Second Field'));
    const adminToken = await createAdminToken();

    const response = await request(app).get('/farms?limit=1').set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.farms).toHaveLength(1);
    expect(response.body.data.pagination).toMatchObject({ limit: 1, total: 2, totalPages: 2 });
  });
});
