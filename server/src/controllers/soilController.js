import {
  createSoilReport,
  deleteSoilReport,
  getRecommendations,
  getSoilReport,
  listSoilReports,
  updateSoilReport,
} from '../services/soilService.js';

export async function list(request, response) {
  const data = await listSoilReports(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function create(request, response) {
  const report = await createSoilReport(request.user, request.body);
  response.status(201).json({ success: true, data: { report } });
}

export async function getOne(request, response) {
  const report = await getSoilReport(request.user, request.params.id);
  response.status(200).json({ success: true, data: { report } });
}

export async function update(request, response) {
  const report = await updateSoilReport(request.user, request.params.id, request.body);
  response.status(200).json({ success: true, data: { report } });
}

export async function remove(request, response) {
  await deleteSoilReport(request.user, request.params.id);
  response.status(204).send();
}

export async function recommendations(request, response) {
  const data = await getRecommendations(request.user, request.params.id);
  response.status(200).json({ success: true, data });
}
