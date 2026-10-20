import mongoose from 'mongoose';

import Consultation from '../models/Consultation.js';
import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';
import { sanitizePlainText } from '../utils/sanitizeText.js';
import {
  deleteConsultationImages,
  readConsultationImage,
  saveConsultationImages,
} from './storageService.js';

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Consultation not found');
}

function canRespond(user) {
  return user.role === 'admin' || user.role === 'expert';
}

function canReadAll(user) {
  return user.role === 'admin';
}

function safeText(value, minimum, label) {
  const sanitized = sanitizePlainText(value);
  if (sanitized.length < minimum) throw httpError(400, `${label} is too short after sanitization`);
  return sanitized;
}

function populated(query) {
  return query
    .populate('farmer', 'name role')
    .populate('farm', 'name district state')
    .populate('crop', 'name variety')
    .populate('responses.responder', 'name role');
}

export async function createConsultation(user, data, files = []) {
  if (user.role !== 'farmer') throw httpError(403, 'Only farmers can create consultations');
  let farm = null;
  let crop = null;
  if (data.farmId) {
    farm = await Farm.findOne({ _id: data.farmId, owner: user._id }).select('_id').lean();
    if (!farm) throw httpError(404, 'Farm not found');
  }
  if (data.cropId) {
    crop = await Crop.findOne({
      _id: data.cropId,
      owner: user._id,
      ...(farm ? { farm: farm._id } : {}),
    })
      .select('_id farm')
      .lean();
    if (!crop) throw httpError(404, 'Crop not found');
    if (!farm) {
      farm = await Farm.findOne({ _id: crop.farm, owner: user._id }).select('_id').lean();
      if (!farm) throw httpError(404, 'Farm not found');
    }
  }

  const consultationId = new mongoose.Types.ObjectId();
  const imageUrls = await saveConsultationImages(files, consultationId);
  try {
    const consultation = await Consultation.create({
      _id: consultationId,
      farmer: user._id,
      farm: farm?._id || null,
      crop: crop?._id || null,
      topic: safeText(data.topic, 3, 'Topic'),
      description: safeText(data.description, 5, 'Description'),
      imageUrls,
    });
    return populated(Consultation.findById(consultation._id)).lean();
  } catch (error) {
    await deleteConsultationImages(imageUrls);
    throw error;
  }
}

export async function listConsultations(user, { status, page, limit }) {
  const filter = {
    ...(canReadAll(user) ? {} : user.role === 'expert' ? {} : { farmer: user._id }),
    ...(user.role === 'expert' ? { status: 'open' } : status ? { status } : {}),
  };
  const [consultations, total] = await Promise.all([
    populated(
      Consultation.find(filter)
        .select('farmer farm crop topic description imageUrls status responses createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ).lean(),
    Consultation.countDocuments(filter),
  ]);
  return {
    consultations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getConsultation(user, id) {
  ensureId(id);
  const consultation = await populated(
    Consultation.findOne({
      _id: id,
      ...(canReadAll(user)
        ? {}
        : user.role === 'expert'
          ? { status: 'open' }
          : { farmer: user._id }),
    }),
  ).lean();
  if (!consultation) throw httpError(404, 'Consultation not found');
  return consultation;
}

export async function getConsultationImage(user, id, filename) {
  const consultation = await getConsultation(user, id);
  const imageUrl = `/consultations/${id}/images/${filename}`;
  if (!consultation.imageUrls.includes(imageUrl)) throw httpError(404, 'Image not found');
  try {
    return await readConsultationImage(filename);
  } catch (error) {
    if (error.code === 'ENOENT') throw httpError(404, 'Image not found');
    throw error;
  }
}

export async function respondToConsultation(user, id, message) {
  if (!canRespond(user)) throw httpError(403, 'Only admins and experts can respond');
  ensureId(id);
  const safeMessage = safeText(message, 1, 'Response message');
  const consultation = await populated(
    Consultation.findOneAndUpdate(
      { _id: id, status: user.role === 'expert' ? 'open' : { $in: ['open', 'answered'] } },
      {
        $set: { status: 'answered' },
        $push: { responses: { responder: user._id, message: safeMessage, at: new Date() } },
      },
      { new: true, runValidators: true },
    ),
  ).lean();
  if (!consultation) {
    const exists = await Consultation.exists({ _id: id });
    if (!exists) throw httpError(404, 'Consultation not found');
    throw httpError(409, 'Closed consultations cannot receive new responses');
  }
  return consultation;
}

export async function closeConsultation(user, id) {
  if (user.role !== 'farmer') throw httpError(403, 'Only the farmer can close a consultation');
  ensureId(id);
  const consultation = await populated(
    Consultation.findOneAndUpdate(
      { _id: id, farmer: user._id, status: { $in: ['open', 'answered'] } },
      { $set: { status: 'closed' } },
      { new: true, runValidators: true },
    ),
  ).lean();
  if (!consultation) {
    const owned = await Consultation.exists({ _id: id, farmer: user._id });
    if (!owned) throw httpError(404, 'Consultation not found');
    throw httpError(409, 'Consultation is already closed');
  }
  return consultation;
}
