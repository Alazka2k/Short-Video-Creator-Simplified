const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const PromptUtils = require('../../shared/utils/prompt-utils');
const { VideoScriptSchema } = require('../../shared/config/models');

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

  async generateContent(initialPromptPath, parametersPath, inputPrompt, isTest = false) {
    try {
      logger.debug('generateContent called with:', { initialPromptPath, parametersPath, inputPrompt, isTest });
      logger.debug('Current LLM config:', JSON.stringify(config.llm, null, 2));

      await fs.access(initialPromptPath);
      await fs.access(parametersPath);

      const parameters = await PromptUtils.loadParameters(parametersPath);
      const dynamicPrompt = await PromptUtils.generateDynamicPrompt(initialPromptPath, parameters);
      const combined_prompt = `${dynamicPrompt}\n\nCreate a video script about the following topic: ${inputPrompt}`;

      logger.info('Sending request to OpenAI API...');
      
      const completion = await this.openai.beta.chat.completions.parse({
        model: config.llm.model,
        messages: [
          { role: "system", content: "Extract the video script information according to the provided schema, including a music section with title, lyrics, and style. For each scene, include a description, visual prompt, camera movement (as a JSON string), and negative prompt." },
          { role: "user", content: combined_prompt },
        ],
        response_format: zodResponseFormat(VideoScriptSchema, "video_script"),
      });

      logger.info('Received response from OpenAI API');
      logger.debug('Raw API Response:', JSON.stringify(completion, null, 2));

      const video_script = completion.choices[0].message.parsed;
      video_script.prompt = inputPrompt;

      logger.info('Generated content structure:', { video_script });

      return video_script;
    } catch (error) {
      logger.error('Error generating content with LLM:', { 
        error: error.toString(), 
        stack: error.stack,
        details: error.cause ? error.cause.toString() : 'No additional details'
      });
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

  async process(initialPromptFile, parametersFile, inputPrompt) {
    logger.info('Processing LLM request', { initialPromptFile, parametersFile, inputPrompt });
    logger.debug('Current LLM config:', JSON.stringify(config.llm, null, 2));
  
    const initialPromptPath = path.join(config.llm.basePath, initialPromptFile);
    const parametersPath = path.join(config.llm.basePath, parametersFile);
  
    logger.info('Paths for processing:', { initialPromptPath, parametersPath });
  
    return await this.service.generateContent(initialPromptPath, parametersPath, inputPrompt);
  }
}

module.exports = LLMService;