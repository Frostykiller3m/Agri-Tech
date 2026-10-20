import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const storageDirectory = fileURLToPath(new URL('../../uploads/consultations/', import.meta.url));
const mimeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function detectImageMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

export async function saveConsultationImages(files, consultationId) {
  if (!files?.length) return [];
  const prepared = files.map((file) => {
    const mimeType = detectImageMime(file.buffer);
    if (!mimeType || mimeType !== file.mimetype) {
      const error = new Error('Each upload must be a valid JPG, PNG, GIF, or WebP image');
      error.statusCode = 400;
      throw error;
    }
    const filename = `${randomUUID()}.${mimeExtensions[mimeType]}`;
    return { filename, mimeType, buffer: file.buffer };
  });

  await mkdir(storageDirectory, { recursive: true });
  const saved = [];
  try {
    for (const file of prepared) {
      await writeFile(path.join(storageDirectory, file.filename), file.buffer, { flag: 'wx' });
      saved.push(file.filename);
    }
  } catch (error) {
    await Promise.allSettled(saved.map((filename) => unlink(path.join(storageDirectory, filename))));
    throw error;
  }
  return prepared.map(({ filename }) => `/consultations/${consultationId}/images/${filename}`);
}

export async function deleteConsultationImages(imageUrls = []) {
  await Promise.allSettled(imageUrls.map((url) => {
    const filename = url.split('/').pop();
    if (!/^[0-9a-f-]{36}\.(?:jpg|png|gif|webp)$/i.test(filename)) return Promise.resolve();
    return unlink(path.join(storageDirectory, filename));
  }));
}

export async function readConsultationImage(filename) {
  const match = /^([0-9a-f-]{36})\.(jpg|png|gif|webp)$/i.exec(filename);
  if (!match) {
    const error = new Error('Image not found');
    error.statusCode = 404;
    throw error;
  }
  const buffer = await readFile(path.join(storageDirectory, filename));
  const mimeType = Object.entries(mimeExtensions).find(([, extension]) => extension === match[2].toLowerCase())?.[0];
  return { buffer, mimeType };
}
