# Authentication Pipeline Summary

This document outlines the authentication pipeline implemented using NextAuth.js, integrating with Google as an OAuth provider and Prisma for database adapter in a Node.js environment, while also providing an Edge-compatible authentication setup.

## 1. Core Authentication Configuration

### <mcfile name="auth-node.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth-node.ts"></mcfile>
This file configures NextAuth.js for a Node.js environment. It sets up the primary authentication handlers, sign-in, sign-out, and authentication functions.

-   **Adapter**: Uses <mcsymbol name="PrismaAdapter" filename="auth-node.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth-node.ts" startline="3" type="class"></mcsymbol> with the `prisma` client for database integration, allowing user and session data to be stored in the database.
-   **Providers**: Configured to use Google OAuth with `clientId` and `clientSecret` sourced from environment variables.
-   **Session Strategy**: Set to `"database"`, meaning session information will be stored and managed in the database.
-   **Callbacks**: Includes a `redirect` callback that directs authenticated users to the `/Dashboard` page after successful login.

```typescript:auth-node.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/app/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async redirect({ baseUrl }) {
      return `${baseUrl}/Dashboard`
    }
  }
})
```

### <mcfile name="auth-edge.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth-edge.ts"></mcfile>
This file provides an Edge-compatible authentication setup, primarily for use in middleware.

-   **Session Strategy**: Uses `"jwt"` (JSON Web Token) for session management, which is suitable for Edge environments as it doesn't require database lookups for every request.
-   **Providers**: Also configured with the Google OAuth provider, similar to `auth-node.ts`.
-   **Export**: Exports an `authEdge` function, which is the authentication handler for the Edge runtime.

```typescript:auth-edge.ts
// auth-edge.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const authEdge = NextAuth({
  session: { strategy: "jwt" }, 
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
}).auth;
```

### <mcfile name="auth.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth.ts"></mcfile>
This file acts as a central export point, re-exporting the authentication functionalities from both `auth-node.ts` and `auth-edge.ts`. This allows other parts of the application to import authentication-related functions from a single location without needing to know the underlying runtime specifics.

```typescript:auth.ts
export * from "./auth-node";
export * from "./auth-edge";
```

## 2. API Routes and Middleware

### <mcfile name="app/api/auth/[...nextauth]/route.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/app/api/auth/[...nextauth]/route.ts"></mcfile>
This file defines the API routes for NextAuth.js. It specifically uses the `handlers` exported from `auth-node.ts` to manage authentication requests.

-   **Runtime**: Explicitly sets `runtime = "nodejs"` and `dynamic = "force-dynamic"`, indicating that these API routes will run in a Node.js environment.
-   **Handlers**: Exports `GET` and `POST` methods from the `handlers` object provided by `auth-node.ts`, which handle all authentication-related API calls (e.g., sign-in, sign-out, callback URLs).

```typescript:app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { handlers } from "@/auth-node";

export const { GET, POST } = handlers;
```

### <mcfile name="middleware.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/middleware.ts"></mcfile>
This file implements middleware for route protection using the Edge-compatible authentication.

-   **Authentication**: Imports and uses `authEdge` from <mcfile name="auth-edge.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth-edge.ts"></mcfile> to protect routes.
-   **Matcher**: The `config` object specifies a `matcher` array, which defines the paths that this middleware will apply to. In this case, it protects all routes under `/dashboard` and `/api/private`.

```typescript:middleware.ts
import { authEdge } from "@/auth-edge";

export default authEdge;

export const config = {
  matcher: ["/dashboard/:path*", "/api/private/:path*"], // adjust paths as needed
};
```

## 3. Pipeline Summary

The authentication pipeline works as follows:

1.  **User Initiates Login**: When a user attempts to log in (e.g., via a "Sign in with Google" button), the request is routed to the NextAuth API routes defined in <mcfile name="app/api/auth/[...nextauth]/route.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/app/api/auth/[...nextauth]/route.ts"></mcfile>.
2.  **Node.js Authentication**: These API routes utilize the Node.js specific NextAuth configuration from <mcfile name="auth-node.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth-node.ts"></mcfile>. This handles the OAuth flow with Google, authenticates the user, and stores session information in the database via Prisma.
3.  **Redirection**: Upon successful authentication, the user is redirected to the `/Dashboard` page as configured in the `redirect` callback in <mcfile name="auth-node.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth-node.ts"></mcfile>.
4.  **Route Protection (Middleware)**: For subsequent requests to protected routes (e.g., `/dashboard` or `/api/private`), the <mcfile name="middleware.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/middleware.ts"></mcfile> intercepts the request.
5.  **Edge Authentication**: The middleware uses the `authEdge` function from <mcfile name="auth-edge.ts" path="/Users/adamaslan/code/ai-fin-opt2/alpha-fullstack/ai-fin-app1/auth-edge.ts"></mcfile>, which leverages JWTs for efficient session validation in the Edge runtime without needing to access the database.
6.  **Access Control**: If the user is authenticated, the request proceeds to the intended route; otherwise, the middleware can redirect the user to a login page or deny access.

This setup provides a robust authentication system that leverages both Node.js for full NextAuth features (like database sessions) and Edge runtime for efficient middleware-based route protection.