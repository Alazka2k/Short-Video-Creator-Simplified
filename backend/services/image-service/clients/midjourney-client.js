const { Midjourney } = require('midjourney');
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');

class MidjourneyClient {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.checkConnectionInterval = null;
    
    // Enhanced queue system
    this.requestQueues = new Map(); // Multiple queues by userId
    this.isProcessing = false;
    this.minRequestInterval = 1000; // 1 second intervall between calls
    this.lastRequestTime = 0;
    this.maxConcurrentRequests = 3; // Allow 3 concurrent requests
    this.activeRequests = 0;
    this.globalQueue = []; // For requests without userId
  }

  createClient() {
    return new Midjourney({
      ServerId: config.imageGen.serverId,
      ChannelId: config.imageGen.channelId,
      SalaiToken: config.imageGen.salaiToken,
      Debug: false,
      Ws: config.imageGen.ws || true
    });
  }

  async init() {
    try {
      logger.info('Initializing Midjourney client...');
      this.client = this.createClient();
      await this.client.init();
      this.initialized = true;
      this.reconnectAttempts = 0;
      logger.info('Midjourney client initialized successfully');
      
      // Start connection monitoring
      this.startConnectionMonitoring();
    } catch (error) {
      logger.error('Failed to initialize Midjourney client:', error);
      await this.handleConnectionError();
    }
  }

  startConnectionMonitoring() {
    // Clear any existing interval
    if (this.checkConnectionInterval) {
      clearInterval(this.checkConnectionInterval);
    }

    // Check connection every 30 seconds
    this.checkConnectionInterval = setInterval(async () => {
      try {
        if (!this.client || !this.initialized) {
          await this.handleConnectionError();
        }
      } catch (error) {
        logger.error('Connection monitoring error:', error);
      }
    }, 30000);
  }

  async handleConnectionError() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;
    this.initialized = false;

    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      await this.init();
    } catch (error) {
      logger.error('Reconnection attempt failed:', error);
    }
  }

  async generateImage(prompt, progressCallback, userId = null) {
    if (!this.initialized || !this.client) {
      throw new Error('Client not initialized');
    }

    return new Promise((resolve, reject) => {
      const request = { prompt, progressCallback, resolve, reject, timestamp: Date.now() };
      
      if (userId) {
        // Add to user-specific queue
        if (!this.requestQueues.has(userId)) {
          this.requestQueues.set(userId, []);
        }
        this.requestQueues.get(userId).push(request);
      } else {
        // Add to global queue
        this.globalQueue.push(request);
      }

      this.processQueues();
    });
  }

  async processQueues() {
    if (this.isProcessing || this.activeRequests >= this.maxConcurrentRequests) return;

    this.isProcessing = true;
    
    try {
      // Process both user queues and global queue fairly
      const allQueues = [...this.requestQueues.values(), this.globalQueue];
      let processedRequest = false;

      for (const queue of allQueues) {
        if (queue.length > 0) {
          const request = queue[0];
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;

          if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
          }

          this.activeRequests++;
          try {
            const result = await this.client.Imagine(request.prompt, request.progressCallback);
            this.lastRequestTime = Date.now();
            request.resolve(result);
          } catch (error) {
            if (error.message.includes('429')) {
              logger.info('Rate limited by Midjourney, waiting 5 seconds before retry...');
              await new Promise(resolve => setTimeout(resolve, 5000));
              // Don't remove the request, it will be retried
              this.isProcessing = false;
              this.activeRequests--;
              this.processQueues();
              return;
            }
            
            if (error.message.includes('WebSocket') || error.code === 'ENOTFOUND') {
              await this.handleConnectionError();
            }
            request.reject(error);
          }

          // Remove processed request
          queue.shift();
          this.activeRequests--;
          processedRequest = true;
        }
      }

      // Clean up empty queues
      for (const [userId, queue] of this.requestQueues.entries()) {
        if (queue.length === 0) {
          this.requestQueues.delete(userId);
        }
      }

      // If we processed any requests and there are more, continue processing
      if (processedRequest && (this.globalQueue.length > 0 || this.requestQueues.size > 0)) {
        setImmediate(() => this.processQueues());
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async isConnected() {
    return this.initialized && this.client;
  }

  async close() {
    if (this.checkConnectionInterval) {
      clearInterval(this.checkConnectionInterval);
      this.checkConnectionInterval = null;
    }

    if (this.initialized && this.client) {
      try {
        await this.client.Close();
      } catch (error) {
        logger.error('Error closing Midjourney client:', error);
      } finally {
        this.initialized = false;
        this.client = null;
      }
    }
  }
}

module.exports = MidjourneyClient; 