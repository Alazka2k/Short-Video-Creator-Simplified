/**
 * Middleware for the prelaunch page
 * 
 * This middleware is used to block all routes that are not the prelaunch page.
 * It also allows access to static files and API routes.
 * 
 * For production, you can set PRELAUNCH_MODE to false to disable the restrictions.
*/

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Set this to false to disable prelaunch mode and allow all routes
const PRELAUNCH_MODE = false

// Routes that should be accessible during prelaunch
const ALLOWED_ROUTES = [
  '/',
  '/imprint',
  '/privacy-policy',
  '/cookie-policy',
  '/terms-of-service',
  '/support',
  '/features',
]

// Routes that should be explicitly blocked
const BLOCKED_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/dashboard',
  '/workbench',
  '/create',
  '/videos',
  '/settings',
  '/showcase',
  '/pricing',
  '/blog'
]

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const fullPath = `${pathname}${search}`

  console.log(`Middleware processing: ${fullPath}`)

  // If prelaunch mode is disabled, allow all routes
  if (!PRELAUNCH_MODE) {
    console.log('Prelaunch mode disabled, allowing all routes')
    return NextResponse.next()
  }

  // Allow access to static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') || 
    pathname.startsWith('/branding') || 
    pathname.startsWith('/images') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/prelaunch') ||  // Allow access to prelaunch assets
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.mp4') ||  // Allow access to video files
    pathname.endsWith('.webm') || // Allow access to webm videos
    pathname.endsWith('.m4v')     // Allow access to m4v videos
  ) {
    console.log(`Allowing static resource: ${pathname}`)
    return NextResponse.next()
  }

  // Check if the route is explicitly blocked
  const isBlockedRoute = BLOCKED_ROUTES.some(route => 
    pathname === route || 
    pathname.startsWith(`${route}/`)
  )

  if (isBlockedRoute) {
    console.log(`Blocking route: ${pathname}`)
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check if the route is allowed
  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    pathname === route || 
    pathname === `${route}/`
  )

  // If not allowed, redirect to the main landing page
  if (!isAllowedRoute) {
    console.log(`Route not in allowlist, redirecting: ${pathname}`)
    return NextResponse.redirect(new URL('/', request.url))
  }

  console.log(`Allowing route: ${pathname}`)
  return NextResponse.next()
}

// Configure the middleware to run on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 