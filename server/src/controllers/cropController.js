import {
  addActivity,
  createCrop,
  deleteCrop,
  getCrop,
  listCrops,
  removeActivity,
  updateCrop,
} from '../services/cropService.js';

export async function list(request, response) {
  const data = await listCrops(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function create(request, response) {
  const crop = await createCrop(request.user, request.body);
  response.status(201).json({ success: true, data: { crop } });
}

export async function getOne(request, response) {
  const crop = await getCrop(request.user, request.params.id);
  response.status(200).json({ success: true, data: { crop } });
}

export async function update(request, response) {
  const crop = await updateCrop(request.user, request.params.id, request.body);
  response.status(200).json({ success: true, data: { crop } });
}

export async function remove(request, response) {
  await deleteCrop(request.user, request.params.id);
  response.status(204).send();
}

export async function createActivity(request, response) {
  const crop = await addActivity(request.user, request.params.id, request.body);
  response.status(201).json({ success: true, data: { crop } });
}

export async function deleteActivity(request, response) {
  const crop = await removeActivity(request.user, request.params.id, request.params.activityId);
  response.status(200).json({ success: true, data: { crop } });
}
