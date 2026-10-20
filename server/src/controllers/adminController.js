import { createRegionalAlert } from '../services/alertService.js';
import { getAdminStats, listUsers, updateUser } from '../services/adminService.js';
import { listOrders, updateOrderStatus } from '../services/orderService.js';
import { listResources, updateResourceStatus } from '../services/resourceService.js';
import { listReports, updateReportStatus } from '../services/forumService.js';

export async function stats(_request, response) {
  response.status(200).json({ success: true, data: await getAdminStats() });
}

export async function users(request, response) {
  response.status(200).json({ success: true, data: await listUsers(request.validatedQuery) });
}

export async function updateUserRoute(request, response) {
  const user = await updateUser(request.user, request.params.id, request.body);
  response.status(200).json({ success: true, data: { user } });
}

export async function resourceQueue(request, response) {
  response.status(200).json({ success: true, data: await listResources(request.user, request.validatedQuery) });
}

export async function resourceStatus(request, response) {
  const resource = await updateResourceStatus(request.user, request.params.id, request.body.status);
  response.status(200).json({ success: true, data: { resource } });
}

export async function orders(request, response) {
  response.status(200).json({ success: true, data: await listOrders(request.user, request.validatedQuery) });
}

export async function orderStatus(request, response) {
  const order = await updateOrderStatus(request.user, request.params.id, request.body.status);
  response.status(200).json({ success: true, data: { order } });
}

export async function publishAlert(request, response) {
  const data = await createRegionalAlert(request.user, request.body);
  response.status(201).json({ success: true, data });
}

export async function reports(request, response) {
  response.status(200).json({ success: true, data: await listReports(request.user, request.validatedQuery) });
}

export async function reportStatus(request, response) {
  const report = await updateReportStatus(request.user, request.params.id, request.body.status);
  response.status(200).json({ success: true, data: { report } });
}
