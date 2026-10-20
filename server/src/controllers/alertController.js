import { createRegionalAlert, listAlerts } from '../services/alertService.js';

export async function createAlert(request, response) {
  const result = await createRegionalAlert(request.user, request.body);
  response.status(201).json({ success: true, data: result });
}

export async function getAlerts(request, response) {
  const result = await listAlerts(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data: result });
}
