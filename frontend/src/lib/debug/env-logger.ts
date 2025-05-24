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

  console.log('\n SPA application variables:');  
  console.log('- Client ID:', process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID);

  console.log('\n M2M application variables:');  
  console.log('- Client ID:', process.env.AUTH0_M2M_CLIENT_ID);
  console.log('- Client Secret:', process.env.AUTH0_M2M_CLIENT_SECRET);

  console.log('\n Beehiiv Newsletter Integration:');
  console.log('- Publication ID:', process.env.BEEHIIV_PUBLICATION_ID);
  console.log('- API Key:', process.env.BEEHIIV_API_KEY);
  
  console.log('\n EmailJS Credentials:');
  console.log('- Host:', process.env.SMTP_HOST);
  console.log('- Port:', process.env.SMTP_PORT);
  console.log('- Secure:', process.env.SMTP_SECURE);
  console.log('- User:', process.env.SMTP_USER);
  console.log('- Password:', process.env.SMTP_PASSWORD);
  console.log('- From Email:', process.env.CONTACT_FROM_EMAIL);
  console.log('- To Email:', process.env.CONTACT_TO_EMAIL);
  console.log('- Reply To:', process.env.CONTACT_REPLY_TO);

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
    'SMTP_PORT': process.env.SMTP_PORT,
    'SMTP_SECURE': process.env.SMTP_SECURE,
    'SMTP_USER': process.env.SMTP_USER,
    'SMTP_PASSWORD': process.env.SMTP_PASSWORD,
    'CONTACT_FROM_EMAIL': process.env.CONTACT_FROM_EMAIL,
    'CONTACT_TO_EMAIL': process.env.CONTACT_TO_EMAIL,
    'CONTACT_REPLY_TO': process.env.CONTACT_REPLY_TO
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