const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/ad-creatives');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware to process uploaded images
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filePath = req.file.path;
    
    // Get image dimensions
    const metadata = await sharp(filePath).metadata();
    
    req.file.width = metadata.width;
    req.file.height = metadata.height;
    req.file.format = metadata.format;
    
    // Create thumbnail for images
    if (req.file.mimetype.startsWith('image/')) {
      const thumbnailPath = path.join(
        uploadDir,
        'thumbnails',
        `thumb-${req.file.filename}`
      );
      
      // Create thumbnails directory if it doesn't exist
      const thumbDir = path.dirname(thumbnailPath);
      if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir, { recursive: true });
      }
      
      await sharp(filePath)
        .resize(200, 200, { fit: 'inside' })
        .toFile(thumbnailPath);
      
      req.file.thumbnail = thumbnailPath;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to handle multiple file uploads
const uploadMultiple = (fields) => {
  return upload.fields(fields);
};

// Middleware to validate file size and dimensions
const validateFile = (options = {}) => {
  return async (req, res, next) => {
    if (!req.file) return next();

    const { maxWidth, maxHeight, minWidth, minHeight } = options;

    try {
      const metadata = await sharp(req.file.path).metadata();

      if (maxWidth && metadata.width > maxWidth) {
        throw new Error(`Image width exceeds maximum of ${maxWidth}px`);
      }

      if (maxHeight && metadata.height > maxHeight) {
        throw new Error(`Image height exceeds maximum of ${maxHeight}px`);
      }

      if (minWidth && metadata.width < minWidth) {
        throw new Error(`Image width is less than minimum of ${minWidth}px`);
      }

      if (minHeight && metadata.height < minHeight) {
        throw new Error(`Image height is less than minimum of ${minHeight}px`);
      }

      next();
    } catch (error) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      next(error);
    }
  };
};

// Helper to clean up uploaded files on error
const cleanupUploads = (req, res, next) => {
  // Store reference to cleanup function
  const cleanup = () => {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
  };

  // Attach cleanup to response finish
  res.on('finish', cleanup);
  res.on('close', cleanup);

  next();
};

module.exports = {
  upload,
  processImage,
  uploadMultiple,
  validateFile,
  cleanupUploads,
};
