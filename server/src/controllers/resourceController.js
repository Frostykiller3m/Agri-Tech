import { createResource, getResource, listResources, updateResourceStatus } from '../services/resourceService.js';

export async function list(request, response) {
  const data = await listResources(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function getOne(request, response) {
  const resource = await getResource(request.user, request.params.id);
  response.status(200).json({ success: true, data: { resource } });
}

export async function create(request, response) {
  const resource = await createResource(request.user, request.body);
  response.status(201).json({ success: true, data: { resource } });
}

export async function updateStatus(request, response) {
  const resource = await updateResourceStatus(request.user, request.params.id, request.body.status);
  response.status(200).json({ success: true, data: { resource } });
}
