const mongoose = require('mongoose');

// There is only ever one Profile document - it represents the portfolio owner.
const ProfileSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    // Rotating roles shown under the name on the hero section (e.g. "Data Science",
    // "Machine Learning", "AI") - fully admin editable (add/remove/reorder).
    roles: { type: [String], default: ['Data Science', 'Machine Learning', 'AI'] },
    // "Dono introductions": the short hero intro paragraph (bio) and the longer
    // About-section write-up (aboutBio). Both are plain text; use blank lines to
    // separate paragraphs, the frontend renders each line as its own <p>.
    bio: { type: String, default: '' },
    aboutBio: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    profilePicture: { type: String, default: '' }, // relative path e.g. "uploads/xyz.jpg"
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', ProfileSchema);