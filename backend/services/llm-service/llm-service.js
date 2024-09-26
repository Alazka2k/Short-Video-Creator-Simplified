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

  async generateContent(initialPromptPath, parametersPath, inputPrompt) {
    try {
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
      
      // Add the input prompt to the video_script object
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
      outputPath = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'llm', fileName);
    } else {
      const date = new Date();
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}-${String(date.getSeconds()).padStart(2, '0')}`;
      const promptDir = path.join(config.output.directory, dateString, `prompt_${output.prompt.replace(/\s+/g, '_').toLowerCase()}`);
      await fs.mkdir(promptDir, { recursive: true });
      outputPath = path.join(promptDir, 'llm_output.json');
    }
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    logger.info(`Output saved to ${outputPath}`);
    return outputPath;
  }
}

module.exports = LLMService;