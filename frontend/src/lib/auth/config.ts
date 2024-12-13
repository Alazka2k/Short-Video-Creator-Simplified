const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  
  return {
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
    clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  };
};

const envConfig = getEnvironmentConfig();

export const auth0Config = {
  domain: envConfig.domain,
  clientId: envConfig.clientId,
  authorizationParams: {
    redirect_uri: `${envConfig.appUrl}/dashboard`,
    audience: envConfig.audience,
  },
  onRedirectCallback: (appState: any) => {
    window.location.href = appState?.returnTo || '/dashboard';
  },
};

// Validation
if (process.env.NODE_ENV !== 'production') {
  const missingConfigs = Object.entries(envConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingConfigs.length > 0) {
    console.error('Missing Auth0 configuration:', {
      environment: process.env.NODE_ENV,
      missingFields: missingConfigs,
    });
  }
}

export type AuthConfig = typeof auth0Config;
