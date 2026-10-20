import { createFarm, deleteFarm, getFarm, listFarms, updateFarm } from '../services/farmService.js';

export async function list(request, response) {
  const data = await listFarms(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function create(request, response) {
  const farm = await createFarm(request.user, request.body);
  response.status(201).json({ success: true, data: { farm } });
}

export async function getOne(request, response) {
  const farm = await getFarm(request.user, request.params.id);
  response.status(200).json({ success: true, data: { farm } });
}

export async function update(request, response) {
  const farm = await updateFarm(request.user, request.params.id, request.body);
  response.status(200).json({ success: true, data: { farm } });
}

export async function remove(request, response) {
  await deleteFarm(request.user, request.params.id);
  response.status(204).send();
}
