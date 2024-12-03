const storageService = require('../../backend/shared/utils/storage');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../backend/shared/utils/logger');

async function testS3Connection() {
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test.txt');
    await fs.writeFile(testFilePath, 'Hello S3!');

    // Upload to S3
    const result = await storageService.uploadFile(testFilePath, 'test');
    logger.info('File uploaded successfully:', result);

    // Get a signed URL
    const signedUrl = await storageService.getSignedUrl(result.storageKey);
    logger.info('Signed URL generated:', signedUrl);

    // Clean up
    await fs.unlink(testFilePath);
    logger.info('Test completed successfully');
  } catch (error) {
    logger.error('S3 test failed:', error);
    throw error;
  }
}

testS3Connection(); 