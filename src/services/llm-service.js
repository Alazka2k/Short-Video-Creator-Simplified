const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const config = require('../utils/config');
const logger = require('../utils/logger');
const PromptUtils = require('../utils/prompt-utils');
const { VideoScriptSchema } = require('../models');

const openai = new OpenAI({
  apiKey: config.llm.apiKey,
});

logger.info('OpenAI API Key:', config.llm.apiKey ? 'Loaded' : 'Missing');
logger.info('OpenAI Model:', config.llm.model);

async function generateContent(initialPromptPath, parametersPath, inputPrompt) {
  try {
    //logger.info('Generating content with input prompt:', { inputPrompt });
    const parameters = await PromptUtils.loadParameters(parametersPath);
    const dynamicPrompt = await PromptUtils.generateDynamicPrompt(initialPromptPath, parameters);
    const combined_prompt = `${dynamicPrompt}\n\n${inputPrompt}`;

    //logger.info('Combined prompt:', { combined_prompt });
    logger.info('Sending request to OpenAI API...');
    
    const completion = await openai.beta.chat.completions.parse({
      model: config.llm.model,
      messages: [
        { role: "system", content: "Extract the video script information according to the provided schema." },
        { role: "user", content: combined_prompt },
      ],
      response_format: zodResponseFormat(VideoScriptSchema, "video_script"),
    });

    logger.info('Received response from OpenAI API');
    //logger.info('Raw response:', { response: JSON.stringify(completion, null, 2) });

    const video_script = completion.choices[0].message.parsed;
    logger.info('Generated content structure:', { video_script });

    return video_script;
  } catch (error) {
    logger.error('Error generating content with LLM:', { error: error.toString(), stack: error.stack });
    throw error;
  }
}

module.exports = { generateContent };