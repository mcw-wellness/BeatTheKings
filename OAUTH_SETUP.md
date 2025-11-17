# OAuth Setup Guide

This guide will help you configure Google and Microsoft OAuth authentication for Beat the Kingz.

## Prerequisites

- Google Cloud Console account
- Azure Portal account (you mentioned you already have this)
- Access to your application's environment variables

## Step 1: Create a `.env.local` file

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

## Step 2: Generate NextAuth Secret

Run this command to generate a secure random secret:

```bash
openssl rand -base64 32
```

Add it to your `.env.local`:

```
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

For production, update `NEXTAUTH_URL` to your production domain (e.g., `https://beatthekingz.com`)

## Step 3: Configure Microsoft Azure AD

You mentioned you already registered your app in Azure. Here's what you need:

1. **Go to Azure Portal** → Azure Active Directory → App registrations
2. **Select your app** (or create a new one if needed)
3. **Get your credentials:**
   - Application (client) ID
   - Directory (tenant) ID
   - Create a Client Secret (under "Certificates & secrets")

4. **Configure Redirect URIs:**
   - Go to "Authentication" section
   - Add platform: "Web"
   - Add these redirect URIs:
     - `http://localhost:3000/api/auth/callback/azure-ad` (for local dev)
     - `https://your-production-domain.com/api/auth/callback/azure-ad` (for production)

5. **Add to `.env.local`:**

```env
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"
```

## Step 4: Configure Google OAuth

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a new project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name it "Beat the Kingz" or similar

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

4. **Create OAuth credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Beat the Kingz Web Client"

5. **Configure Authorized redirect URIs:**
   - Add these URIs:
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
     - `https://your-production-domain.com/api/auth/callback/google` (for production)

6. **Copy your credentials:**
   - Client ID
   - Client Secret

7. **Add to `.env.local`:**

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Step 5: Final `.env.local` Example

Your complete `.env.local` should look like:

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"

# Microsoft Azure AD OAuth
AZURE_AD_CLIENT_ID="12345678-1234-1234-1234-123456789abc"
AZURE_AD_CLIENT_SECRET="your-azure-secret-here"
AZURE_AD_TENANT_ID="12345678-1234-1234-1234-123456789abc"

# Database and other configs...
```

## Step 6: Test the Authentication

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - You should see the "Sign in with Google" and "Sign in with Microsoft" buttons

3. **Test each provider:**
   - Click "Sign in with Google" - should redirect to Google login
   - Click "Sign in with Microsoft" - should redirect to Microsoft login
   - After successful authentication, you should be redirected to `/welcome`

## Usage in Your App

### Check if user is authenticated:

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Welcome, {user?.name}!</div>;
}
```

### Add sign-out button:

```tsx
import { SignOutButton } from '@/components/SignOutButton';

export default function MyPage() {
  return (
    <div>
      <SignOutButton />
    </div>
  );
}
```

### Protect pages (server-side):

```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return <div>Protected content</div>;
}
```

## Troubleshooting

### "Configuration error" or "Invalid credentials"
- Double-check all credentials in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env.local`

### "Redirect URI mismatch"
- Verify the redirect URIs in both Google Console and Azure Portal match exactly
- Remember: `http://localhost:3000/api/auth/callback/google` and `/azure-ad`

### "Missing NEXTAUTH_SECRET"
- Make sure you generated and added the NEXTAUTH_SECRET to `.env.local`

### Cannot sign in
- Check browser console for errors
- Check terminal for server errors
- Verify all OAuth apps are properly configured and active

## Production Deployment

When deploying to production:

1. Update `NEXTAUTH_URL` to your production domain
2. Add production redirect URIs to both Google and Azure
3. Set all environment variables in your hosting platform (Azure, Vercel, etc.)
4. Never commit `.env.local` to git (it's already in `.gitignore`)

## Security Best Practices

- Never expose your Client Secrets
- Keep your NEXTAUTH_SECRET secure and random
- Use environment variables for all sensitive data
- Rotate secrets periodically
- Use HTTPS in production (NextAuth requires it)

---

For more information, visit:
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://next-auth.js.org/providers/google)
- [Azure AD Setup](https://next-auth.js.org/providers/azure-ad)
