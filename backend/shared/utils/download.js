const AWS = require('aws-sdk');
const logger = require('./logger');

const s3 = new AWS.S3();

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'short-video-creator-dev';

// Map of file extensions to content types
const CONTENT_TYPES = {
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

function getContentType(fileName) {
  const ext = '.' + fileName.split('.').pop().toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

async function downloadFromS3(storageKey) {
  try {
    logger.info('Initiating S3 download:', { bucket: BUCKET_NAME, key: storageKey });

    // Get the object from S3
    const s3Object = s3.getObject({
      Bucket: BUCKET_NAME,
      Key: storageKey
    });

    // Create a stream
    const stream = s3Object.createReadStream();

    // Get the file name from the storage key
    const fileName = storageKey.split('/').pop();
    const contentType = getContentType(fileName);

    logger.info('S3 download stream created:', { fileName, contentType });

    return {
      stream,
      contentType,
      fileName
    };
  } catch (error) {
    logger.error('S3 download error:', error);
    throw error;
  }
}

module.exports = {
  downloadFromS3
}; 