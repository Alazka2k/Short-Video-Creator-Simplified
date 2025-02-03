export function logEnvironmentConfig() {
  console.log('\n=== Frontend Environment Configuration ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('\nApplication URLs:');
  console.log('- App URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('- API URL:', process.env.NEXT_PUBLIC_API_URL);
  
  console.log('\nAuth0 Configuration:');
  console.log('- Domain:', process.env.NEXT_PUBLIC_AUTH0_DOMAIN);
  console.log('- Audience:', process.env.NEXT_PUBLIC_AUTH0_AUDIENCE);
  console.log('\n SPA application variables:');  
  console.log('- Client ID:', process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID);
  console.log('\n M2M application variables:');  
  console.log('- Client ID:', process.env.NEXT_PUBLIC_AUTH0_M2M_CLIENT_ID);
  console.log('- Client Secret:', process.env.NEXT_PUBLIC_AUTH0_M2M_CLIENT_SECRET);

  // Add validation warnings
  console.log('\nConfiguration Status:');
  const requiredVars = {
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'NEXT_PUBLIC_AUTH0_DOMAIN': process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
    'NEXT_PUBLIC_AUTH0_AUDIENCE': process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
    'NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID': process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID,
    'NEXT_PUBLIC_AUTH0_M2M_CLIENT_ID': process.env.NEXT_PUBLIC_AUTH0_M2M_CLIENT_ID,
    'NEXT_PUBLIC_AUTH0_M2M_CLIENT_SECRET': process.env.NEXT_PUBLIC_AUTH0_M2M_CLIENT_SECRET

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