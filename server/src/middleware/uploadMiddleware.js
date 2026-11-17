const multer = require('multer');

// Use memory storage so we can stream/upload directly to S3 or write to disk
const storage = multer.memoryStorage();

// File filter: accept images (png, jpg, jpeg, webp) and receipts (pdf)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type '${file.mimetype}'. Only JPG, PNG, WEBP and PDF files are allowed.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file limit
    files: 5, // Maximum 5 files per complaint
  },
  fileFilter,
});

module.exports = upload;
