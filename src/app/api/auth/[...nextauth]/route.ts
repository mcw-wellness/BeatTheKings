import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { getDb } from '@/db'
import { getOrCreateUser, findUserById } from '@/lib/auth/drizzle-adapter'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only process OAuth sign-ins
      if (!account || !user.email) {
        return false
      }

      try {
        // Get or create user in database
        const db = getDb()
        const { user: dbUser } = await getOrCreateUser(db, {
          email: user.email,
          name: user.name,
        })

        // Store the database user ID for use in jwt callback
        user.id = dbUser.id

        return true
      } catch (error) {
        console.error('Error during sign-in:', error)
        return false
      }
    },

    async redirect({ url, baseUrl }) {
      // If the url is relative, prepend the base url
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // If the url is on the same origin, allow it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default to base url
      return baseUrl
    },

    async jwt({ token, user, trigger }) {
      // Initial sign-in: add user data to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }

      // Always refresh onboarding flags from database
      // This ensures they stay in sync across all sessions/browsers
      // Also refresh on explicit update trigger
      if (token.id || trigger === 'update') {
        try {
          const db = getDb()
          const dbUser = await findUserById(db, token.id as string)
          if (dbUser) {
            token.hasCompletedProfile = dbUser.hasCompletedProfile ?? false
            token.hasUploadedPhoto = dbUser.hasUploadedPhoto ?? false
            token.hasCreatedAvatar = dbUser.hasCreatedAvatar ?? false
            token.nickname = dbUser.nickname ?? null
          }
        } catch {
          // Keep existing values on error
          if (token.hasCompletedProfile === undefined) token.hasCompletedProfile = false
          if (token.hasUploadedPhoto === undefined) token.hasUploadedPhoto = false
          if (token.hasCreatedAvatar === undefined) token.hasCreatedAvatar = false
        }
      }

      return token
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.nickname = token.nickname as string | null
        session.user.hasCompletedProfile = token.hasCompletedProfile as boolean
        session.user.hasUploadedPhoto = token.hasUploadedPhoto as boolean
        session.user.hasCreatedAvatar = token.hasCreatedAvatar as boolean
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      nickname?: string | null
      image?: string | null
      hasCompletedProfile: boolean
      hasUploadedPhoto: boolean
      hasCreatedAvatar: boolean
    }
  }

  interface User {
    id: string
    hasCompletedProfile?: boolean
    hasUploadedPhoto?: boolean
    hasCreatedAvatar?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    nickname?: string | null
    hasCompletedProfile: boolean
    hasUploadedPhoto: boolean
    hasCreatedAvatar: boolean
  }
}
