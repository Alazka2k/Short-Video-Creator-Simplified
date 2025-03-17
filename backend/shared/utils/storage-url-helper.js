const storageService = require('./storage');
const logger = require('./logger');
const config = require('./config');

class StorageUrlHelper {
  constructor() {
    this.cache = new Map();
    this.EXPIRY_BUFFER = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.BATCH_SIZE = 10;
    this.MAX_RETRIES = 3;
  }

  // Singleton instance
  static getInstance() {
    if (!StorageUrlHelper.instance) {
      StorageUrlHelper.instance = new StorageUrlHelper();
    }
    return StorageUrlHelper.instance;
  }

  static async getFreshUrl(url) {
    return StorageUrlHelper.getInstance().getFreshUrlInstance(url);
  }

  static async refreshUrlsInObject(obj) {
    return StorageUrlHelper.getInstance().refreshUrlsInObjectInstance(obj);
  }

  async shouldRefreshUrl(storageKey) {
    // Check if URL exists in cache and is not expiring soon
    const cached = this.cache.get(storageKey);
    if (cached && cached.expiresAt > Date.now() + this.EXPIRY_BUFFER) {
      logger.debug('URL still valid, skipping refresh:', { 
        storageKey, 
        expiresIn: Math.round((cached.expiresAt - Date.now()) / 1000) + ' seconds',
        refreshedAt: new Date(cached.refreshedAt).toISOString()
      });
      return false;
    }
    
    // If URL is not in cache or is expiring soon, log the reason
    if (!cached) {
      logger.info('URL not in cache, needs refresh:', { storageKey });
    } else {
      const expiresIn = Math.round((cached.expiresAt - Date.now()) / 1000);
      logger.info('URL expiring soon, needs refresh:', { 
        storageKey, 
        expiresIn: expiresIn + ' seconds',
        refreshedAt: new Date(cached.refreshedAt).toISOString(),
        expiresAt: new Date(cached.expiresAt).toISOString()
      });
    }
    
    return true;
  }

  extractStorageKeyFromUrl(url) {
    if (!url) return null;
    
    const bucketName = config.services.storage.config.bucket;
    if (!url.includes(`${bucketName}.s3`)) return null;

    const urlWithoutParams = url.split('?')[0];
    const match = urlWithoutParams.match(/\.com\/(.*)/);
    return match?.[1] || null;
  }

  async getFreshUrlInstance(url) {
    try {
      if (!url) {
        throw new Error('URL is required');
      }

      // Check if it's an S3 URL from our storage
      if (url.includes('short-video-creator-dev.s3')) {
        const storageKey = this.extractStorageKeyFromUrl(url);
        if (!storageKey) {
          throw new Error('Invalid S3 URL format');
        }
        
        // Check if we need to refresh
        if (!await this.shouldRefreshUrl(storageKey)) {
          const cached = this.cache.get(storageKey);
          return cached.url;
        }

        // Get fresh signed URL
        const freshUrl = await this.refreshUrl(storageKey);
        return freshUrl.url;
      }
      
      // If not an S3 URL, return the original URL
      return url;
    } catch (error) {
      logger.error('Error getting fresh URL:', error);
      throw error;
    }
  }

  async refreshUrlsInObjectInstance(obj) {
    const newObj = { ...obj };
    
    // Look for URL fields that might need refreshing
    const urlFields = ['url', 'publicUrl', 'imageUrl', 'audioUrl', 'videoUrl'];
    
    for (const field of urlFields) {
      if (newObj[field] && typeof newObj[field] === 'string') {
        // Only refresh if needed
        const storageKey = this.extractStorageKeyFromUrl(newObj[field]);
        if (storageKey && await this.shouldRefreshUrl(storageKey)) {
          newObj[field] = await this.getFreshUrlInstance(newObj[field]);
        }
      }
    }

    return newObj;
  }

  async refreshUrl(storageKey, retryCount = 0) {
    try {
      const signedUrl = await storageService.getSignedUrl(storageKey, 3600);
      const urlInfo = {
        url: signedUrl,
        refreshedAt: Date.now(),
        expiresAt: Date.now() + 3600 * 1000 // 1 hour
      };
      this.cache.set(storageKey, urlInfo);
      logger.info('Refreshed URL:', { storageKey, expiresAt: urlInfo.expiresAt });
      return urlInfo;
    } catch (error) {
      if (error.code === 'ThrottlingException' && retryCount < this.MAX_RETRIES) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        logger.info('Rate limited, retrying after delay:', { 
          storageKey, 
          retryCount, 
          delay 
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.refreshUrl(storageKey, retryCount + 1);
      }
      logger.error('Failed to refresh URL:', { 
        storageKey, 
        error,
        retryCount 
      });
      throw error;
    }
  }

  async refreshUrlBatch(storageKeys) {
    const results = new Map();
    const chunks = this.chunkArray(storageKeys, this.BATCH_SIZE);

    logger.info('Starting batch URL refresh:', { 
      totalKeys: storageKeys.length,
      chunks: chunks.length,
      batchSize: this.BATCH_SIZE
    });

    for (const [index, chunk] of chunks.entries()) {
      const refreshPromises = chunk.map(async key => {
        try {
          const urlInfo = await this.refreshUrl(key);
          results.set(key, urlInfo);
        } catch (error) {
          logger.error('Failed to refresh URL in batch:', { 
            storageKey: key, 
            error,
            chunkIndex: index
          });
        }
      });

      // Process each chunk with a small delay between chunks
      await Promise.all(refreshPromises);
      if (index < chunks.length - 1) { // Don't delay after the last chunk
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('Completed batch URL refresh:', { 
      totalProcessed: results.size,
      successRate: `${(results.size / storageKeys.length * 100).toFixed(1)}%`
    });

    return results;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async extractStorageKeysFromJob(job) {
    const storageKeys = new Set();
    
    if (job.metadata?.scenes) {
      for (const scene of job.metadata.scenes) {
        if (scene.image?.storageKey) storageKeys.add(scene.image.storageKey);
        if (scene.video?.storageKey) storageKeys.add(scene.video.storageKey);
        if (scene.voice?.storageKey) storageKeys.add(scene.voice.storageKey);
      }
    }
    
    if (job.metadata?.music?.storageKey) {
      storageKeys.add(job.metadata.music.storageKey);
    }

    return Array.from(storageKeys);
  }

  async updateJobUrls(job) {
    const storageKeys = await this.extractStorageKeysFromJob(job);
    
    if (storageKeys.length === 0) {
      logger.info('No storage keys found in job:', { jobId: job.job_id });
      return job;
    }

    logger.info('Updating job URLs:', { 
      jobId: job.job_id, 
      storageKeysCount: storageKeys.length 
    });

    const refreshedUrls = await this.refreshUrlBatch(storageKeys);
    const updatedMetadata = { ...job.metadata };

    // Update scene URLs
    if (updatedMetadata.scenes) {
      updatedMetadata.scenes = updatedMetadata.scenes.map(scene => ({
        ...scene,
        image: scene.image?.storageKey ? {
          ...scene.image,
          publicUrl: refreshedUrls.get(scene.image.storageKey)?.url || scene.image.publicUrl
        } : scene.image,
        video: scene.video?.storageKey ? {
          ...scene.video,
          publicUrl: refreshedUrls.get(scene.video.storageKey)?.url || scene.video.publicUrl
        } : scene.video,
        voice: scene.voice?.storageKey ? {
          ...scene.voice,
          publicUrl: refreshedUrls.get(scene.voice.storageKey)?.url || scene.voice.publicUrl
        } : scene.voice
      }));
    }

    // Update music URL
    if (updatedMetadata.music?.storageKey) {
      updatedMetadata.music = {
        ...updatedMetadata.music,
        publicUrl: refreshedUrls.get(updatedMetadata.music.storageKey)?.url || updatedMetadata.music.publicUrl
      };
    }

    return {
      ...job,
      metadata: updatedMetadata
    };
  }
}

module.exports = StorageUrlHelper; 