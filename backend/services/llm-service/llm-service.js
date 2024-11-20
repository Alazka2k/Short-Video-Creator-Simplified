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
    this.dataAccess = LLMDataAccess;

    logger.info(`LLM Provider: ${config.llm.provider}`);
    logger.info(`OpenAI API Key: ${config.llm.apiKey ? 'Loaded' : 'Missing'}`);
    logger.info(`OpenAI Model: ${config.llm.model}`);
  }

  async generateContent(inputPrompt, llmGenParams, isTest = false) {
    let jobId = uuidv4();
    try {
      logger.info('Starting content generation:', { jobId, inputPrompt });
      logger.debug('Generation parameters:', { llmGenParams, isTest });

      // Create initial job record
      if (!isTest) {
        await this.dataAccess.createJob(jobId, inputPrompt, 'pending', ['llm'], {
          startTime: new Date().toISOString(),
          parameters: llmGenParams
        });
        logger.info(`Created job record with ID: ${jobId}`);
      }

      // Load and prepare prompts
      const initialPrompt = await PromptUtils.loadInitialPrompt(
        path.join(config.basePaths.input, 'initial_prompt.txt')
      );
      const params = isTest 
        ? (await PromptUtils.loadParameters(path.join(config.basePaths.input, 'parameters.json'))).llmGen 
        : llmGenParams;

      const dynamicPrompt = PromptUtils.replacePlaceholders(initialPrompt, { llmGen: params });
      const combined_prompt = `${dynamicPrompt}\n\nCreate a video script about the following topic: ${inputPrompt}`;

      logger.info('Sending request to OpenAI');
      const completion = await this.openai.beta.chat.completions.parse({
        model: params.model || config.llm.model,
        messages: [
          { 
            role: "system", 
            content: "Extract the video script information according to the provided schema, including a music section with title, lyrics, and style. For each scene, include a description, visual prompt, camera movement (as a JSON string), and negative prompt." 
          },
          { role: "user", content: combined_prompt },
        ],
        response_format: zodResponseFormat(VideoScriptSchema, "video_script"),
        temperature: params.temperature || 0.7
      });

      logger.info('Processing OpenAI response');
      const video_script = completion.choices[0].message.parsed;

      if (!isTest) {
        try {
          // Store LLM input with parameters
          const llmInputId = await this.dataAccess.createInput(jobId, params);
          logger.info(`Created LLM input record: ${llmInputId}`);

          // Store LLM output
          const llmOutputId = await this.dataAccess.createOutput(
            jobId,
            llmInputId,
            video_script.title,
            video_script.description,
            video_script.hashtags,
            video_script.music.title,
            video_script.music.lyrics,
            video_script.music.tags
          );
          logger.info(`Created LLM output record: ${llmOutputId}`);

          // Extract visual metadata from parameters
          const visualMetadata = {
            artistStyle: params.artistStyle,
            shotStyle: params.shotStyle,
            aspectRatio: params.aspectRatio,
            style: params.style,
            sValue: params.sValue,
            version: params.version
          };

          // Store scenes with visual metadata
          for (let i = 0; i < video_script.scenes.length; i++) {
            const scene = video_script.scenes[i];
            const sceneId = await this.dataAccess.createScene(
              jobId,
              llmOutputId,
              i + 1,
              scene.description,
              scene.visual_prompt,
              scene.video_prompt,
              scene.camera_movement,
              visualMetadata  // Added visual metadata
            );
            logger.info(`Created scene record ${i + 1}: ${sceneId}`);
          }

          await this.dataAccess.updateJobStatus(jobId, 'completed');
          logger.info(`Updated job status to completed: ${jobId}`);
        } catch (dbError) {
          logger.error('Database error during content generation:', dbError);
          await this.dataAccess.updateJobStatus(jobId, 'failed');
          throw dbError;
        }
      }

      logger.info('Content generation completed successfully');
      return {
        message: "Content generated successfully",
        jobId: jobId,
        content: {
          prompt: inputPrompt,
          title: video_script.title,
          description: video_script.description,
          hashtags: video_script.hashtags,
          scenes: video_script.scenes.map(scene => ({
            description: scene.description,
            visual_prompt: scene.visual_prompt,
            video_prompt: scene.video_prompt,
            camera_movement: scene.camera_movement,
            visual_metadata: {  // Added to response
              artistStyle: params.artistStyle,
              shotStyle: params.shotStyle,
              aspectRatio: params.aspectRatio,
              style: params.style,
              sValue: params.sValue,
              version: params.version
            }
          })),
          music: {
            title: video_script.music.title,
            lyrics: video_script.music.lyrics,
            tags: video_script.music.tags
          }
        }
      };

    } catch (error) {
      logger.error('Error in content generation:', error);
      if (!isTest) {
        await this.dataAccess.updateJobStatus(jobId, 'failed');
      }
      throw error;
    }
  }

  async loadPromptsFromCsv(csvPath) {
    return PromptUtils.readCsvFile(csvPath);
  }

  async generateDocContent(prompt) {
    try {
      logger.info('Generating documentation content');
      const completion = await this.openai.chat.completions.create({
        model: config.llm.model,
        messages: [
          { role: "system", content: "You are an AI assistant tasked with generating documentation for a software project." },
          { role: "user", content: prompt },
        ],
      });
      return { description: completion.choices[0].message.content };
    } catch (error) {
      logger.error('Error generating documentation:', error);
      throw error;
    }
  }
}

module.exports = LLMService;