import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/app/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET, // ✅ Required in production
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database", // ✅ Fine, since you’re using Prisma
  },
  callbacks: {
    async redirect({ baseUrl }) {
      // ✅ This is fine — ensures successful logins land on /Dashboard
      return `${baseUrl}/Dashboard`
    },
  },
})
