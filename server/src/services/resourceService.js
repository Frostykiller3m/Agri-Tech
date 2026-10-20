import mongoose from 'mongoose';

import Resource from '../models/Resource.js';

function notFound() {
  const error = new Error('Resource not found');
  error.statusCode = 404;
  return error;
}

function ensureAdmin(user) {
  if (user.role !== 'admin') {
    const error = new Error('You do not have permission to manage resources');
    error.statusCode = 403;
    throw error;
  }
}

function escapedRegex(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export async function listResources(user, { search, category, status, page, limit }) {
  const filter = {
    ...(user.role === 'admin' ? (status ? { status } : {}) : { status: 'approved' }),
    ...(category ? { category } : {}),
    ...(search
      ? { $or: [{ name: escapedRegex(search) }, { description: escapedRegex(search) }] }
      : {}),
  };
  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .select(
        'name category description price stock unit imageUrl status createdBy createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name role')
      .lean(),
    Resource.countDocuments(filter),
  ]);
  return { resources, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getResource(user, id) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const resource = await Resource.findOne({
    _id: id,
    ...(user.role === 'admin' ? {} : { status: 'approved' }),
  })
    .select('-__v')
    .populate('createdBy', 'name role')
    .lean();
  if (!resource) throw notFound();
  return resource;
}

export async function createResource(user, resourceData) {
  ensureAdmin(user);
  const resource = await Resource.create({
    ...resourceData,
    createdBy: user._id,
    status: 'pending',
  });
  return resource.populate('createdBy', 'name role');
}

export async function updateResourceStatus(user, id, status) {
  ensureAdmin(user);
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const resource = await Resource.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true },
  ).populate('createdBy', 'name role');
  if (!resource) throw notFound();
  return resource;
}
