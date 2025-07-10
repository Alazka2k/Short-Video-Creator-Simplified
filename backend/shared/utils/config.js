const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function loadEnvConfig() {
  const env = process.env.NODE_ENV;
  const envFile = `.env.${env}`;
  const rootDir = path.join(__dirname, '..', '..', '..');
  const envPath = path.join(rootDir, envFile);

  if (!fs.existsSync(envPath)) {
    logger.error(`Environment file ${envFile} not found. Please create it based on .env.example`);
    process.exit(1);
  }

  dotenv.config({ path: envPath });
  logger.info(`Loaded environment configuration from ${envFile}`);

  const config = {
    env,
    basePaths: {
      root: rootDir,
      input: path.join(rootDir, 'data', 'input'),
      output: path.join(rootDir, 'data', 'output'),
      test: path.join(rootDir, 'tests', 'test_output')
    },
    db: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME,
      port: process.env.DB_PORT
    },
    llm: {
      provider: process.env.LLM_PROVIDER,
      model: process.env.LLM_MODEL,
      apiKey: process.env.LLM_API_KEY, 
      basePath: path.join(rootDir, 'data', 'input'), //TODO change base path to input directory
      inputDirectory: path.join(rootDir, 'data', 'input')
    },
    voiceGen: {
      provider: process.env.VOICE_PROVIDER,
      apiKey: process.env.VOICE_API_KEY,
      modelId: process.env.VOICE_MODEL_ID,
      voiceId: process.env.VOICE_ID,
      outputDirectory: path.join(rootDir, 'data', 'output', 'voice') // TODO move the path definition to env file
    },
    imageGen: {
      provider: process.env.IMAGE_PROVIDER,
      serverId: process.env.IMAGE_SERVER_ID,
      channelId: process.env.IMAGE_CHANNEL_ID,
      salaiToken: process.env.IMAGE_SALAI_TOKEN,
      debug: process.env.IMAGE_DEBUG === 'true',
      ws: process.env.IMAGE_WS === 'true'
    },
    musicGen: {
      provider: process.env.MUSIC_PROVIDER,
      modelId: process.env.MUSIC_MODEL_ID,
      apiKey: process.env.MUSIC_API_KEY,
      maxRetries: 5,
    },
    animationGen: {
      provider: process.env.ANIMATION_PROVIDER,
      baseUrl: process.env.ANIMATION_BASE_URL,
      authUrl: process.env.ANIMATION_AUTH_URL,
      clientId: process.env.ANIMATION_CLIENT_ID,
      clientSecret: process.env.ANIMATION_CLIENT_SECRET,
      animationLength: process.env.ANIMATION_LENGTH,
      outputDirectory: path.join(rootDir, 'data', 'output', 'animation') // TODO move the path definition to env file
    },
    videoGen: {
      provider: process.env.VIDEO_PROVIDER,
      model: process.env.VIDEO_MODEL,
      resolution: process.env.VIDEO_RESOLUTION,
      apiKey: process.env.VIDEO_API_KEY
    },
    assembly: {
      provider: process.env.ASSEMBLY_PROVIDER,
      apiKey: process.env.ASSEMBLY_API_KEY,
      webhookBaseUrl: process.env.ASSEMBLY_WEBHOOK_BASE_URL
    },
    stripe: {
      apiKey: process.env.STRIPE_API_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    services: {
      llm: { 
        port: process.env.LLM_SERVICE_PORT,
        url: process.env.LLM_SERVICE_URL },
      image: { 
        port: process.env.IMAGE_SERVICE_PORT,
        url: process.env.IMAGE_SERVICE_URL 
      },
      voice: { 
        port: process.env.VOICE_SERVICE_PORT,
        url: process.env.VOICE_SERVICE_URL 
      },
      animation: { 
        port: process.env.ANIMATION_SERVICE_PORT,
        url: process.env.ANIMATION_SERVICE_URL 
      },
      video: { 
        port: process.env.VIDEO_SERVICE_PORT,
        url: process.env.VIDEO_SERVICE_URL 
      },
      music: { 
        port: process.env.MUSIC_SERVICE_PORT,
        url: process.env.MUSIC_SERVICE_URL 
      },
      assembly: { 
        port: process.env.ASSEMBLY_SERVICE_PORT,
        url: process.env.ASSEMBLY_SERVICE_URL 
      },
      job: { 
        port: process.env.JOB_SERVICE_PORT,
        url: process.env.JOB_SERVICE_URL 
      },
      gateway: {
        port: process.env.API_GATEWAY_SERVICE_PORT,
        url: process.env.API_GATEWAY_SERVICE_URL
      },
      auth: { 
        port: process.env.AUTH_SERVICE_PORT,
        url: process.env.AUTH_SERVICE_URL 
      },
      subscription: { 
        port: process.env.SUBSCRIPTION_SERVICE_PORT,
        url: process.env.SUBSCRIPTION_SERVICE_URL 
      },
      batch: { 
        port: process.env.BATCH_SERVICE_PORT,
        url: process.env.BATCH_SERVICE_URL 
      },
      frontend: { 
        port: process.env.FRONTEND_PORT,
        url: process.env.FRONTEND_URL 
      },
      docs: { 
        port: process.env.DOCS_SERVICE_PORT,
        url: process.env.DOCS_SERVICE_URL 
      },
      storage: {
        type: 'aws',
        config: {
          region: process.env.AWS_REGION,
          bucket: process.env.AWS_BUCKET,
          cdnUrl: process.env.CDN_URL,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      }
    },
    auth: {
      auth0: {
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_AUDIENCE
      },
      auth0CustomClaims: {
        serviceAuthToken: process.env.SERVICE_AUTH_TOKEN,
        customClaimsNamespace: process.env.CUSTOM_CLAIMS_NAMESPACE
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        accessExpirationMinutes: 60,
        refreshExpirationDays: 30
      }
    },
    parameters: {
      jsonPath: process.env.PARAMETERS_JSON_PATH
    },
    initialPrompt: {
      txtPath: process.env.INITIAL_PROMPT_PATH
    },
    input: {
      csvPath: process.env.INPUT_CSV_PATH,
      llmDirectory: process.env.LLM_INPUT_DIRECTORY
    },
    output: {
      directory: process.env.OUTPUT_DIRECTORY,
      llmDirectory: process.env.LLM_OUTPUT_DIRECTORY,
      integrationDirectory: process.env.INTEGRATION_OUTPUT_DIRECTORY,
      animationDirectory: process.env.ANIMATION_OUTPUT_DIRECTORY // use this for animation output directory
    },
    test: {
      outputDirectory: path.join(rootDir, 'tests', 'test_output')
    }
  };

  // Validate required configurations
  validateConfig(config);

  // Log configuration based on environment
  logConfiguration(config);

  return config;
}

function validateConfig(config) {
  const requiredConfigs = [
    ['db.host', 'db.user', 'db.password', 'db.name', 'db.port'],
    ['llm.provider', 'llm.model', 'llm.apiKey'],
    ['voiceGen.provider', 'voiceGen.apiKey', 'voiceGen.outputDirectory'],
    ['imageGen.provider', 'imageGen.serverId', 'imageGen.channelId', 'imageGen.salaiToken'],
    ['musicGen.provider', 'musicGen.apiKey', 'musicGen.modelId'],
    ['animationGen.provider', 'animationGen.baseUrl', 'animationGen.authUrl', 'animationGen.clientId', 'animationGen.clientSecret'],
    ['videoGen.provider', 'videoGen.model', 'videoGen.resolution', 'videoGen.apiKey'],
    ['assembly.provider', 'assembly.apiKey', 'assembly.webhookBaseUrl'],
    ['stripe.apiKey', 'stripe.webhookSecret'],
    ['auth.auth0.domain', 'auth.auth0.clientId', 'auth.auth0.clientSecret', 'auth.auth0.audience'],
    ['auth.auth0CustomClaims.serviceAuthToken', 'auth.auth0CustomClaims.customClaimsNamespace'],
    ['auth.jwt.secret'],
    ['services.storage.config.region', 'services.storage.config.bucket', 'services.storage.config.cdnUrl'],
    ['services.llm.port', 'services.llm.url'],
    ['services.image.port', 'services.image.url'],
    ['services.voice.port', 'services.voice.url'],
    ['services.animation.port', 'services.animation.url'],
    ['services.video.port', 'services.video.url'],
    ['services.music.port', 'services.music.url'],
    ['services.assembly.port', 'services.assembly.url'],
    ['services.job.port', 'services.job.url'],
    ['services.batch.port', 'services.batch.url'],
    ['services.gateway.port', 'services.gateway.url'],
    ['services.auth.port', 'services.auth.url'],
    ['services.subscription.port', 'services.subscription.url'],
    ['services.frontend.port', 'services.frontend.url'],
    ['services.docs.port', 'services.docs.url']
  ];

  for (const configGroup of requiredConfigs) {
    for (const configPath of configGroup) {
      const value = configPath.split('.').reduce((obj, key) => obj && obj[key], config);
      if (!value) {
        logger.error(`Missing required configuration: ${configPath}`);
        process.exit(1);
      }
    }
  }
}

function logConfiguration(config) {
  logger.info('Environment:', config.env);

  // Create safe versions of configurations (without sensitive data)
  const safeServiceUrls = {
    ...config.services,
    storage: {
      type: config.services.storage.type,
      config: {
        region: config.services.storage.config.region,
        bucket: config.services.storage.config.bucket,
        cdnUrl: config.services.storage.config.cdnUrl,
        // Omit credentials
        hasCredentials: !!config.services.storage.config.accessKeyId
      }
    }
  };

  // Always log service URLs (they're not sensitive)
  //logger.info('Service URLs:', safeServiceUrls);

  if (config.env === 'development') {
    // In development, log everything including sensitive data
    /*logger.info('LLM configuration:', config.llm);
    logger.info('Voice configuration:', config.voiceGen);
    logger.info('Image configuration:', config.imageGen);
    logger.info('Music configuration:', config.musicGen);
    logger.info('Animation configuration:', config.animationGen);
    logger.info('Video configuration:', config.videoGen);
    logger.info('Assembly configuration:', config.assembly);
    logger.info('Storage configuration:', config.services.storage);
    logger.info('Auth configuration:', config.auth);
    logger.info('Subscription configuration:', config.subscription);
    logger.info('Batch configuration:', config.batch);*/
  } else {
    // In staging/production, log only non-sensitive information
    logger.info('LLM configuration:', { provider: config.llm.provider, model: config.llm.model });
    logger.info('Voice configuration:', { provider: config.voiceGen.provider });
    logger.info('Image configuration:', { provider: config.imageGen.provider });
    logger.info('Music configuration:', { provider: config.musicGen.provider });
    logger.info('Animation configuration:', { provider: config.animationGen.provider });
    logger.info('Video configuration:', { provider: config.videoGen.provider, resolution: config.videoGen.resolution });
    logger.info('Assembly configuration:', { provider: config.assembly.provider });
    logger.info('Storage configuration:', { 
      type: config.services.storage.type,
      region: config.services.storage.config.region,
      bucket: config.services.storage.config.bucket
    });
    logger.info('Auth configuration:', { 
      auth0: { 
        domain: config.auth.auth0.domain,
        audience: config.auth.auth0.audience
      }
    });
    logger.info('Stripe configuration:', {
      hasApiKey: !!config.stripe.apiKey,
      hasWebhookSecret: !!config.stripe.webhookSecret
    });
    logger.info('Batch configuration:', {
    });
  }
}

const config = loadEnvConfig();

module.exports = config;