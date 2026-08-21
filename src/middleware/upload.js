const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3, BUCKET } = require('../config/s3');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function imageFileFilter(_req, file, cb) {
  if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed.'));
}

function resumeFileFilter(_req, file, cb) {
  if (RESUME_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only PDF, DOC or DOCX files are allowed.'));
}

// Every uploaded file gets a random, collision-proof key inside a folder
// per type: uploads/profile/, uploads/resume/, uploads/project/.
function makeKey(folder) {
  return (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `uploads/${folder}/${unique}${ext}`);
  };
}

function makeS3Storage(folder) {
  return multerS3({
    s3,
    bucket: BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: makeKey(folder),
  });
}

// ---------- Profile picture ----------
const upload = multer({
  storage: makeS3Storage('profile'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ---------- Project gallery images (max 70 per project, enforced again in the controller) ----------
const uploadProjectImages = multer({
  storage: makeS3Storage('project'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 70 }, // 8MB per image, max 70 per request
});

// ---------- Résumé / CV (PDF/DOC) ----------
const uploadResume = multer({
  storage: makeS3Storage('resume'),
  fileFilter: resumeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Deletes a previously-uploaded S3 object given its stored URL. Safe no-op
// for empty values or URLs that don't belong to our bucket.
async function removeFromS3(fileUrl) {
  if (!fileUrl) return;
  try {
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    if (!key.startsWith('uploads/')) return; // not one of ours - don't touch it
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    // Never let a failed cleanup block the actual request (e.g. record was
    // already updated). Just log it.
    console.warn('Could not delete S3 object:', fileUrl, err.message);
  }
}

module.exports = { upload, uploadProjectImages, uploadResume, removeFromS3 };
