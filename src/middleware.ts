import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Public routes that don't require authentication
 */
const PUBLIC_PATHS = ['/login', '/api/auth']

/**
 * Onboarding routes in order
 * Flow: Login → Register → Photo → Avatar → Welcome
 */
const ONBOARDING_PATHS = ['/register', '/photo', '/avatar']

/**
 * Routes that require full onboarding completion
 */
const PROTECTED_PATHS = [
  '/welcome',
  '/ranking',
  '/map',
  '/challenges',
  '/matches',
  '/player',
  '/venues',
]

/**
 * Check if path matches any of the patterns
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => pathname === pattern || pathname.startsWith(`${pattern}/`))
}

/**
 * Get the next step in the onboarding flow based on user status
 */
function getOnboardingRedirect(token: {
  hasCompletedProfile?: boolean
  hasUploadedPhoto?: boolean
  hasCreatedAvatar?: boolean
}): string {
  if (!token.hasCompletedProfile) return '/register'
  if (!token.hasUploadedPhoto) return '/photo'
  if (!token.hasCreatedAvatar) return '/avatar'
  return '/welcome'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths without authentication
  if (matchesPath(pathname, PUBLIC_PATHS)) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Get the token (session)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // No token = not authenticated → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Extract onboarding flags from token
  const hasCompletedProfile = token.hasCompletedProfile as boolean
  const hasUploadedPhoto = token.hasUploadedPhoto as boolean
  const hasCreatedAvatar = token.hasCreatedAvatar as boolean

  // Determine where user should be in the flow
  const expectedPath = getOnboardingRedirect({
    hasCompletedProfile,
    hasUploadedPhoto,
    hasCreatedAvatar,
  })

  // If user visits root, redirect to their appropriate step
  if (pathname === '/') {
    return NextResponse.redirect(new URL(expectedPath, request.url))
  }

  // If authenticated user visits login page, redirect to appropriate step
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(expectedPath, request.url))
  }

  // Handle onboarding paths - ensure user is at correct step
  if (matchesPath(pathname, ONBOARDING_PATHS)) {
    // User trying to access a later step than they should
    if (pathname === '/photo' && !hasCompletedProfile) {
      return NextResponse.redirect(new URL('/register', request.url))
    }
    if (pathname === '/avatar' && (!hasCompletedProfile || !hasUploadedPhoto)) {
      return NextResponse.redirect(new URL(expectedPath, request.url))
    }
    // Allow access to current or previous steps
    return NextResponse.next()
  }

  // Protected paths require full onboarding
  if (matchesPath(pathname, PROTECTED_PATHS)) {
    if (!hasCompletedProfile || !hasUploadedPhoto || !hasCreatedAvatar) {
      return NextResponse.redirect(new URL(expectedPath, request.url))
    }
  }

  // Allow the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
