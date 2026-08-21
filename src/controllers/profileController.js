const Profile = require('../models/Profile');
const asyncHandler = require('../utils/asyncHandler');
const { removeFromS3 } = require('../middleware/upload');

async function findProfileDoc() {
  return Profile.findOne();
}

const getProfile = asyncHandler(async (_req, res) => {
  const profile = await findProfileDoc();
  res.json({ success: true, data: profile || {} });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'name', 'title', 'roles', 'bio', 'aboutBio', 'email', 'phone', 'location',
    'github', 'linkedin', 'twitter', 'website', 'resumeUrl',
  ];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  // "roles" may arrive as a real array (JSON) or as a comma-separated string
  // from a plain HTML form - normalize either way into a clean string array.
  if (update.roles !== undefined) {
    if (typeof update.roles === 'string') {
      update.roles = update.roles.split(',').map((r) => r.trim()).filter(Boolean);
    } else if (Array.isArray(update.roles)) {
      update.roles = update.roles.map((r) => String(r).trim()).filter(Boolean);
    }
  }

  const profile = await Profile.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  res.json({ success: true, data: profile, message: 'Profile saved.' });
});

// POST /api/profile/picture (protected, multipart/form-data field "picture")
// Stored directly in the AWS S3 bucket - req.file.location is the public URL.
const uploadPicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "picture".' });
  }
  let profile = await findProfileDoc();
  if (profile && profile.profilePicture) await removeFromS3(profile.profilePicture);

  profile = await Profile.findOneAndUpdate(
    {},
    { profilePicture: req.file.location },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: profile, message: 'Profile picture updated.' });
});

const deletePicture = asyncHandler(async (_req, res) => {
  const profile = await findProfileDoc();
  if (!profile || !profile.profilePicture) {
    return res.json({ success: true, data: profile || {}, message: 'No profile picture to remove.' });
  }
  await removeFromS3(profile.profilePicture);
  profile.profilePicture = '';
  await profile.save();
  res.json({ success: true, data: profile, message: 'Profile picture removed.' });
});

// POST /api/profile/resume  (protected, multipart/form-data field "resume")
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "resume".' });
  }
  let profile = await findProfileDoc();
  if (profile && profile.resumeUrl) await removeFromS3(profile.resumeUrl);

  profile = await Profile.findOneAndUpdate(
    {},
    { resumeUrl: req.file.location },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: profile, message: 'Résumé updated.' });
});

// DELETE /api/profile/resume  (protected)
const deleteResume = asyncHandler(async (_req, res) => {
  const profile = await findProfileDoc();
  if (!profile || !profile.resumeUrl) {
    return res.json({ success: true, data: profile || {}, message: 'No résumé to remove.' });
  }
  await removeFromS3(profile.resumeUrl);
  profile.resumeUrl = '';
  await profile.save();
  res.json({ success: true, data: profile, message: 'Résumé removed.' });
});

module.exports = { getProfile, updateProfile, uploadPicture, deletePicture, uploadResume, deleteResume };
