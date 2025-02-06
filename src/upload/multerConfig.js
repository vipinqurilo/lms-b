const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Multer file filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedVideoTypes = /mp4|avi|mov/;
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (
    (file.fieldname === 'courseImage' && allowedImageTypes.test(extname) && allowedImageTypes.test(mimetype)) ||
    (file.fieldname === 'courseVideo' && allowedVideoTypes.test(extname) && allowedVideoTypes.test(mimetype))
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type!'));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB max file size
});

module.exports = upload;
