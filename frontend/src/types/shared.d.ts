declare module '@shared/utils/config' {
  interface Auth0Config {
    domain: string;
    clientId: string;
    clientSecret: string;
    audience: string;
  }

  interface Config {
    auth: {
      auth0: Auth0Config;
    };
    // Add other config properties as needed
  }

  const config: Config;
  export default config;
} 