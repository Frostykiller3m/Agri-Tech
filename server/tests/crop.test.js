import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import app from '../src/app.js';
import Crop from '../src/models/Crop.js';
import User from '../src/models/User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Crop.deleteMany({});
  await mongoose.connection.collection('farms').deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function registerUser(email) {
  const response = await request(app).post('/auth/register').send({
    name: 'Crop Owner',
    email,
    password: 'correct-password',
  });
  return response.body.data.accessToken;
}

async function createFarm(token) {
  const response = await request(app).post('/farms').set('Authorization', `Bearer ${token}`).send({
    name: 'Crop Farm',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    areaInAcres: 5,
    soilType: 'loamy',
    irrigationType: 'drip',
  });
  return response.body.data.farm._id;
}

function cropPayload(farmId) {
  return {
    farmId,
    name: 'Wheat',
    variety: 'HD 2967',
    sowingDate: '2026-06-01',
    expectedHarvestDate: '2026-10-01',
    status: 'planned',
    yieldKg: 100,
  };
}

describe('crop API', () => {
  it('validates harvest dates and supports activity add/remove', async () => {
    const token = await registerUser('crop-owner@example.com');
    const farmId = await createFarm(token);

    const invalid = await request(app).post('/crops').set('Authorization', `Bearer ${token}`).send({
      ...cropPayload(farmId),
      expectedHarvestDate: '2026-05-01',
    });
    expect(invalid.status).toBe(400);

    const created = await request(app).post('/crops').set('Authorization', `Bearer ${token}`).send(cropPayload(farmId));
    expect(created.status).toBe(201);
    const cropId = created.body.data.crop._id;

    const activity = await request(app)
      .post(`/crops/${cropId}/activities`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'irrigation', date: '2026-06-15', notes: 'First irrigation', quantity: 20 });
    expect(activity.status).toBe(201);
    const activityId = activity.body.data.crop.activityLog[0]._id;

    const removed = await request(app)
      .delete(`/crops/${cropId}/activities/${activityId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.crop.activityLog).toHaveLength(0);
  });

  it('enforces ownership through the crop farm', async () => {
    const ownerToken = await registerUser('crop-owner@example.com');
    const otherToken = await registerUser('other-owner@example.com');
    const farmId = await createFarm(ownerToken);
    const created = await request(app).post('/crops').set('Authorization', `Bearer ${ownerToken}`).send(cropPayload(farmId));
    const cropId = created.body.data.crop._id;

    const list = await request(app).get(`/crops?farmId=${farmId}`).set('Authorization', `Bearer ${otherToken}`);
    const read = await request(app).get(`/crops/${cropId}`).set('Authorization', `Bearer ${otherToken}`);
    const update = await request(app).patch(`/crops/${cropId}`).set('Authorization', `Bearer ${otherToken}`).send({ status: 'growing' });
    const remove = await request(app).delete(`/crops/${cropId}`).set('Authorization', `Bearer ${otherToken}`);

    expect(list.status).toBe(404);
    expect(read.status).toBe(404);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
  });
});
