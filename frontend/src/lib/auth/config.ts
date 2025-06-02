//ToDo: Merge this file with the other config.ts file from root folder

const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  
  return {
    // App URL
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,

    // General auth0 Config
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,

    // Single Page Application Config
    spaClientId: process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID!,
    
    // M2M Application Config
    //m2mClientId: process.env.AUTH0_M2M_CLIENT_ID!,
    //m2mClientSecret: process.env.AUTH0_M2M_CLIENT_SECRET!,

    // Beehiiv Newsletter Integration
    beehiivPublicationId: process.env.BEEHIIV_PUBLICATION_ID!,
    beehiivApiKey: process.env.BEEHIIV_API_KEY!,

    // EmailJS Newsletter Integration
    emailJsHost: process.env.SMTP_HOST!,
    emailJsPort: process.env.SMTP_PORT!,
    emailJsSecure: process.env.SMTP_SECURE!,
    emailJsUser: process.env.SMTP_USER!,
    emailJsPassword: process.env.SMTP_PASSWORD!,
    emailJsFromEmail: process.env.CONTACT_FROM_EMAIL!,
    emailJsToEmail: process.env.CONTACT_TO_EMAIL!,
    emailJsReplyTo: process.env.CONTACT_REPLY_TO!
  };
};

const envConfig = getEnvironmentConfig();

// Single Page Application Config
export const auth0Config = {
  domain: envConfig.domain,
  spaClientId: envConfig.spaClientId,
  authorizationParams: {
    redirect_uri: `${envConfig.appUrl}/api/auth/callback`,
    audience: envConfig.audience,
  },
  onRedirectCallback: (appState: any) => {
    window.location.href = appState?.returnTo || '/dashboard';
  },
};

// M2M Application Config
export const auth0M2MConfig = {
  domain: envConfig.domain,
  //m2mClientId: envConfig.m2mClientId,
  //m2mClientSecret: envConfig.m2mClientSecret,
  audience: envConfig.audience,
};


// Validation
if (process.env.NODE_ENV !== 'production') {
  // Next Public Configs Required for all environments
  const requiredConfigs = [
    'domain', 'audience', 'appUrl',
    'spaClientId', 
    //'m2mClientId', 'm2mClientSecret',
    //'beehiivPublicationId', 'beehiivApiKey',
    //'emailJsHost', 'emailJsPort', 'emailJsSecure', 'emailJsUser', 'emailJsPassword', 'emailJsFromEmail', 'emailJsToEmail', 'emailJsReplyTo'
  ];
  
  const missingRequiredConfigs = requiredConfigs
    .filter(key => !envConfig[key as keyof typeof envConfig])
    .map(key => key);

  if (missingRequiredConfigs.length > 0) {
    console.error('Missing required variables in configuration:', {
      environment: process.env.NODE_ENV,
      missingFields: missingRequiredConfigs,
    });
  }
}

export type AuthConfig = typeof auth0Config;
export type M2MConfig = typeof auth0M2MConfig;
