const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');
const config = require('./config');

class LLMFileHandler {
  constructor() {
    this.baseOutputDir = path.join(config.output.directory, 'llm');
  }

  async saveOutputFile(jobId, llmData) {
    try {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const outputDir = path.join(this.baseOutputDir, dateString, jobId);
      
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputData = {
        jobId,
        createdAt: currentDate.toISOString(),
        prompt: llmData.prompt,
        status: llmData.status || 'pending',
        inputParameters: llmData.parameters,
        content: {
          title: llmData.title,
          description: llmData.description,
          hashtags: llmData.hashtags,
          music: {
            title: llmData.music_title,
            lyrics: llmData.music_lyrics,
            tags: llmData.music_tags
          }
        },
        scenes: [],
        metadata: llmData.metadata || {}
      };

      const outputPath = path.join(outputDir, 'llm_output.json');
      await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));
      
      logger.info(`LLM output file created: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Error saving LLM output file:', error);
      throw error;
    }
  }

  async updateSceneData(jobId, sceneData) {
    try {
      const outputPath = await this.getOutputFilePath(jobId);
      let existingData = await this.readOutputFile(jobId);

      if (!existingData.scenes) {
        existingData.scenes = [];
      }

      const sceneIndex = existingData.scenes.findIndex(s => s.scene_number === sceneData.scene_number);
      if (sceneIndex >= 0) {
        existingData.scenes[sceneIndex] = {
          ...existingData.scenes[sceneIndex],
          ...sceneData,
          updatedAt: new Date().toISOString()
        };
      } else {
        existingData.scenes.push({
          ...sceneData,
          createdAt: new Date().toISOString()
        });
      }

      // Sort scenes by scene number
      existingData.scenes.sort((a, b) => a.scene_number - b.scene_number);

      await fs.writeFile(outputPath, JSON.stringify(existingData, null, 2));
      logger.info(`Updated scene data in LLM output file for scene ${sceneData.scene_number}`);
    } catch (error) {
      logger.error('Error updating LLM output file with scene data:', error);
      throw error;
    }
  }

  async updateJobStatus(jobId, status) {
    try {
      const outputPath = await this.getOutputFilePath(jobId);
      const existingData = await this.readOutputFile(jobId);

      existingData.status = status;
      existingData.updatedAt = new Date().toISOString();

      await fs.writeFile(outputPath, JSON.stringify(existingData, null, 2));
      logger.info(`Updated job status in LLM output file: ${status}`);
    } catch (error) {
      logger.error('Error updating job status in LLM output file:', error);
      throw error;
    }
  }

  async readOutputFile(jobId) {
    const outputPath = await this.getOutputFilePath(jobId);
    try {
      const data = await fs.readFile(outputPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`No output file found for job ${jobId}`);
        return {};
      }
      throw error;
    }
  }

  async getOutputFilePath(jobId) {
    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0];
    return path.join(this.baseOutputDir, dateString, jobId, 'llm_output.json');
  }
}

module.exports = new LLMFileHandler();