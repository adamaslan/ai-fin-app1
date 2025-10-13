# Clerk + Next.js: Building a Robust Auth System with GitHub, Email, Database & Vercel Integrations

This guide shows you how to build a production-ready authentication system with Google OAuth, GitHub OAuth, email/password authentication, persistent database storage, secure cookie management, and Vercel Analytics integration for maximum value.

## Overview

By the end of this guide, your app will have:
1. **Google OAuth** (already configured from previous guide)
2. **GitHub OAuth** - for developer authentication
3. **Email/Password** - traditional authentication method
4. **PostgreSQL Database** - persistent user data storage
5. **Secure Cookies** - session management
6. **Vercel Analytics** - track user behavior and app performance

## Prerequisites

- Existing Clerk + Google OAuth setup
- Vercel project deployed
- GitHub account
- Supabase or PostgreSQL database (we'll use Supabase as it's easiest)
- Basic understanding of Next.js

---

## Part 1: Set Up GitHub OAuth

### Create GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in:
   - **Application name:** My Next.js App
   - **Homepage URL:** `https://yourproject.vercel.app`
   - **Authorization callback URL:** `https://yourproject.vercel.app/auth/callback/github`
4. Click **Register application**
5. Copy your **Client ID**
6. Click **Generate a new client secret** and copy it

### Connect GitHub to Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Integrations** or **Social Connections**
4. Click **GitHub**
5. Paste your Client ID and Client Secret
6. Click **Connect**
7. Go to **User & Authentication** > **Social Connections**
8. Toggle **GitHub** to **ON**

---

## Part 2: Enable Email/Password Authentication

### Configure Email Provider in Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **User & Authentication** > **Email, Phone & Username**
4. Toggle **Email address** to **ON**
5. For **Verification**, select **Optional** or **Required** based on your needs
6. Go to **User & Authentication** > **Password**
7. Toggle **Password** to **ON**
8. Under **Authentication strategies**, ensure **Email address** is selected

### Configure Email Delivery

1. In Clerk Dashboard, go to **Email** section
2. Choose between **Clerk's default email** (recommended for development) or **Custom SMTP**
3. If using custom SMTP, enter your email provider details (SendGrid, Mailgun, etc.)

---

## Part 3: Set Up PostgreSQL Database (Supabase)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New project**
3. Fill in:
   - **Project name:** my-nextjs-app
   - **Password:** Create a strong password (save this)
   - **Region:** Choose closest to your users
4. Click **Create new project** (wait 2-3 minutes)

### Create Users Table

Once your project is created, go to the **SQL Editor** and run this query:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_image TEXT,
  auth_provider TEXT, -- 'google', 'github', 'email'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create sessions table for cookie management
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create user activity log
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'sign_in', 'sign_up', 'sign_out'
  provider TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
```

### Get Database Credentials

1. In Supabase, go to **Project Settings** > **Database**
2. Copy your **Connection String** (postgres://)
3. Also copy your **Project URL** and **Anon Key** from **Settings** > **API**

---

## Part 4: Update Next.js Project with Database Integration

### Install Dependencies

```bash
npm install @supabase/supabase-js js-cookie next-auth
```

### Create Environment Variables

Update your `.env.local`:

```env
# Clerk (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production in Vercel, update these in **Settings > Environment Variables**.

### Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Create Database Service

Create `lib/db.ts`:

```typescript
import { supabaseAdmin } from "./supabase";
import { currentUser } from "@clerk/nextjs";

interface UserData {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  authProvider: "google" | "github" | "email";
}

interface ActivityData {
  userId: string;
  action: "sign_in" | "sign_up" | "sign_out";
  provider: string;
  ipAddress?: string;
  userAgent?: string;
}

// Create or update user in database
export async function upsertUser(userData: UserData) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        clerk_id: userData.clerkId,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        profile_image: userData.profileImage,
        auth_provider: userData.authProvider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user:", error);
    throw error;
  }

  return data;
}

// Get user from database
export async function getUser(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user:", error);
  }

  return data;
}

// Log user activity
export async function logActivity(activityData: ActivityData) {
  const { error } = await supabaseAdmin.from("activity_logs").insert({
    user_id: activityData.userId,
    action: activityData.action,
    provider: activityData.provider,
    ip_address: activityData.ipAddress,
    user_agent: activityData.userAgent,
  });

  if (error) {
    console.error("Error logging activity:", error);
  }
}

// Create session
export async function createSession(userId: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000) {
  const sessionToken = require("crypto").randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresIn);

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    throw error;
  }

  return data;
}

// Get user activity
export async function getUserActivity(clerkId: string, limit: number = 10) {
  const user = await getUser(clerkId);
  if (!user) return [];

  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching activity:", error);
    return [];
  }

  return data;
}
```

### Create API Routes for Webhooks

Create `app/api/auth/user-sync/route.ts`:

```typescript
import { Webhook } from "svix";
import { headers } from "next/headers";
import { upsertUser, logActivity, getUser } from "@/lib/db";

export async function POST(req: Request) {
  const payload = await req.json();
  const { type, data } = payload;

  try {
    if (type === "user.created" || type === "user.updated") {
      const clerkId = data.id;
      const email = data.email_addresses[0]?.email_address;
      const firstName = data.first_name;
      const lastName = data.last_name;
      const profileImage = data.image_url;

      // Determine auth provider
      let authProvider = "email";
      if (data.external_accounts && data.external_accounts.length > 0) {
        const provider = data.external_accounts[0].provider;
        authProvider = provider === "oauth_google" ? "google" : provider === "oauth_github" ? "github" : "email";
      }

      // Upsert user to database
      const user = await upsertUser({
        clerkId,
        email,
        firstName,
        lastName,
        profileImage,
        authProvider: authProvider as "google" | "github" | "email",
      });

      // Log activity for new users
      if (type === "user.created") {
        await logActivity({
          userId: user.id,
          action: "sign_up",
          provider: authProvider,
        });
      }
    }

    if (type === "user.deleted") {
      // Handle user deletion if needed
      console.log("User deleted:", data.id);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: "Webhook failed" }, { status: 400 });
  }
}
```

### Set Up Clerk Webhooks

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Webhooks**
4. Click **Add Endpoint**
5. Enter endpoint URL: `https://yourproject.vercel.app/api/auth/user-sync`
6. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
7. Click **Create**
8. Copy the **Signing Secret** and add to `.env.local`:

```env
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

---

## Part 5: Implement Secure Cookies

Create `lib/cookies.ts`:

```typescript
import { cookies } from "next/headers";

const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export async function setSessionCookie(sessionToken: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-session", sessionToken, COOKIE_CONFIG);
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("auth-session")?.value;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-session");
}

export async function setUserPreferences(preferences: Record<string, any>) {
  const cookieStore = await cookies();
  cookieStore.set(
    "user-preferences",
    JSON.stringify(preferences),
    COOKIE_CONFIG
  );
}

export async function getUserPreferences() {
  const cookieStore = await cookies();
  const prefs = cookieStore.get("user-preferences")?.value;
  return prefs ? JSON.parse(prefs) : null;
}
```

### Update Middleware for Cookie Management

Update `middleware.ts`:

```typescript
import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default authMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();

  // Set user ID in response header for tracking
  if (userId) {
    const response = NextResponse.next();
    response.headers.set("x-user-id", userId);
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

---

## Part 6: Add Vercel Analytics Integration

### Install Analytics Package

```bash
npm install @vercel/analytics @vercel/web-vitals
```

### Update Root Layout

Update `app/layout.tsx`:

```typescript
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "Robust authentication with Clerk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### Track Custom Events

Create `lib/analytics.ts`:

```typescript
import { track } from "@vercel/analytics";

export function trackSignIn(provider: string) {
  track("sign_in", {
    provider,
    timestamp: new Date().toISOString(),
  });
}

export function trackSignUp(provider: string) {
  track("sign_up", {
    provider,
    timestamp: new Date().toISOString(),
  });
}

export function trackSignOut() {
  track("sign_out", {
    timestamp: new Date().toISOString(),
  });
}

export function trackPageView(pageName: string) {
  track("page_view", {
    page: pageName,
  });
}

export function trackUserAction(action: string, metadata?: Record<string, any>) {
  track(action, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}
```

### Add Analytics to Sign-In Page

Update `app/sign-in/[[...index]]/page.tsx`:

```typescript
"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export default function SignInPage() {
  useEffect(() => {
    trackPageView("sign_in");
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">
            Sign in with Google, GitHub, or Email
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
```

---

## Part 7: Create Dashboard with User Data

Create `app/dashboard/page.tsx`:

```typescript
import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getUser, getUserActivity } from "@/lib/db";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();
  const dbUser = await getUser(userId);
  const activity = await getUserActivity(userId, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome, {clerkUser?.firstName || "User"}!
              </h1>
              <p className="text-gray-600">
                Email: {clerkUser?.emailAddresses[0]?.emailAddress}
              </p>
              {dbUser && (
                <p className="text-gray-600 mt-1">
                  Signed in with:{" "}
                  <span className="font-semibold capitalize">
                    {dbUser.auth_provider}
                  </span>
                </p>
              )}
            </div>
            {clerkUser?.profileImageUrl && (
              <img
                src={clerkUser.profileImageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
            )}
          </div>
        </div>

        {/* Account Info */}
        {dbUser && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Account Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Account Created</p>
                <p className="font-semibold">
                  {new Date(dbUser.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Last Updated</p>
                <p className="font-semibold">
                  {new Date(dbUser.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log */}
        {activity.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activity.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0"
                >
                  <div>
                    <p className="font-medium capitalize">{log.action}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  {log.provider && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
                      {log.provider}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Part 8: Update Vercel Environment Variables

1. Go to your Vercel project
2. Click **Settings** > **Environment Variables**
3. Add all the variables from your `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL` (set to your production domain)

4. Click **Save**
5. Go to **Deployments** and click **Redeploy** on the latest deployment

---

## Part 9: Testing Everything

### Local Testing

```bash
npm run dev
```

Test the following flows:
1. Sign up with email/password
2. Sign in with GitHub
3. Sign in with Google
4. Check database in Supabase to see user records
5. View dashboard and activity logs
6. Check cookies in browser DevTools

### Vercel Deployment

1. Push changes to GitHub
2. Vercel auto-deploys
3. Test all sign-in methods on production
4. Check Vercel Analytics dashboard for user tracking

---

## Database Queries for Analytics

You can run these queries in Supabase to get insights:

```sql
-- Total users by provider
SELECT auth_provider, COUNT(*) as count
FROM users
GROUP BY auth_provider;

-- Recent sign-ups (last 7 days)
SELECT COUNT(*) as new_users
FROM users
WHERE created_at > NOW() - INTERVAL '7 days';

-- Most active users
SELECT u.id, u.email, COUNT(al.id) as activity_count
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id
GROUP BY u.id
ORDER BY activity_count DESC
LIMIT 10;

-- Sign-in frequency
SELECT DATE(created_at) as date, COUNT(*) as count
FROM activity_logs
WHERE action = 'sign_in'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

---

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] GitHub OAuth credentials updated for production domain
- [ ] Clerk webhooks configured for production
- [ ] Database backups enabled in Supabase
- [ ] SSL certificate configured
- [ ] Rate limiting enabled
- [ ] Custom email template configured (if using Clerk email)
- [ ] Analytics dashboard monitored
- [ ] Monitoring alerts set up

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables only
2. **Rotate credentials regularly** - Update OAuth secrets every 3 months
3. **Enable 2FA** - On all provider accounts
4. **Monitor database** - Set up Supabase alerts for unusual activity
5. **Use HTTPS** - Always use secure protocols
6. **Validate input** - Sanitize all user inputs
7. **Rate limit** - Implement rate limiting on auth endpoints
8. **Log access** - Keep detailed activity logs

---

## Troubleshooting

### "No database connection"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase project is running
- Verify network connectivity to Supabase

### "Webhook not firing"
- Check webhook URL is correct in Clerk Dashboard
- Verify `CLERK_WEBHOOK_SECRET` matches
- Check Vercel function logs

### "User not appearing in database"
- Ensure webhook is configured correctly
- Check user was created after webhook was set up
- Verify Supabase API key has write permissions

### "Cookies not persisting"
- Check `secure: true` only for production
- Verify cookies aren't being blocked by browser
- Check cookie domain matches your app domain

---

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Next.js Documentation](https://nextjs.org/docs)

Your authentication system is now production-ready with robust user management, database persistence, and analytics! 🚀