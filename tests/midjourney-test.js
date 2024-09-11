const { Midjourney } = require('midjourney');
const config = require('../src/utils/config');
const logger = require('../src/utils/logger');

async function testMidjourney() {
  console.log('Starting Midjourney test...');
  console.log('Config:', JSON.stringify(config.imageGen, null, 2));

  const client = new Midjourney({
    ServerId: config.imageGen.serverId,
    ChannelId: config.imageGen.channelId,
    SalaiToken: config.imageGen.salaiToken,
    Debug: false, // Set to false to reduce logging
    Ws: config.imageGen.ws
  });

  try {
    console.log('Initializing Midjourney client...');
    await client.init();
    console.log('Midjourney client initialized successfully');

    console.log('Attempting to generate an image...');
    const result = await client.Imagine('A beautiful sunset over a calm ocean', (uri, progress) => {
      console.log(`Progress: ${progress}%`);
    });

    if (result) {
      console.log('Image generated successfully');
      console.log('Image URL:', result.uri);
    } else {
      console.log('No image was generated');
    }
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    // Close the Midjourney connection
    await client.Close();
    console.log('Midjourney connection closed');
  }
}

testMidjourney();