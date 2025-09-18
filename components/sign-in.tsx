"use client"

import { signIn } from "next-auth/react"

export default function SignIn() {
  return (
    <button
      onClick={() => signIn("google")}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Sign in with Google
    </button>
  )
}
