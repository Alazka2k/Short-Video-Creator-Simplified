export function logEnvironmentConfig() {
  console.log('\n=== Frontend Environment Configuration ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('\nApplication URLs:');
  console.log('- App URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('- API URL:', process.env.NEXT_PUBLIC_API_URL);
  
  console.log('\nAuth0 Configuration:');
  console.log('- Domain:', process.env.NEXT_PUBLIC_AUTH0_DOMAIN);
  console.log('- Client ID:', process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);
  console.log('- Audience:', process.env.NEXT_PUBLIC_AUTH0_AUDIENCE);
  
  // Add validation warnings
  console.log('\nConfiguration Status:');
  const requiredVars = {
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL,
    'NEXT_PUBLIC_AUTH0_DOMAIN': process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
    'NEXT_PUBLIC_AUTH0_CLIENT_ID': process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
    'NEXT_PUBLIC_AUTH0_AUDIENCE': process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
  };

  let allConfigured = true;
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      console.log(`⚠️  Missing required variable: ${key}`);
      allConfigured = false;
    }
  });

  if (allConfigured) {
    console.log('✅ All required variables are configured');
  }
  
  console.log('========================================\n');
} 