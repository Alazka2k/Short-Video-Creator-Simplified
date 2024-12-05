const storageService = require('./storage');
const logger = require('./logger');

class StorageUrlHelper {
  static async getFreshUrl(url) {
    try {
      // Check if it's an S3 URL from our storage
      if (url.includes('short-video-creator-dev.s3')) {
        // Extract storage key from URL (everything after .com/)
        const urlWithoutParams = url.split('?')[0];
        const match = urlWithoutParams.match(/\.com\/(.*)/);
        if (!match || !match[1]) {
          throw new Error('Invalid S3 URL format');
        }
        const storageKey = match[1];
        
        // Get fresh signed URL
        return await storageService.getSignedUrl(storageKey);
      }
      
      // If not an S3 URL, return the original URL
      return url;
    } catch (error) {
      logger.error('Error getting fresh URL:', error);
      throw error;
    }
  }

  static async refreshUrlsInObject(obj) {
    const newObj = { ...obj };
    
    // Look for URL fields that might need refreshing
    const urlFields = ['url', 'public_url', 'imageUrl', 'audioUrl', 'videoUrl'];
    
    for (const field of urlFields) {
      if (newObj[field] && typeof newObj[field] === 'string') {
        newObj[field] = await this.getFreshUrl(newObj[field]);
      }
    }

    return newObj;
  }
}

module.exports = StorageUrlHelper; 