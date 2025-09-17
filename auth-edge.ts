// auth-edge.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const authEdge = NextAuth({
  session: { strategy: "jwt" }, 
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
}).auth;
