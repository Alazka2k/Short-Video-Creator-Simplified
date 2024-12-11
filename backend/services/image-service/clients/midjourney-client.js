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

  async generateImage(prompt, progressCallback) {
    if (!this.initialized || !this.client) {
      throw new Error('Client not initialized');
    }

    try {
      return await this.client.Imagine(prompt, progressCallback);
    } catch (error) {
      logger.error('Error generating image:', error);
      if (error.message.includes('WebSocket') || error.code === 'ENOTFOUND') {
        await this.handleConnectionError();
      }
      throw error;
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