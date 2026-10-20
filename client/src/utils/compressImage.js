const MAX_DIMENSION = 1600;
const COMPRESS_THRESHOLD = 350 * 1024;

export async function compressImage(file) {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= COMPRESS_THRESHOLD) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, 0.82));
    if (!blob || blob.size >= file.size) return file;
    const extension = outputType === 'image/png' ? '.png' : '.jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}${extension}`, {
      type: outputType,
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
