import { cancelOrder, createOrder, getOrder, listOrders, updateOrderStatus } from '../services/orderService.js';

export async function list(request, response) {
  const data = await listOrders(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function getOne(request, response) {
  const order = await getOrder(request.user, request.params.id);
  response.status(200).json({ success: true, data: { order } });
}

export async function create(request, response) {
  const order = await createOrder(request.user, request.body);
  response.status(201).json({ success: true, data: { order } });
}

export async function cancel(request, response) {
  const order = await cancelOrder(request.user, request.params.id);
  response.status(200).json({ success: true, data: { order } });
}

export async function updateStatus(request, response) {
  const order = await updateOrderStatus(request.user, request.params.id, request.body.status);
  response.status(200).json({ success: true, data: { order } });
}
