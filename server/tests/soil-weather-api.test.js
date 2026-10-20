import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import app from '../src/app.js';
import Farm from '../src/models/Farm.js';
import SoilReport from '../src/models/SoilReport.js';
import User from '../src/models/User.js';
import WeatherData from '../src/models/WeatherData.js';
import { hashPassword } from '../src/utils/auth.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  jest.restoreAllMocks();
  await Promise.all([Farm.deleteMany({}), SoilReport.deleteMany({}), User.deleteMany({}), WeatherData.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function makeFarmer(email) {
  await User.create({ name: 'Soil Farmer', email, passwordHash: await hashPassword('correct-password') });
  const response = await request(app).post('/auth/login').send({ email, password: 'correct-password' });
  return response.body.data.accessToken;
}

async function makeFarm(token) {
  const response = await request(app).post('/farms').set('Authorization', `Bearer ${token}`).send({
    name: 'Soil Test Field', location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    district: 'Bengaluru Urban', state: 'Karnataka', areaInAcres: 3,
    soilType: 'loamy', irrigationType: 'drip',
  });
  return response.body.data.farm._id;
}

describe('soil and weather API routes', () => {
  it('covers soil report CRUD and recommendations, weather cache, validation, and farm ownership', async () => {
    const farmerToken = await makeFarmer('soil-farmer@example.com');
    const otherToken = await makeFarmer('soil-other@example.com');
    const farmId = await makeFarm(farmerToken);
    const payload = {
      farmId, date: '2026-06-15', pH: 5.2, nitrogen: 20, phosphorus: 30,
      potassium: 40, moisture: 25, organicCarbon: 1.2,
    };

    expect((await request(app).post('/soil').set('Authorization', `Bearer ${farmerToken}`).send({ ...payload, pH: 15 })).status).toBe(400);
    const created = await request(app).post('/soil').set('Authorization', `Bearer ${farmerToken}`).send(payload);
    expect(created.status).toBe(201);
    const reportId = created.body.data.report._id;
    expect((await request(app).get(`/soil?farmId=${farmId}&page=1&limit=20`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    expect((await request(app).get(`/soil/${reportId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    const recommendations = await request(app).get(`/soil/${reportId}/recommendations`).set('Authorization', `Bearer ${farmerToken}`);
    expect(recommendations.status).toBe(200);
    expect(recommendations.body.data.recommendations).toEqual(expect.arrayContaining([
      expect.objectContaining({ parameter: 'pH', status: expect.any(String), advice: expect.any(String) }),
    ]));
    expect((await request(app).patch(`/soil/${reportId}`).set('Authorization', `Bearer ${farmerToken}`).send({ pH: 6.4 })).status).toBe(200);
    expect((await request(app).get(`/soil/${reportId}`).set('Authorization', `Bearer ${otherToken}`)).status).toBe(404);
    expect((await request(app).delete(`/soil/${reportId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(204);
    expect((await request(app).delete(`/soil/${reportId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(404);

    const forecast = {
      current: { temperature_2m: 22, relative_humidity_2m: 70, apparent_temperature: 23, is_day: 1, precipitation: 0, weather_code: 1, wind_speed_10m: 4 },
      daily: { time: ['2026-06-15'], temperature_2m_max: [26], temperature_2m_min: [18], precipitation_sum: [0], precipitation_probability_max: [10], weather_code: [1] },
    };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => forecast });
    const weatherPath = `/weather/${farmId}?cacheScope=postman-cache-scope-012345`;
    const fresh = await request(app).get(weatherPath).set('Authorization', `Bearer ${farmerToken}`);
    const cached = await request(app).get(weatherPath).set('Authorization', `Bearer ${farmerToken}`);
    expect(fresh.status).toBe(200);
    expect(fresh.body.data.weather.stale).toBe(false);
    expect(cached.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await request(app).get(`/weather/${farmId}?cacheScope=bad`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(400);
    expect((await request(app).get(`/weather/${farmId}`).set('Authorization', `Bearer ${otherToken}`)).status).toBe(404);
  });
});
