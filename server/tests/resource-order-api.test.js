import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import app from '../src/app.js';
import Order from '../src/models/Order.js';
import Resource from '../src/models/Resource.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/auth.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Promise.all([Order.deleteMany({}), Resource.deleteMany({}), User.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function tokenFor(role, email) {
  const user = await User.create({
    name: role === 'admin' ? 'API Admin' : 'API Farmer',
    email,
    passwordHash: await hashPassword('correct-password'),
    role,
  });
  const login = await request(app).post('/auth/login').send({ email, password: 'correct-password' });
  expect(login.status).toBe(200);
  expect(login.body.data.user.passwordHash).toBeUndefined();
  return { user, token: login.body.data.accessToken };
}

const address = {
  recipientName: 'API Farmer',
  phone: '+919876543210',
  addressLine1: '1 Farm Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560001',
};

describe('resource and order API routes', () => {
  it('covers resource approval, server-priced orders, status transitions, cancellation, and failures', async () => {
    const { token: adminToken } = await tokenFor('admin', 'api-admin@example.com');
    const { token: farmerToken } = await tokenFor('farmer', 'api-farmer@example.com');
    const { token: expertToken } = await tokenFor('expert', 'api-expert@example.com');

    const unauthenticated = await request(app).get('/resources');
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body).toMatchObject({ success: false, errors: [] });

    const deniedCreate = await request(app).post('/resources').set('Authorization', `Bearer ${farmerToken}`).send({});
    expect(deniedCreate.status).toBe(403);

    const created = await request(app).post('/resources').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Certified wheat seed',
      category: 'seed',
      description: 'Certified seed suitable for a local field trial.',
      price: 500,
      stock: 8,
      unit: 'kg',
      imageUrl: '',
    });
    expect(created.status).toBe(201);
    const resourceId = created.body.data.resource._id;

    expect((await request(app).get('/admin/resources?status=pending').set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
    expect((await request(app).get('/resources').set('Authorization', `Bearer ${farmerToken}`)).body.data.resources).toHaveLength(0);
    expect((await request(app).get(`/resources/${resourceId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(404);

    const approved = await request(app).patch(`/admin/resources/${resourceId}/status`)
      .set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });
    expect(approved.status).toBe(200);
    expect((await request(app).get(`/resources/${resourceId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    expect((await request(app).get('/resources?search=wheat&category=seed').set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    expect((await request(app).patch(`/resources/${resourceId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'rejected' })).status).toBe(200);
    expect((await request(app).get(`/resources/${resourceId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(404);
    await request(app).patch(`/resources/${resourceId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });

    const orderPayload = {
      items: [{ resource: resourceId, qty: 2, price: 1 }],
      deliveryAddress: address,
    };
    const placed = await request(app).post('/orders').set('Authorization', `Bearer ${farmerToken}`).send(orderPayload);
    expect(placed.status).toBe(201);
    expect(placed.body.data.order).toMatchObject({ total: 1000, paymentMethod: 'cod', status: 'placed' });
    const orderId = placed.body.data.order._id;

    expect((await request(app).get('/orders?page=1&limit=20').set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    expect((await request(app).get(`/orders/${orderId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    expect((await request(app).get('/orders').set('Authorization', `Bearer ${expertToken}`)).status).toBe(403);
    expect((await request(app).get('/admin/orders?page=1&limit=20').set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);

    const approvedOrder = await request(app).patch(`/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });
    expect(approvedOrder.status).toBe(200);
    expect((await request(app).patch(`/orders/${orderId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'shipped' })).status).toBe(200);
    expect((await request(app).patch(`/admin/orders/${orderId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'delivered' })).status).toBe(200);
    expect((await request(app).patch(`/orders/${orderId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'cancelled' })).status).toBe(409);

    const secondOrder = await request(app).post('/orders').set('Authorization', `Bearer ${farmerToken}`).send({
      ...orderPayload,
      items: [{ resource: resourceId, qty: 1 }],
    });
    expect(secondOrder.status).toBe(201);
    expect((await request(app).patch(`/orders/${secondOrder.body.data.order._id}/cancel`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);

    const insufficient = await request(app).post('/orders').set('Authorization', `Bearer ${farmerToken}`).send({
      ...orderPayload,
      items: [{ resource: resourceId, qty: 100 }],
    });
    expect(insufficient.status).toBe(409);
    expect((await Resource.findById(resourceId)).stock).toBe(6);

    const invalidResource = await request(app).get('/resources/not-an-id').set('Authorization', `Bearer ${adminToken}`);
    expect(invalidResource.status).toBe(400);
  });
});
