const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function downloadImageWithPuppeteer(url, outputPath) {
  const browser = await puppeteer.launch({ headless: false }); // Run in headful mode to see what's happening
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait for the challenge to be solved
  await page.waitForSelector('img'); // Adjust this selector based on the actual content

  // Extract the image content
  const viewSource = await page.goto(url);
  const buffer = await viewSource.buffer();
  fs.writeFileSync(outputPath, buffer);

  await browser.close();
  console.log(`Image downloaded successfully to ${outputPath}`);
}

// Example usage
downloadImageWithPuppeteer('https://cdn.midjourney.com/1321f4f7-e640-4991-a6e6-6f4d58cce4c6/0_2.png', path.join(__dirname, 'image.png'))
  .catch(err => console.error('Failed to download image:', err));