import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import app from '../src/app.js';
import Comment from '../src/models/Comment.js';
import Post from '../src/models/Post.js';
import Report from '../src/models/Report.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/auth.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Promise.all([Comment.deleteMany({}), Post.deleteMany({}), Report.deleteMany({}), User.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function createIdentity(role, email) {
  const user = await User.create({ name: `${role} user`, email, passwordHash: await hashPassword('correct-password'), role });
  const response = await request(app).post('/auth/login').send({ email, password: 'correct-password' });
  return { user, token: response.body.data.accessToken };
}

describe('forum API routes', () => {
  it('covers post, comment, report, moderation, and access-control routes', async () => {
    const { token: farmerToken } = await createIdentity('farmer', 'forum-farmer@example.com');
    const { token: adminToken } = await createIdentity('admin', 'forum-admin@example.com');
    const { token: otherToken } = await createIdentity('farmer', 'forum-other@example.com');

    expect((await request(app).get('/forum/posts')).status).toBe(401);
    expect((await request(app).get('/forum/posts').set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);

    const created = await request(app).post('/forum/posts').set('Authorization', `Bearer ${farmerToken}`).send({
      title: 'Wheat field update',
      body: 'Sharing a field update and asking for irrigation suggestions.',
      category: 'crops',
    });
    expect(created.status).toBe(201);
    const postId = created.body.data.post._id;
    expect((await request(app).get(`/forum/posts/${postId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    expect((await request(app).patch(`/forum/posts/${postId}`).set('Authorization', `Bearer ${farmerToken}`).send({ title: 'Updated wheat field update' })).status).toBe(200);
    expect((await request(app).post(`/forum/posts/${postId}/like`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);
    expect((await request(app).get(`/forum/posts/${postId}/comments?page=1&limit=20`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(200);

    const comment = await request(app).post(`/forum/posts/${postId}/comments`).set('Authorization', `Bearer ${farmerToken}`).send({ body: 'Thank you for the update.' });
    expect(comment.status).toBe(201);
    const commentId = comment.body.data.comment._id;
    expect((await request(app).patch(`/forum/comments/${commentId}`).set('Authorization', `Bearer ${farmerToken}`).send({ body: 'Thank you for the helpful update.' })).status).toBe(200);
    expect((await request(app).delete(`/forum/comments/${commentId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(204);

    const report = await request(app).post('/forum/report').set('Authorization', `Bearer ${otherToken}`).send({
      targetType: 'post', targetId: postId, reason: 'Please review this example report.',
    });
    expect(report.status).toBe(201);
    const reportId = report.body.data.report._id;

    expect((await request(app).get('/forum/reports?status=pending').set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
    expect((await request(app).patch(`/forum/reports/${reportId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'reviewed' })).status).toBe(200);
    expect((await request(app).get('/admin/reports?status=reviewed').set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
    expect((await request(app).patch(`/admin/reports/${reportId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'dismissed' })).status).toBe(200);

    expect((await request(app).patch(`/forum/posts/${postId}/moderation`).set('Authorization', `Bearer ${adminToken}`).send({ isHidden: true })).status).toBe(200);
    expect((await request(app).get(`/forum/posts/${postId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(404);
    expect((await request(app).get(`/forum/posts/${postId}`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
    expect((await request(app).patch(`/forum/posts/${postId}/moderation`).set('Authorization', `Bearer ${adminToken}`).send({ isHidden: false })).status).toBe(200);

    const forbiddenEdit = await request(app).patch(`/forum/posts/${postId}`).set('Authorization', `Bearer ${otherToken}`).send({ title: 'Attempted edit' });
    expect(forbiddenEdit.status).toBe(403);
    expect((await request(app).delete(`/forum/posts/${postId}`).set('Authorization', `Bearer ${farmerToken}`)).status).toBe(204);
    expect(await Post.findById(postId)).toBeNull();
  });
});
