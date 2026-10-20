import mongoose from 'mongoose';

import Order from '../models/Order.js';
import Resource from '../models/Resource.js';
import logger from '../utils/logger.js';

const transitions = {
  placed: ['approved', 'cancelled'],
  approved: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function scopedFilter(user) {
  return user.role === 'admin' ? {} : { user: user._id };
}

function ensureFarmer(user) {
  if (user.role !== 'farmer') throw httpError(403, 'Only farmers can place or cancel orders');
}

function ensureCanReadOrders(user) {
  if (!['farmer', 'admin'].includes(user.role))
    throw httpError(403, 'Experts cannot access orders');
}

async function restoreReservedStock(reserved) {
  const results = await Promise.allSettled(
    reserved.map(({ resource, qty }) =>
      Resource.updateOne({ _id: resource }, { $inc: { stock: qty } }),
    ),
  );
  results.forEach((result, index) => {
    if (result.status === 'rejected' || result.value.matchedCount !== 1) {
      logger.error('Could not restore reserved resource stock', {
        resourceId: String(reserved[index].resource),
        error: result.status === 'rejected' ? result.reason.message : 'Resource no longer exists',
      });
    }
  });
}

async function replenishOrderStock(order) {
  await restoreReservedStock(
    order.items.map((item) => ({ resource: item.resource, qty: item.qty })),
  );
}

export async function createOrder(user, { items, deliveryAddress }) {
  ensureFarmer(user);

  const quantities = new Map();
  for (const item of items) {
    const key = String(item.resource);
    quantities.set(key, (quantities.get(key) || 0) + item.qty);
  }
  const resourceIds = [...quantities.keys()].sort();
  const resources = await Resource.find({ _id: { $in: resourceIds }, status: 'approved' })
    .select('_id name unit price stock status')
    .lean();
  const resourcesById = new Map(resources.map((resource) => [String(resource._id), resource]));
  if (resources.length !== resourceIds.length)
    throw httpError(404, 'One or more resources are unavailable');

  const orderItems = resourceIds.map((id) => ({
    resource: resourcesById.get(id)._id,
    name: resourcesById.get(id).name,
    unit: resourcesById.get(id).unit,
    price: resourcesById.get(id).price,
    qty: quantities.get(id),
  }));
  const reserved = [];

  try {
    for (const item of orderItems) {
      const resource = resourcesById.get(String(item.resource));
      const updated = await Resource.findOneAndUpdate(
        {
          _id: item.resource,
          status: 'approved',
          price: resource.price,
          stock: { $gte: item.qty },
        },
        { $inc: { stock: -item.qty } },
        { new: true },
      ).select('_id');
      if (!updated)
        throw httpError(409, 'A resource is no longer available in the requested quantity');
      reserved.push({ resource: item.resource, qty: item.qty });
    }

    const total = Number(
      orderItems.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2),
    );
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      total,
      status: 'placed',
      statusHistory: [{ status: 'placed', at: new Date(), by: user._id }],
      deliveryAddress,
      paymentMethod: 'cod',
    });
    return order;
  } catch (error) {
    await restoreReservedStock(reserved);
    throw error;
  }
}

export async function listOrders(user, { page, limit, status }) {
  ensureCanReadOrders(user);
  const filter = { ...scopedFilter(user), ...(status ? { status } : {}) };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select(
        'user items total status statusHistory deliveryAddress paymentMethod createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .populate('statusHistory.by', 'name role')
      .lean(),
    Order.countDocuments(filter),
  ]);
  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getOrder(user, id) {
  ensureCanReadOrders(user);
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Order not found');
  const order = await Order.findOne({ _id: id, ...scopedFilter(user) })
    .populate('user', 'name email')
    .populate('statusHistory.by', 'name role')
    .lean();
  if (!order) throw httpError(404, 'Order not found');
  return order;
}

async function moveOrderStatus(user, id, nextStatus, allowedFrom) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Order not found');
  const filter = { _id: id, ...scopedFilter(user) };
  const current = await Order.findOne(filter).select('status items').lean();
  if (!current) throw httpError(404, 'Order not found');
  if (!allowedFrom.includes(current.status) || !transitions[current.status].includes(nextStatus)) {
    throw httpError(409, `Order cannot transition from ${current.status} to ${nextStatus}`);
  }

  const order = await Order.findOneAndUpdate(
    { ...filter, status: current.status },
    {
      $set: { status: nextStatus },
      $push: { statusHistory: { status: nextStatus, at: new Date(), by: user._id } },
    },
    { new: true, runValidators: true },
  )
    .populate('user', 'name email')
    .populate('statusHistory.by', 'name role')
    .lean();
  if (!order) throw httpError(409, 'Order status changed before this update could be applied');

  if (nextStatus === 'cancelled') await replenishOrderStock(current);
  return order;
}

export async function cancelOrder(user, id) {
  ensureFarmer(user);
  return moveOrderStatus(user, id, 'cancelled', ['placed']);
}

export async function updateOrderStatus(admin, id, nextStatus) {
  if (admin.role !== 'admin') throw httpError(403, 'Only admins can update order status');
  return moveOrderStatus(admin, id, nextStatus, Object.keys(transitions));
}
