const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const { getR2Client, isR2Enabled } = require('../config/r2');

/**
 * Configure multer storage
 * Uses R2 if configured, otherwise uses local disk
 */

function getStorage() {
  const r2Client = getR2Client();

  if (r2Client && isR2Enabled()) {
    // Use Cloudflare R2 (S3-compatible)
    console.log('Using Cloudflare R2 for file storage');

    return multerS3({
      s3: r2Client,
      bucket: process.env.R2_BUCKET_NAME,
      metadata: (req, file, cb) => {
        cb(null, {
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        });
      },
      key: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const filename = `audio-${uniqueSuffix}${extension}`;
        cb(null, filename);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    });
  } else {
    // Use local disk storage (fallback)
    console.log('Using local disk for file storage');

    const uploadDir = process.env.UPLOAD_DIR || './uploads/audio';

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
      },
    });
  }
}

const fileFilter = (req, file, cb) => {
  const allowedFormats = (process.env.ALLOWED_AUDIO_FORMATS || 'mp3,wav,ogg,m4a,webm').split(',');
  const ext = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedFormats.includes(ext) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`));
  }
};

const upload = multer({
  storage: getStorage(),
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

module.exports = upload;
