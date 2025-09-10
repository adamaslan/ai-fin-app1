"use client"

import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <h1 className="text-5xl font-bold mb-6">Stock Dashboard</h1>
      <p className="text-lg text-gray-300 mb-8">
        Real-time technical analysis with AI-powered option strategies
      </p>

      {/* Links */}
      <div className="flex gap-4">
        <Link href="/login">
          <button className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
            Login with Google
          </button>
        </Link>
        <Link href="/me">
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            View Session
          </button>
        </Link>
      </div>
    </div>
  )
}
