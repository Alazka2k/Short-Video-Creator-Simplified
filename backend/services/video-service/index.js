// backend/services/[service-name]/index.js

const ServiceName = require('./video-gen-service');

class ServiceNameInterface {
  constructor() {
    this.service = new ServiceName();
  }

  async initialize() {
    // Add any initialization logic here
    await this.service.init();
  }

  async process(data) {
    // Add processing logic here
    return await this.service.generateContent(data);
  }

  async cleanup() {
    // Add any cleanup logic here
    await this.service.close();
  }
}

module.exports = new ServiceNameInterface();