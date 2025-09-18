// auth-node.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/app/lib/prisma";

// Export all helpers so you can use them in API routes and pages
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma), // ✅ NeonDB via Prisma
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "database", // ✅ sessions stored in DB
  },
});
