const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');
const config = require('./config');

class StorageService {
  constructor() {
    if (!config.services?.storage) {
      throw new Error('Storage configuration not found in config.services.storage');
    }
    
    const storageConfig = config.services.storage.config;
    if (!storageConfig) {
      throw new Error('Storage configuration not found');
    }

    // Configure AWS credentials
    const credentials = {
      accessKeyId: storageConfig.accessKeyId,
      secretAccessKey: storageConfig.secretAccessKey
    };

    // Validate credentials before initializing
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error('AWS credentials not found in configuration');
    }

    // Configure AWS SDK
    AWS.config.update({
      credentials: new AWS.Credentials(credentials),
      region: storageConfig.region
    });
    
    this.s3 = new AWS.S3();
    this.bucket = storageConfig.bucket;
    this.cdnUrl = storageConfig.cdnUrl;

    logger.info('Storage Service initialized:', {
      region: storageConfig.region,
      bucket: storageConfig.bucket,
      hasCredentials: !!credentials.accessKeyId && !!credentials.secretAccessKey
    });
  }

  async uploadFile(localPath, serviceType) {
    try {
      const fileContent = await fs.readFile(localPath);
      const key = this.getStorageKey(localPath, serviceType);

      await this.s3.putObject({
        Bucket: this.bucket,
        Key: key,
        Body: fileContent,
        ContentType: this.getContentType(localPath)
      }).promise();

      logger.info('File uploaded to storage:', { localPath, key });

      return {
        storageKey: key,
        url: await this.getSignedUrl(key, 3600)
      };
    } catch (error) {
      logger.error('Error uploading file to storage:', error);
      throw error;
    }
  }

  getStorageKey(localPath, serviceType) {
    // Convert Windows path to Unix-style
    const normalizedPath = localPath.replace(/\\/g, '/');
    
    // Extract the relevant part of the path after 'output'
    const match = normalizedPath.match(/output[\/\\]([^]*)/);
    if (match) {
      // Get the part after 'output'
      const pathAfterOutput = match[1];
      // Remove the service type if it appears at the start of the path
      // Escape the service type for regex and handle both forward and backslashes
      const serviceTypePattern = new RegExp(`^${serviceType}[\\/\\\\]`);
      const pathWithoutServiceType = pathAfterOutput.replace(serviceTypePattern, '');
      return `${serviceType}/${pathWithoutServiceType}`;
    }
    
    // Fallback: just use the filename with service type
    const fileName = path.basename(normalizedPath);
    return `${serviceType}/${fileName}`;
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  getPublicUrl(storageKey) {
    return `${this.cdnUrl}/${storageKey}`;
  }

  async getSignedUrl(key, expiresIn = 3600) { // 1 hour default
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn
      };
      
      const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
      //logger.info('Generated signed URL:', { key, expiresIn });
      
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  async fileExists(key) {
    try {
      await this.s3.headObject({
        Bucket: this.bucket,
        Key: key
      }).promise();
      
      logger.info('File exists in S3:', { key });
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        logger.info('File does not exist in S3:', { key });
        return false;
      }
      logger.error('Error checking file existence in S3:', error);
      throw error;
    }
  }
}

module.exports = new StorageService(); 