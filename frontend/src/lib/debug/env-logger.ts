export function logEnvironmentConfig() {
  // Only log environment details in development mode
  if (process.env.NODE_ENV !== 'development') {
    // In production, just log a minimal message if needed
    if (process.env.NODE_ENV === 'production') {
      console.log('Application running in production mode');
    }
    return;
  }

  console.log('\n=== Frontend Environment Configuration ===');
  console.log('Environment:', process.env.NODE_ENV);
  
  console.log('\nApplication URLs:');
  console.log('- App URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('- API URL:', process.env.NEXT_PUBLIC_API_URL);
  
  console.log('\nAuth0 Configuration:');
  console.log('- Domain:', process.env.NEXT_PUBLIC_AUTH0_DOMAIN);
  console.log('- Audience:', process.env.NEXT_PUBLIC_AUTH0_AUDIENCE);

  console.log('\nSPA Application Configuration:');
  console.log('- SPA Client ID:', process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID);

  // Log only existence of credentials in development, never the actual values
  const hasM2MClienId = !!process.env.AUTH0_M2M_CLIENT_ID;
  const hasM2MClientSecret = !!process.env.AUTH0_M2M_CLIENT_SECRET;
  const hasBeehiiv = !!process.env.BEEHIIV_PUBLICATION_ID && !!process.env.BEEHIIV_API_KEY;
  const hasEmailConfig = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD;

  console.log('\n Credential Status:');
  console.log('- M2M Credentials:', hasM2MClienId && hasM2MClientSecret ? '✓ Configured' : '✗ Missing');
  console.log('- Beehiiv Newsletter:', hasBeehiiv ? '✓ Configured' : '✗ Missing');
  console.log('- Email Integration:', hasEmailConfig ? '✓ Configured' : '✗ Missing');

  // Add validation warnings
  console.log('\nConfiguration Status:');
  const requiredVars = {
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL,
    'NEXT_PUBLIC_AUTH0_DOMAIN': process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
    'NEXT_PUBLIC_AUTH0_AUDIENCE': process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
    'NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID': process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID,
    'AUTH0_M2M_CLIENT_ID': process.env.AUTH0_M2M_CLIENT_ID,
    'AUTH0_M2M_CLIENT_SECRET': process.env.AUTH0_M2M_CLIENT_SECRET,
    'BEEHIIV_PUBLICATION_ID': process.env.BEEHIIV_PUBLICATION_ID,
    'BEEHIIV_API_KEY': process.env.BEEHIIV_API_KEY,
    'SMTP_HOST': process.env.SMTP_HOST,
    'SMTP_USER': process.env.SMTP_USER,
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