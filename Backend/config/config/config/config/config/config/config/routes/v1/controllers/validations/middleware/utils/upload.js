const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const envConfig = require('../config/env');

// Configure Cloudinary
cloudinary.config({
  cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
  api_key: envConfig.CLOUDINARY_API_KEY,
  api_secret: envConfig.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = async (file, folder = 'general') => {
  try {
    // Upload file
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `zewed-jobs/${folder}`,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    // Delete local file after upload
    fs.unlinkSync(file.path);

    return result;
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple files
 */
const uploadMultipleToCloudinary = async (files, folder = 'general') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    // Clean up any uploaded files on error
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    throw error;
  }
};

/**
 * Generate Cloudinary URL with transformations
 */
const getCloudinaryUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    width: transformations.width,
    height: transformations.height,
    crop: transformations.crop || 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  };

  return cloudinary.url(publicId, defaultTransformations);
};

/**
 * Upload base64 image
 */
const uploadBase64 = async (base64String, folder = 'general') => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: `zewed-jobs/${folder}`,
      resource_type: 'image',
    });

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if URL is from Cloudinary
 */
const isCloudinaryUrl = (url) => {
  return url && url.includes('res.cloudinary.com');
};

/**
 * Extract public ID from Cloudinary URL
 */
const extractPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null;

  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|png|gif|webp|mp4|webm)/);
  return matches ? matches[1] : null;
};

module.exports = {
  upload: uploadToCloudinary,
  delete: deleteFromCloudinary,
  uploadMultiple: uploadMultipleToCloudinary,
  getUrl: getCloudinaryUrl,
  uploadBase64,
  isCloudinaryUrl,
  extractPublicId,
  cloudinary,
};
