const express = require('express');
const {
  getProfile, updateProfile, uploadPicture, deletePicture, uploadResume, deleteResume, downloadResume,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { upload, uploadResume: uploadResumeMiddleware } = require('../middleware/upload');

const router = express.Router();

router.get('/', getProfile);
router.put('/', protect, updateProfile);
router.post('/picture', protect, upload.single('picture'), uploadPicture);
router.delete('/picture', protect, deletePicture);
router.get('/resume/download', downloadResume);
router.post('/resume', protect, uploadResumeMiddleware.single('resume'), uploadResume);
router.delete('/resume', protect, deleteResume);

module.exports = router;