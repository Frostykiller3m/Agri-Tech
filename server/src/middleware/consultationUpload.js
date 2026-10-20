import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 2 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, GIF, and WebP images are accepted');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
}).array('images', 3);

export function uploadConsultationImages(request, response, next) {
  upload(request, response, (error) => {
    if (error) {
      error.statusCode ||= 400;
      if (error.code === 'LIMIT_FILE_SIZE') error.message = 'Each image must be 2 MB or smaller';
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') error.message = 'A maximum of 3 images is allowed';
      return next(error);
    }
    return next();
  });
}
