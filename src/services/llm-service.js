const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const fs = require('fs').promises;
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');
const PromptUtils = require('../utils/prompt-utils');
const { VideoScriptSchema } = require('../models');

const openai = new OpenAI({
  apiKey: config.llm.apiKey,
});

logger.info('LLM Provider:', config.llm.provider);
logger.info('OpenAI API Key:', config.llm.apiKey ? 'Loaded' : 'Missing');
logger.info('OpenAI Model:', config.llm.model);

async function generateContent(initialPromptPath, parametersPath, inputPrompt) {
  try {
    const parameters = await PromptUtils.loadParameters(parametersPath);
    const dynamicPrompt = await PromptUtils.generateDynamicPrompt(initialPromptPath, parameters);
    const combined_prompt = `${dynamicPrompt}\n\n${inputPrompt}`;

    logger.info('Sending request to OpenAI API...');
    
    const completion = await openai.beta.chat.completions.parse({
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

async function saveOutputToJson(output, fileName) {
  const outputPath = path.join(__dirname, '..', '..', 'data', 'output', fileName);
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  logger.info(`Output saved to ${outputPath}`);
}

module.exports = { generateContent, saveOutputToJson };