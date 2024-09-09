const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');

async function generateVoice(text, fileName) {
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceGen.voiceId}`,
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': config.voiceGen.apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      responseType: 'arraybuffer'
    });

    const outputDir = path.join(__dirname, '..', '..', config.output.directory);
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, fileName);
    await fs.writeFile(outputPath, response.data);

    logger.info(`Voice generated and saved to ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error('Error generating voice:', error);
    throw error;
  }
}

module.exports = { generateVoice };