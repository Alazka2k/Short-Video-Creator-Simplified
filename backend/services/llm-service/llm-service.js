const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const PromptUtils = require('../../shared/utils/prompt-utils');
const { VideoScriptSchema } = require('../../shared/config/models');
const LLMDataAccess = require('./data/llmDataAccess');

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.llm.apiKey,
    });

    logger.info(`LLM Provider: ${config.llm.provider}`);
    logger.info(`OpenAI API Key: ${config.llm.apiKey ? 'Loaded' : 'Missing'}`);
    logger.info(`OpenAI Model: ${config.llm.model}`);
  }

  async generateContent(inputPrompt, llmGenParams, isTest = false) {
    try {
      const jobId = uuidv4();
      logger.debug('generateContent called with:', { jobId, inputPrompt, llmGenParams, isTest });

      const initialPrompt = await PromptUtils.loadInitialPrompt(path.join(config.basePaths.input, 'initial_prompt.txt'));
      logger.debug('Initial prompt loaded:', initialPrompt);

      let params;
      if (isTest) {
        // For tests, load parameters from parameters.json
        params = await PromptUtils.loadParameters(path.join(config.basePaths.input, 'parameters.json'));
        params = params.llmGen;
      } else {
        // For endpoint calls, use the provided llmGenParams
        params = llmGenParams;
      }

      const dynamicPrompt = PromptUtils.replacePlaceholders(initialPrompt, { llmGen: params });
      logger.debug('Dynamic prompt after placeholder replacement:', dynamicPrompt);

      const combined_prompt = `${dynamicPrompt}\n\nCreate a video script about the following topic: ${inputPrompt}`;

      logger.info('Constructed prompt for OpenAI:');
      logger.info(combined_prompt);

      logger.info('Sending request to OpenAI API...');
      
      const completion = await this.openai.beta.chat.completions.parse({
        model: params.model || config.llm.model,
        messages: [
          { role: "system", content: "Extract the video script information according to the provided schema, including a music section with title, lyrics, and style. For each scene, include a description, visual prompt, camera movement (as a JSON string), and negative prompt." },
          { role: "user", content: combined_prompt },
        ],
        response_format: zodResponseFormat(VideoScriptSchema, "video_script"),
        temperature: params.temperature || 0.7
      });

      logger.info('Received response from OpenAI API');
      logger.debug('Raw API Response:', JSON.stringify(completion, null, 2));

      const video_script = completion.choices[0].message.parsed;
      video_script.prompt = inputPrompt;

      if (!isTest) {
        try {
          // Create LLM input in database
          const llmInputId = await LLMDataAccess.createInput(jobId, inputPrompt, params);
          logger.info(`LLM input created in database. ID: ${llmInputId}`);

          // Create LLM output in database
          const llmOutputId = await LLMDataAccess.createOutput(
            jobId,
            llmInputId,
            video_script.title,
            video_script.description,
            video_script.hashtags,
            video_script.music.title,
            video_script.music.lyrics,
            video_script.music.tags
          );
          logger.info(`LLM output created in database. ID: ${llmOutputId}`);

          // Create scenes in database
          for (let i = 0; i < video_script.scenes.length; i++) {
            const scene = video_script.scenes[i];
            const sceneId = await LLMDataAccess.createScene(
              llmOutputId,
              i + 1,
              scene.description,
              scene.visual_prompt,
              scene.video_prompt,
              scene.camera_movement
            );
            logger.info(`Scene ${i + 1} created in database. ID: ${sceneId}`);
          }
        } catch (dbError) {
          logger.error('Error saving LLM data to database:', dbError);
          // You might want to handle this error specifically, e.g., by setting a flag in the return object
        }
      }

      logger.info('Generated content structure:', { video_script });

      return { jobId, video_script };
    } catch (error) {
      logger.error('Error generating content with LLM:', { 
        error: error.toString(), 
        stack: error.stack,
        details: error.cause ? error.cause.toString() : 'No additional details'
      });
      throw error;
    }
  }

  async loadPromptsFromCsv(csvPath) {
    return PromptUtils.readCsvFile(csvPath);
  }

  async generateDocContent(prompt) {
    try {
      logger.info('Sending request to OpenAI API for documentation content...');
      
      const completion = await this.openai.chat.completions.create({
        model: config.llm.model,
        messages: [
          { role: "system", content: "You are an AI assistant tasked with generating documentation for a software project." },
          { role: "user", content: prompt },
        ],
      });

      logger.info('Received response from OpenAI API');
      
      return {
        description: completion.choices[0].message.content
      };
    } catch (error) {
      logger.error('Error generating documentation content with LLM:', { 
        error: error.toString(), 
        stack: error.stack,
        details: error.cause ? error.cause.toString() : 'No additional details'
      });
      throw error;
    }
  }

  async saveOutputToJson(output, fileName, isTest = false) {
    let outputPath;
    if (isTest) {
      outputPath = path.join(config.basePaths.test, 'llm', fileName);
    } else {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      
      const outputDir = path.join(config.output.directory, 'llm', `${dateString}_${timeString}`, `prompt_1`);
      await fs.mkdir(outputDir, { recursive: true });
      outputPath = path.join(outputDir, 'llm_output.json');
    }
    return PromptUtils.saveOutputToJson(output, outputPath);
  }
}

module.exports = LLMService;