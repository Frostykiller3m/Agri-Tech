import { listNotifications, markNotificationRead } from '../services/alertService.js';

export async function getNotifications(request, response) {
  const result = await listNotifications(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data: result });
}

export async function readNotification(request, response) {
  const notification = await markNotificationRead(request.user, request.params.id);
  response.status(200).json({ success: true, data: { notification } });
}
