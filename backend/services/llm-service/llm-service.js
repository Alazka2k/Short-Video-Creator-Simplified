const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const fs = require('fs').promises;
const path = require('path');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const PromptUtils = require('../../shared/utils/prompt-utils');
const { VideoScriptSchema } = require('../../shared/config/models');
const LLMDataAccess = require('./data/llmDataAccess');
const csv = require('csv-parse/sync');

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.llm.apiKey,
    });

    logger.info(`LLM Provider: ${config.llm.provider}`);
    logger.info(`OpenAI API Key: ${config.llm.apiKey ? 'Loaded' : 'Missing'}`);
    logger.info(`OpenAI Model: ${config.llm.model}`);
    logger.info(`LLM Base Path: ${config.llm.basePath}`);
  }

  async generateContent(initialPromptPath, llmGenParams, inputPrompt, isTest = false) {
    try {
      logger.debug('generateContent called with:', { initialPromptPath, llmGenParams, inputPrompt, isTest });
      logger.debug('Current LLM config:', JSON.stringify(config.llm, null, 2));

      await fs.access(initialPromptPath);

      const initialPrompt = await fs.readFile(initialPromptPath, 'utf8');
      const dynamicPrompt = PromptUtils.replacePlaceholders(initialPrompt, llmGenParams);
      const combined_prompt = `${dynamicPrompt}\n\nCreate a video script about the following topic: ${inputPrompt}`;

      logger.info('Sending request to OpenAI API...');
      
      let jobId, llmInputId;
      if (!isTest) {
        // Create a new job and get the job ID
        jobId = await LLMDataAccess.createJob();
        // Create LLM input in database
        llmInputId = await LLMDataAccess.createInput(jobId, combined_prompt, llmGenParams);
      }

      const completion = await this.openai.beta.chat.completions.parse({
        model: llmGenParams.model || config.llm.model,
        messages: [
          { role: "system", content: "Extract the video script information according to the provided schema, including a music section with title, lyrics, and style. For each scene, include a description, visual prompt, camera movement (as a JSON string), and negative prompt." },
          { role: "user", content: combined_prompt },
        ],
        response_format: zodResponseFormat(VideoScriptSchema, "video_script"),
        temperature: llmGenParams.temperature || 0.7,
        max_tokens: llmGenParams.max_tokens || 1000,
      });

      logger.info('Received response from OpenAI API');
      logger.debug('Raw API Response:', JSON.stringify(completion, null, 2));

      const video_script = completion.choices[0].message.parsed;
      video_script.prompt = inputPrompt;

      if (!isTest) {
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

        // Create scenes in database
        for (let i = 0; i < video_script.scenes.length; i++) {
          const scene = video_script.scenes[i];
          await LLMDataAccess.createScene(
            llmOutputId,
            i + 1,
            scene.description,
            scene.visual_prompt,
            scene.video_prompt,
            scene.camera_movement
          );
        }
      }

      logger.info('Generated content structure:', { video_script });

      return { video_script, jobId };
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
    try {
      const content = await fs.readFile(csvPath, 'utf8');
      const records = csv.parse(content, { columns: true, skip_empty_lines: true });
      return records.map(record => record.Prompt);
    } catch (error) {
      logger.error('Error loading prompts from CSV:', error);
      throw error;
    }
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
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    logger.info(`Output saved to ${outputPath}`);
    return outputPath;
  }
}

module.exports = LLMService;