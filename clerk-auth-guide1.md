# Clerk + Vercel + Next.js + Google OAuth Setup Guide

This guide follows the official [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart) and [Vercel integration documentation](https://vercel.com/integrations/clerk) to set up secure authentication in your Next.js application.

## Prerequisites

- Node.js 18+ installed
- A Vercel account
- A Google Cloud project
- A Clerk account

## Step 1: Create a Clerk Account and Project

1. Go to [clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application
3. Select **Next.js** as your framework
4. Clerk will automatically provide your API keys
5. Complete the onboarding process

## Step 2: Connect Clerk via Vercel Integration

The easiest way to integrate Clerk with Vercel is through the official integration:

1. Go to [vercel.com/integrations/clerk](https://vercel.com/integrations/clerk)
2. Click **Add Integration**
3. Select the Vercel project you want to connect
4. Authorize the integration
5. Select your Clerk application from the dropdown
6. Click **Install**

This will automatically:
- Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to your environment variables
- Add `CLERK_SECRET_KEY` to your environment variables
- Configure the middleware
- Set up sign-in and sign-up routes

If you don't have a Vercel project yet, follow Step 3 first.

## Step 3: Set Up Your Next.js Project

### Create a New Next.js Project

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
```

### Install Clerk

```bash
npm install @clerk/nextjs
```

### Get Your API Keys

If you haven't used the Vercel integration, manually add your keys:

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** and copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

Create `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

These environment variables configure:
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Where to find your sign-in page
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Where to find your sign-up page
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` - **Redirects to dashboard after login**
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` - **Redirects to dashboard after signup**

## Step 4: Update Your Root Layout

Update `app/layout.tsx` with the official Clerk components:

```typescript
import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'My App - Authentication with Clerk',
  description: 'Secure authentication powered by Clerk',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex justify-end items-center p-4 gap-4 h-16 bg-white shadow-sm">
            <SignedOut>
              <SignInButton>
                <button className="bg-blue-600 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-blue-700 transition">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="bg-green-600 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-green-700 transition">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

## Step 5: Set Up Middleware

Create `middleware.ts` in your project root:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))(?:.*)|api|trpc)(.*)',
  ],
}
```

## Step 6: Create Protected Pages

### Create Dashboard Page

Create `app/dashboard/page.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server'
import Nav from '@/components/Navbar/page'
import SpreadSuggestionsServer from '@/(components)/Spread1'
import Link from 'next/link'

export default async function DashboardPage() {
  // Protect this route - redirects to sign-in if not authenticated
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Stock Newest Dashboard Sept 19th
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Welcome! You are signed in with user ID:{' '}
              <span className="font-mono bg-white/10 px-2 py-1 rounded border border-white/20">
                {userId}
              </span>
            </p>
          </div>

          <div className="animate-fade-in-up bg-white/5 text-white/60 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-green-500/30">
            <SpreadSuggestionsServer />
          </div>
        </div>
      </div>
    </>
  )
}
```

### Create Profile Page with User Data

Create `app/profile/page.tsx`:

```typescript
import { auth, clerkClient } from '@clerk/nextjs/server'

export default async function ProfilePage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

          <div className="space-y-6">
            {/* Profile Image */}
            {user.profileImageUrl && (
              <div className="flex items-center space-x-4">
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full"
                />
              </div>
            )}

            {/* User Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <p className="text-lg">
                {user.firstName} {user.lastName}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <p className="text-lg">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                {user.id}
              </p>
            </div>

            {/* Account Created */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Created
              </label>
              <p className="text-lg">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Step 7: Create Protected API Routes

### Protected API Route Example

Create `app/api/protected/route.ts`:

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  // Protect this route - returns 404 if not authenticated
  await auth.protect()

  return NextResponse.json({
    message: 'This is a protected API route',
    timestamp: new Date().toISOString(),
  })
}
```

### Update User API Route

Create `app/api/user/update/route.ts`:

```typescript
import { NextResponse, NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  // Get the authenticated user
  const { userId } = await auth()

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  try {
    // Parse the request body
    const { firstName, lastName } = await req.json()

    // Update the user using clerkClient
    const client = await clerkClient()
    const user = await client.users.updateUser(userId, {
      firstName,
      lastName,
    })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 400 }
    )
  }
}
```

## Step 8: Set Up Google OAuth

### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown and select **New Project**
3. Enter a project name and click **Create**

### Enable Google+ API

1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click it and press **Enable**

### Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** as user type
   - Fill in app name, user support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed
   - Review and create
4. Back on credentials page, click **+ Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://yourdomain.vercel.app` (production)
7. Click **Create**
8. Copy your **Client ID** and **Client Secret**

### Connect Google to Clerk

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **Integrations** > **Google**
4. Paste your Client ID and Client Secret
5. Click **Connect**

### Enable Google in Sign-In UI

1. In Clerk Dashboard, go to **User & Authentication** > **Social Connections**
2. Toggle **Google** to **ON**

## Step 9: Create a Home Page

Update `app/page.tsx`:

```typescript
import { SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-6">
          Welcome to My App
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Secure authentication powered by Clerk
        </p>

        <SignedOut>
          <p className="text-gray-400 mb-8">
            Sign in or sign up to get started
          </p>
        </SignedOut>

        <SignedIn>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                Go to Dashboard
              </button>
            </Link>
            <Link href="/profile">
              <button className="px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition">
                View Profile
              </button>
            </Link>
          </div>
        </SignedIn>
      </div>
    </main>
  )
}
```

## Step 10: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and test:

1. Click "Sign Up" or "Sign In" in the header
2. Sign up with email or Google
3. Verify redirect to dashboard
4. View profile page and user data
5. Test the API route: `GET /api/protected`
6. Sign out and verify

## Step 11: Deploy to Vercel

### Option A: Using Vercel Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com/integrations/clerk](https://vercel.com/integrations/clerk)
3. Click **Add Integration** and select your Vercel project
4. The integration will automatically deploy and configure everything

### Option B: Manual Deployment

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New** > **Project**
4. Select your repository
5. Click **Deploy** (it will ask for environment variables during setup)

### Adding Environment Variables to Vercel Dashboard

After deployment, you need to add all your environment variables:

1. Go to [vercel.com](https://vercel.com) and select your project
2. Click **Settings** in the top navigation
3. Click **Environment Variables** in the left sidebar
4. Add each variable by clicking **Add New**:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = your_publishable_key
CLERK_SECRET_KEY = your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /login
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
```

5. For each variable:
   - Enter the **Name** (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - Enter the **Value** from your `.env.local`
   - Select which environments to apply to: **Production**, **Preview**, **Development**
   - Click **Add**

6. After adding all variables, go to **Deployments**
7. Click the three dots on your latest deployment
8. Click **Redeploy** to apply the environment variables

**Important:** Variables starting with `NEXT_PUBLIC_` are public and safe to expose. Variables like `CLERK_SECRET_KEY` are secret and should never be committed to version control.

### Update Google OAuth

After deployment, update your Google OAuth redirect URIs:

1. Go to Google Cloud Console
2. Go to **APIs & Services** > **Credentials**
3. Click your OAuth app
4. Add authorized redirect URI:
   - `https://yourdomain.vercel.app`

### Update Clerk Allowed Domains

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **Domains**
4. Add your Vercel deployment URL

## Monitoring and Debugging

### Check Vercel Logs

1. Go to your Vercel project
2. Click **Deployments**
3. Select a deployment and click **View Function Logs**
4. Monitor authentication requests

### Clerk Dashboard Analytics

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **Insights** to see:
   - Total sign-ups
   - Sign-in frequency
   - Active users
   - Sign-up sources

## Troubleshooting

### "Redirect URI mismatch" error

- Ensure redirect URIs in Google Cloud match your app URLs (with and without `www.`)
- Add both `http://localhost:3000` and `https://yourdomain.vercel.app`

### Environment variables not working

- Verify variables are set in Vercel dashboard
- Redeploy after adding environment variables
- Check that variable names start with `NEXT_PUBLIC_` if used client-side

### Middleware errors

- Ensure `middleware.ts` is in project root (not in `app` folder)
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run dev`

### Protected routes not redirecting

- Use `await auth()` to get user data
- Manually redirect if `userId` is null
- Don't use `auth.protect()` in React Server Components without proper error handling

## Additional Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/nextjs/overview)
- [Clerk Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Vercel Clerk Integration](https://vercel.com/integrations/clerk)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Documentation](https://nextjs.org/docs)

Your authentication system is now production-ready! 🚀