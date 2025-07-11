const https = require('https');
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');

class MidjourneyClient {
  /**
   * This client is refactored to use the AceData Midjourney API.
   * It moves away from a direct WebSocket connection to a more scalable and reliable
   * stateless HTTP-based integration. It handles image generation via a single API call
   * and supports streaming progress updates.
   */
  constructor() {
    if (config.imageGen.provider !== 'acedata') {
      throw new Error('MidjourneyClient (AceData) is initialized, but a different image provider is configured.');
    }

    if (!config.imageGen.acedataMidjourneyApiToken) {
      throw new Error('AceData API token is not configured.');
    }
    if (!config.imageGen.webhookBaseUrl) {
      throw new Error('Image service webhook base URL is not configured.');
    }
    
    this.initialized = true;
  }

  /**
   * How to implement upscaling in the future:
   * 
   * The current `generateImage` method is designed for a single-call workflow to get one
   * of the four initial grid images. To implement upscaling, you would need a two-call workflow.
   * 
   * 1. First Call (Generate Grid):
   *    - Call the `/imagine` endpoint with `action: 'generate'` and the prompt.
   *    - Crucially, set `"split_images": false` (or omit it) to get back the single grid image.
   *    - The response at `progress: 100` will contain the `image_id` of the grid and the `actions`
   *      array (e.g., ["upscale1", "upscale2", "variation1", ...]).
   * 
   * 2. Second Call (Upscale):
   *    - Once you have the grid `image_id`, you can make a second call to the `/imagine` endpoint.
   *    - In this call, set the `action` to one of the upscale actions (e.g., "upscale1").
   *    - Provide the `image_id` from the first call in the request body.
   *    - This call will then return the URL of the final, single, upscaled image.
   * 
   * This would typically be orchestrated in the `image-gen-service.js`, where the service would
   * first call `generateImageGrid()`, then `upscaleImage(imageId, upscaleAction)`.
   */

  /**
   * Generates a single image from a prompt by creating a 2x2 grid and randomly selecting one.
   * @param {string} prompt - The text prompt for image generation.
   * @param {function(string, number): void} progressCallback - A function to call with progress updates.
   * @returns {Promise<object>} A promise that resolves with the final generation result.
   */
  async generateImage(prompt, jobId, sceneId) {
    const callbackUrl = `${config.imageGen.webhookBaseUrl}/api/image/webhook/${jobId}/${sceneId}`;
    logger.info(`[AceData Client] Starting image generation for job ${jobId}, scene ${sceneId}. Callback: ${callbackUrl}`);

    const requestBody = JSON.stringify({
      action: 'generate',
      prompt: prompt,
      mode: 'fast',
      split_images: false,
      translation: false,
      callback_url: callbackUrl,
    });

    const options = {
      hostname: 'api.acedata.cloud',
      path: '/midjourney/imagine',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.imageGen.acedataMidjourneyApiToken}`,
        'Content-Type': 'application/json',
        'accept': 'application/json', // We expect a simple JSON response with a task_id now
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 30000, // 30-second timeout for the initial request
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const responseData = JSON.parse(responseBody);
              logger.info(`[AceData Client] Successfully submitted job to API. Task ID: ${responseData.task_id}`);
              resolve(responseData);
            } catch (error) {
              logger.error('[AceData Client] Failed to parse success response from API:', responseBody);
              reject(new Error('Failed to parse API response.'));
            }
          } else {
            logger.error(`[AceData Client] API request failed with status ${res.statusCode}:`, responseBody);
            reject(new Error(`API request failed with status code: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        logger.error('[AceData Client] Request error:', error);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out after 30 seconds.'));
      });

      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Checks if the client is initialized.
   * @returns {Promise<boolean>}
   */
  async isConnected() {
    return this.initialized;
  }

  /**
   * Closes the client (no-op for this stateless client).
   */
  async close() {
    this.initialized = false;
    logger.info('[AceData Client] Client closed.');
  }
}

module.exports = MidjourneyClient; 