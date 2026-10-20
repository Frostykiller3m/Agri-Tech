import {
  closeConsultation,
  createConsultation,
  getConsultation,
  getConsultationImage,
  listConsultations,
  respondToConsultation,
} from '../services/consultationService.js';

export async function list(request, response) {
  const data = await listConsultations(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function getOne(request, response) {
  const consultation = await getConsultation(request.user, request.params.id);
  response.status(200).json({ success: true, data: { consultation } });
}

export async function create(request, response) {
  const consultation = await createConsultation(request.user, request.body, request.files);
  response.status(201).json({ success: true, data: { consultation } });
}

export async function addResponse(request, response) {
  const consultation = await respondToConsultation(request.user, request.params.id, request.body.message);
  response.status(200).json({ success: true, data: { consultation } });
}

export async function close(request, response) {
  const consultation = await closeConsultation(request.user, request.params.id);
  response.status(200).json({ success: true, data: { consultation } });
}

export async function getImage(request, response) {
  const { buffer, mimeType } = await getConsultationImage(request.user, request.params.id, request.params.filename);
  response.set({
    'Content-Type': mimeType,
    'Content-Length': buffer.length,
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  });
  response.status(200).send(buffer);
}
