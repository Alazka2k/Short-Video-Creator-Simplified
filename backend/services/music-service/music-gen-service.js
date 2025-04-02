const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const MusicDataAccess = require('./data/musicDataAccess');
const storageService = require('../../shared/utils/storage');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');

class MusicGenService {
  constructor() {
    this.baseUrl = 'https://api.acedata.cloud';
    this.musicGenOptions = config.parameters?.musicGen || {};
    this.dataAccess = MusicDataAccess;
    // Configure retry settings (with sensible defaults if not in config)
    this.maxRetries = config.musicGen?.maxRetries;
    // Only retry for these specific status codes that make sense to retry
    this.retryStatusCodes = [429, 500];
    
    /*logger.info('Initialized MusicGenService with options:', {
      musicGenOptions: this.musicGenOptions,
      maxRetries: this.maxRetries,
      retryStatusCodes: this.retryStatusCodes
    });*/
  }

  async generateMusic(jobId, musicData, isTest = false) {
    let lastError = null;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        if (retryCount > 0) {
          logger.info(`Retry attempt ${retryCount}/${this.maxRetries} for music generation job ${jobId}`);
        }
        
        logger.info(`Generating music for job ${jobId}, title: "${musicData.title}" and prompt: "${musicData.prompt}"`);
        logger.info('Music data:', JSON.stringify(musicData, null, 2));

        const payload = {
          action: 'generate',
          prompt: musicData.prompt,
          title: musicData.title,
          style: musicData.style,
          lyric: musicData.lyric,
          custom: musicData.custom ?? false,
          instrumental: musicData.instrumental ?? true,
          model: this.musicGenOptions.modelId
        };

        if (musicData.style) {
          payload.style = musicData.style;
        }

        if (musicData.lyric) {
          payload.lyric = musicData.lyric;
        }

        logger.info('Payload for music generation:', JSON.stringify(payload, null, 2));

        const endpoint = `${this.baseUrl}/suno/audios`;
        logger.info(`Calling endpoint: ${endpoint}`);

        const response = await axios.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.musicGen.apiKey}`
          },
          timeout: 300000 // 5 minute timeout
        });

        if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
          logger.error('Invalid API response:', response.data);
          throw new Error('Invalid response format from music generation API');
        }

        if (response.data.data.length === 0) {
          throw new Error('No music variations generated');
        }

        logger.info('Music generation task completed successfully:', response.data);
        
        // Use the first variation by default
        const selectedVariation = response.data.data[0];

        if (isTest) {
          const { outputPath, metadataPath } = this.getTestOutputPaths();
          await this.downloadMusic(selectedVariation.audio_url, outputPath);
          await this.saveMusicMetadata(metadataPath, path.basename(outputPath), musicData);

          return {
            filePath: outputPath,
            fileName: path.basename(outputPath),
            title: musicData.title,
            style: musicData.style,
            instrumental: musicData.instrumental,
            audioUrl: selectedVariation.audio_url,
            status: 'completed',
            metadata: {
              generationId: selectedVariation.id,
              created_at: selectedVariation.created_at,
              generatedAt: new Date().toISOString()
            }
          };
        } else {
          // Create temp directory for downloaded file
          const tempDir = path.join(os.tmpdir(), 'music-service', jobId);
          await fs.mkdir(tempDir, { recursive: true });
          const tempOutputPath = path.join(tempDir, `temp_${Date.now()}.mp3`);
          
          try {
            await this.downloadMusic(selectedVariation.audio_url, tempOutputPath);
            
            // Upload to storage
            const storageResult = await storageService.uploadFile(tempOutputPath, 'music');
            logger.info('Music uploaded to storage successfully');

            const musicRecord = await this.dataAccess.createMusicOutput(jobId, {
              tempFilePath: tempOutputPath,
              title: musicData.title,
              style: musicData.style,
              instrumental: musicData.instrumental,
              storageKey: storageResult.storageKey,
              publicUrl: storageResult.url,
              metadata: {
                generationId: selectedVariation.id,
                created_at: selectedVariation.created_at,
                generatedAt: new Date().toISOString(),
                prompt: musicData.prompt,
                model: this.musicGenOptions.modelId
              }
            });

            // Log successful music generation
            logger.info('Music generation completed successfully', {
              jobId,
              title: musicRecord.title,
              style: musicRecord.style,
              instrumental: musicRecord.instrumental,
              storageKey: musicRecord.storage_key
            });

            return {
              filePath: musicRecord.file_path,
              fileName: path.basename(musicRecord.file_path),
              title: musicRecord.title,
              style: musicRecord.style,
              instrumental: musicRecord.instrumental,
              storageKey: musicRecord.storage_key,
              publicUrl: musicRecord.public_url,
              status: 'completed',
              metadata: typeof musicRecord.metadata === 'string' 
                ? JSON.parse(musicRecord.metadata) 
                : musicRecord.metadata
            };
          } catch (error) {
            // Only try to delete the temp file if there was an error
            try {
              await fs.unlink(tempOutputPath);
              logger.info(`Temporary file removed: ${tempOutputPath}`);
            } catch (cleanupError) {
              logger.warn(`Failed to remove temporary file: ${tempOutputPath}`, cleanupError);
            }
            throw error;
          }
        }
      } catch (error) {
        lastError = error;
        
        // Extract error details for logging
        const errorDetails = {
          message: error.message,
          status: error.response?.status,
          errorCode: error.response?.data?.error?.code,
          errorMessage: error.response?.data?.error?.message,
          jobId,
          title: musicData.title,
          prompt: musicData.prompt
        };
        
        // Check if this error is retryable
        const isRetryableError = this.isRetryableError(error);
        
        // Only retry for specific status codes (429, 500) and error types that make sense to retry
        if (isRetryableError && retryCount < this.maxRetries) {
          logger.warn(`Retryable error encountered in music generation (attempt ${retryCount + 1}/${this.maxRetries}). Retrying immediately...`, errorDetails);
          
          // Increment retry count and continue immediately without delay
          retryCount++;
          continue;
        }
        
        // For non-retryable errors, log with appropriate details
        const cleanError = {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorCode: error.response?.data?.error?.code,
          errorMessage: error.response?.data?.error?.message,
          retryAttempts: retryCount,
          jobId,
          title: musicData.title,
          prompt: musicData.prompt
        };

        if (error.response?.data) {
          cleanError.data = typeof error.response.data === 'object' 
            ? JSON.stringify(error.response.data)
            : error.response.data;
        }

        if (retryCount > 0) {
          logger.error(`Failed music generation after ${retryCount} retry attempts:`, cleanError);
        } else {
          // For specific known error types, log with more context
          if (error.response?.status === 400) {
            if (error.response?.data?.error?.code === 'token_mismatched') {
              logger.error('Music generation failed: API token is mismatched or invalid', cleanError);
            } else if (error.response?.data?.error?.code === 'api_not_implemented') {
              logger.error('Music generation failed: API endpoint not implemented', cleanError);
            } else {
              logger.error('Music generation failed with bad request:', cleanError);
            }
          } else if (error.response?.status === 401) {
            logger.error('Music generation failed: Invalid authentication token', cleanError);
          } else {
            logger.error('Error generating music:', cleanError);
          }
        }

        // Return error result with failed status and appropriate error message
        return {
          status: 'failed',
          error: error.response?.data?.error?.message || error.message,
          errorCode: error.response?.data?.error?.code,
          retryAttempts: retryCount,
          jobId,
          title: musicData.title,
          prompt: musicData.prompt,
          metadata: {
            error: error.response?.data?.error?.message || error.message,
            errorCode: error.response?.data?.error?.code,
            retryAttempts: retryCount,
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  }

  /**
   * Determines if an error is eligible for retry
   * Only retry for rate limits (429) and server errors (500)
   * @param {Error} error - The error object from the API call
   * @returns {boolean} - Whether the error is retryable
   */
  isRetryableError(error) {
    // Check for specific HTTP status codes we want to retry (429 and 500)
    if (error.response && this.retryStatusCodes.includes(error.response.status)) {
      return true;
    }
    
    // Check for specific error messages that indicate temporary issues
    if (error.response?.data?.error?.message) {
      const errorMsg = error.response.data.error.message.toLowerCase();
      // Retry for resource availability issues
      if (errorMsg.includes('no available token') || 
          errorMsg.includes('too many requests')) {
        return true;
      }
    }
    
    // All other errors are not retryable
    return false;
  }

  async downloadMusic(url, outputPath) {
    try {
      logger.info(`Downloading music from URL: ${url}`);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
      });

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, response.data);
      logger.info(`Music downloaded and saved to ${outputPath}`);
    } catch (error) {
      logger.error('Error downloading music:', error);
      throw error;
    }
  }

  getTestOutputPaths() {
    const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'music');
    return {
      outputPath: path.join(testOutputDir, `background_music.mp3`),
      metadataPath: path.join(testOutputDir, 'metadata.json')
    };
  }

  async saveMusicMetadata(metadataPath, fileName, musicData) {
    const metadata = {
      musicFile: fileName,
      title: musicData.title,
      style: musicData.style,
      instrumental: musicData.instrumental
    };

    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    //logger.info(`Metadata saved to ${metadataPath}`);
  }

  // Database-related methods
  async getMusicByJobId(jobId) {
    return await this.dataAccess.getMusicByJobId(jobId);
  }

  async updateMusicMetadata(musicId, metadata) {
    return await this.dataAccess.updateMusicMetadata(musicId, metadata);
  }

  async deleteMusic(musicId) {
    return await this.dataAccess.deleteMusic(musicId);
  }
}

module.exports = MusicGenService;