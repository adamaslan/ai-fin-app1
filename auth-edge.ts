import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const authEdge = NextAuth({
  secret: process.env.AUTH_SECRET, // ✅ Keep consistent with Node runtime
  session: { strategy: "jwt" }, // ✅ JWT for Edge performance
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
}).auth
