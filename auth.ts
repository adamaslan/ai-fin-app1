import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google], // automatically reads AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET
})
