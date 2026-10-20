import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import app from '../src/app.js';
import Alert from '../src/models/Alert.js';
import Consultation from '../src/models/Consultation.js';
import Farm from '../src/models/Farm.js';
import Notification from '../src/models/Notification.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/auth.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Promise.all([
    Alert.deleteMany({}),
    Consultation.deleteMany({}),
    Farm.deleteMany({}),
    Notification.deleteMany({}),
    User.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function identity(role, email) {
  const user = await User.create({
    name: `${role} user`,
    email,
    passwordHash: await hashPassword('correct-password'),
    role,
  });
  const login = await request(app)
    .post('/auth/login')
    .send({ email, password: 'correct-password' });
  return { user, token: login.body.data.accessToken };
}

describe('consultation, alert, notification, and admin routes', () => {
  it('covers consultations, role response rules, alerts, notifications, and admin user/dashboard routes', async () => {
    const { token: farmerToken } = await identity('farmer', 'workflow-farmer@example.com');
    const { token: expertToken } = await identity('expert', 'workflow-expert@example.com');
    const { user: admin, token: adminToken } = await identity(
      'admin',
      'workflow-admin@example.com',
    );
    const { token: strangerToken } = await identity('farmer', 'workflow-stranger@example.com');
    const { user: targetUser } = await identity('farmer', 'workflow-target@example.com');

    expect((await request(app).get('/consultations')).status).toBe(401);
    const farmResponse = await request(app)
      .post('/farms')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        name: 'Consultation Field',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        areaInAcres: 4,
        soilType: 'loamy',
        irrigationType: 'drip',
      });
    const farmId = farmResponse.body.data.farm._id;

    const created = await request(app)
      .post('/consultations')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        farmId,
        topic: 'Leaves turning yellow',
        description: 'Lower leaves are turning yellow after recent rain.',
      });
    expect(created.status).toBe(201);
    const consultationId = created.body.data.consultation._id;
    expect(
      (
        await request(app)
          .get('/consultations?status=open')
          .set('Authorization', `Bearer ${farmerToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/consultations/${consultationId}`)
          .set('Authorization', `Bearer ${farmerToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/consultations/${consultationId}`)
          .set('Authorization', `Bearer ${strangerToken}`)
      ).status,
    ).toBe(404);

    const farmerResponseDenied = await request(app)
      .post(`/consultations/${consultationId}/responses`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ message: 'A response from the farmer is forbidden.' });
    expect(farmerResponseDenied.status).toBe(403);
    expect(
      (
        await request(app)
          .get('/consultations?status=open')
          .set('Authorization', `Bearer ${expertToken}`)
      ).status,
    ).toBe(200);
    const answered = await request(app)
      .post(`/consultations/${consultationId}/responses`)
      .set('Authorization', `Bearer ${expertToken}`)
      .send({ message: 'Check root moisture and drainage.' });
    expect(answered.status).toBe(200);
    expect(answered.body.data.consultation.status).toBe('answered');
    expect(
      (
        await request(app)
          .patch(`/consultations/${consultationId}/close`)
          .set('Authorization', `Bearer ${farmerToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .patch(`/consultations/${consultationId}/close`)
          .set('Authorization', `Bearer ${farmerToken}`)
      ).status,
    ).toBe(409);

    const secondConsultation = await request(app)
      .post('/consultations')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        topic: 'Soil drainage question',
        description: 'Water remains in one corner of this field after irrigation.',
      });
    const secondId = secondConsultation.body.data.consultation._id;
    expect(
      (
        await request(app)
          .post(`/consultations/${secondId}/responses`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ message: 'Please check the field slope.' })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/consultations/${secondId}/images/invalid.txt`)
          .set('Authorization', `Bearer ${adminToken}`)
      ).status,
    ).toBe(400);

    expect(
      (await request(app).get('/admin/ping').set('Authorization', `Bearer ${adminToken}`)).status,
    ).toBe(200);
    expect(
      (await request(app).get('/admin/stats').set('Authorization', `Bearer ${adminToken}`)).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get('/admin/users?search=workflow&page=1&limit=20')
          .set('Authorization', `Bearer ${adminToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .patch(`/admin/users/${targetUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .patch(`/admin/users/${admin._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false })
      ).status,
    ).toBe(409);

    const adminAlert = await request(app)
      .post('/admin/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'general',
        severity: 'medium',
        title: 'Karnataka field advisory',
        message: 'Check local conditions before scheduling irrigation.',
        region: { state: 'Karnataka', district: 'Bengaluru Urban' },
        cropFilter: [],
      });
    expect(adminAlert.status).toBe(201);
    expect(
      (
        await request(app)
          .get('/alerts?page=1&limit=20')
          .set('Authorization', `Bearer ${farmerToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get('/alerts?page=1&limit=20')
          .set('Authorization', `Bearer ${adminToken}`)
      ).status,
    ).toBe(200);

    const notifications = await request(app)
      .get('/notifications?page=1&limit=20')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(notifications.status).toBe(200);
    expect(notifications.body.data.notifications).toHaveLength(1);
    const notificationId = notifications.body.data.notifications[0]._id;
    expect(
      (
        await request(app)
          .patch(`/notifications/${notificationId}/read`)
          .set('Authorization', `Bearer ${farmerToken}`)
      ).status,
    ).toBe(200);

    const expertAlert = await request(app)
      .post('/alerts')
      .set('Authorization', `Bearer ${expertToken}`)
      .send({
        type: 'pest',
        severity: 'low',
        title: 'Pest scouting reminder',
        message: 'Inspect crop leaves for early pest symptoms.',
        region: { state: 'Karnataka' },
        cropFilter: [],
      });
    expect(expertAlert.status).toBe(201);
    const forbiddenExpertAlert = await request(app)
      .post('/alerts')
      .set('Authorization', `Bearer ${expertToken}`)
      .send({
        type: 'weather',
        title: 'Weather alert',
        message: 'This category is admin-only for alerts.',
        region: { state: 'Karnataka' },
      });
    expect(forbiddenExpertAlert.status).toBe(400);
  });
});
