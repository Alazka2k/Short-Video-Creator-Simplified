import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code || !state) {
      console.error('Missing code or state in callback');
      return NextResponse.redirect('/');
    }
    
    // Try to parse the state parameter which may contain the return URL
    let returnTo = '/dashboard';
    let stateObj = null;
    
    try {
      // The state is base64 encoded JSON
      const stateString = Buffer.from(state, 'base64').toString();
      console.log('Decoded state string:', stateString);
      
      stateObj = JSON.parse(stateString);
      console.log('Parsed state object:', stateObj);
      
      if (stateObj && stateObj.returnTo) {
        returnTo = stateObj.returnTo;
        console.log(`Found return path in state object: ${returnTo}`);
      }
    } catch (error) {
      console.error('Error parsing state parameter:', error);
      // If parsing fails, try to use the raw state as returnTo
      if (state && state.startsWith('/')) {
        returnTo = state;
        console.log(`Using raw state as returnTo: ${returnTo}`);
      }
    }
    
    // Get returnTo from query parameters as fallback
    const queryReturnTo = searchParams.get('returnTo');
    if (queryReturnTo) {
      returnTo = queryReturnTo;
      console.log(`Using query returnTo: ${returnTo}`);
    }
    
    // Make sure returnTo starts with a slash and is a relative path
    if (!returnTo.startsWith('/')) {
      returnTo = '/' + returnTo;
    }
    
    // Security check - ensure returnTo is a relative path within our app
    if (returnTo.includes('://') || returnTo.startsWith('//')) {
      console.warn(`Potentially unsafe returnTo path detected: ${returnTo}, defaulting to /dashboard`);
      returnTo = '/dashboard';
    }
    
    // Add auth continuation marker to help the client side code handle the redirect better
    const redirectParams = new URLSearchParams();
    redirectParams.set('auth_callback', 'true');
    
    // Add a timestamp to help the client identify a fresh redirect
    redirectParams.set('auth_time', Date.now().toString());
    
    // Construct the redirect URL with our parameters
    let finalReturnUrl = returnTo;
    if (finalReturnUrl.includes('?')) {
      finalReturnUrl += '&' + redirectParams.toString();
    } else {
      finalReturnUrl += '?' + redirectParams.toString();
    }
    
    // Construct the absolute URL for redirection
    const redirectUrl = new URL(finalReturnUrl, url.origin);
    console.log(`Redirecting to: ${redirectUrl.toString()}`);
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set a cookie to help the client detect we're in a post-auth flow
    response.cookies.set('auth_redirect', 'true', { 
      maxAge: 60, // Short expiration - just enough to survive the next page load
      path: '/',
      httpOnly: false // Make it available to JavaScript
    });
    
    return response;
  } catch (error) {
    console.error('Error in auth callback:', error);
    return NextResponse.redirect('/');
  }
} 