export function logEnvVars() {
  console.log('Environment Test:', {
    NODE_ENV: process.env.NODE_ENV,
    AUTH0_DOMAIN: process.env.NEXT_PUBLIC_DEVELOPMENT_AUTH0_DOMAIN,
    // Log all NEXT_PUBLIC_ variables
    publicVars: Object.entries(process.env)
      .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  });
} 