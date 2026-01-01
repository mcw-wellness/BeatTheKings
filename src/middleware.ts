import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Public routes that don't require authentication
 */
const PUBLIC_PATHS = ['/login', '/api/auth']

/**
 * Routes that require avatar to be created
 * Flow: Login → Avatar → Location → Welcome
 */
const AVATAR_REQUIRED_PATHS = [
  '/location',
  '/welcome',
  '/ranking',
  '/map',
  '/challenges',
  '/matches',
  '/player',
]

/**
 * Check if path matches any of the patterns
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => pathname === pattern || pathname.startsWith(`${pattern}/`))
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

  // No token = not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated - check avatar status
  const hasCreatedAvatar = token.hasCreatedAvatar as boolean

  // If user hasn't created avatar and tries to access avatar-required routes
  if (!hasCreatedAvatar && matchesPath(pathname, AVATAR_REQUIRED_PATHS)) {
    return NextResponse.redirect(new URL('/avatar', request.url))
  }

  // If authenticated user visits login page, redirect to avatar or welcome
  if (pathname === '/login') {
    const redirectPath = hasCreatedAvatar ? '/welcome' : '/avatar'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // If user visits root, redirect to avatar or welcome
  if (pathname === '/') {
    const redirectPath = hasCreatedAvatar ? '/welcome' : '/avatar'
    return NextResponse.redirect(new URL(redirectPath, request.url))
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
