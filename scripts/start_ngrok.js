const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Function to update .env file
function updateEnvFile(webhookUrl) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Regular expression to match the DEVELOPMENT_ASSEMBLY_WEBHOOK_BASE_URL line
  const webhookRegex = /(DEVELOPMENT_ASSEMBLY_WEBHOOK_BASE_URL=).*/;
  
  if (webhookRegex.test(envContent)) {
    // Update existing webhook URL
    envContent = envContent.replace(webhookRegex, `$1${webhookUrl}`);
  } else {
    // Add webhook URL if it doesn't exist
    envContent += `\nDEVELOPMENT_ASSEMBLY_WEBHOOK_BASE_URL=${webhookUrl}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated .env file with webhook URL: ${webhookUrl}`);
}

// Function to get ngrok URL from API
function getngrokUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          const httpsUrl = tunnels.tunnels.find(t => t.proto === 'https')?.public_url;
          if (httpsUrl) {
            resolve(httpsUrl);
          } else {
            reject(new Error('No HTTPS tunnel found'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Main function to start ngrok and update .env
async function main() {
  console.log('Starting ngrok...');
  
  // Start ngrok process
  const ngrok = spawn('ngrok', ['http', '3000'], {
    stdio: ['inherit', 'inherit', 'inherit']
  });
  
  // Handle ngrok process events
  ngrok.on('error', (err) => {
    console.error('Failed to start ngrok:', err);
    process.exit(1);
  });
  
  // Wait for ngrok to start and get URL
  console.log('Waiting for ngrok to start...');
  let retries = 0;
  const maxRetries = 10;
  
  const checkngrok = async () => {
    try {
      const url = await getngrokUrl();
      updateEnvFile(url);
      console.log('ngrok is running successfully!');
    } catch (err) {
      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying (${retries}/${maxRetries})...`);
        setTimeout(checkngrok, 1000);
      } else {
        console.error('Failed to get ngrok URL after multiple attempts');
        ngrok.kill();
        process.exit(1);
      }
    }
  };
  
  // Initial delay to let ngrok start
  setTimeout(checkngrok, 2000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down ngrok...');
    ngrok.kill();
    process.exit();
  });
}

// Start the script
main(); 