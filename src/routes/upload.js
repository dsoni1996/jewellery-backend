const express  = require("express");
const router   = express.Router();
const upload   = require("../middleware/upload");
const { protect } = require("../middleware/auth");

// Single image upload
router.post("/single", protect, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({
    success: true,
    url:      req.file.path,        // Cloudinary URL
    publicId: req.file.filename,    // to delete later
  });
});

// Multiple images (max 5)
router.post("/multiple", protect, upload.array("images", 5), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ success: false, message: "No files uploaded" });
  res.json({
    success: true,
    urls: req.files.map(f => ({ url: f.path, publicId: f.filename })),
  });
});

// Delete image
router.delete("/:publicId", protect, async (req, res) => {
  const cloudinary = require("../config/cloudinary");
  await cloudinary.uploader.destroy(req.params.publicId);
  res.json({ success: true, message: "Image deleted" });
});

module.exports = router;