const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  
  return {
    // General auth0 Config
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,

    // Single Page Application Config
    spaClientId: process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID!,
    
    // M2M Application Config
    m2mClientId: process.env.NEXT_PUBLIC_AUTH0_M2M_CLIENT_ID!,
    m2mClientSecret: process.env.NEXT_PUBLIC_AUTH0_M2M_CLIENT_SECRET!,
  };
};

const envConfig = getEnvironmentConfig();

// Single Page Application Config
export const auth0Config = {
  domain: envConfig.domain,
  spaClientId: envConfig.spaClientId,
  authorizationParams: {
    redirect_uri: `${envConfig.appUrl}/dashboard`,
    audience: envConfig.audience,
  },
  onRedirectCallback: (appState: any) => {
    window.location.href = appState?.returnTo || '/dashboard';
  },
};

// M2M Application Config
export const auth0M2MConfig = {
  domain: envConfig.domain,
  m2mClientId: envConfig.m2mClientId,
  m2mClientSecret: envConfig.m2mClientSecret,
  audience: envConfig.audience,
};


// Validation
if (process.env.NODE_ENV !== 'production') {
  // Required for all environments
  const requiredConfigs = ['domain', 'spaClientId', 'm2mClientId', 'm2mClientSecret', 'audience', 'appUrl'];
  
  const missingRequiredConfigs = requiredConfigs
    .filter(key => !envConfig[key as keyof typeof envConfig])
    .map(key => key);

  if (missingRequiredConfigs.length > 0) {
    console.error('Missing required Auth0 configuration:', {
      environment: process.env.NODE_ENV,
      missingFields: missingRequiredConfigs,
    });
  }
}

export type AuthConfig = typeof auth0Config;
export type M2MConfig = typeof auth0M2MConfig;
