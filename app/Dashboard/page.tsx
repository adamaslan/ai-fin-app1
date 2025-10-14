import { auth } from '@clerk/nextjs/server'
// import Nav from '../components/Navbar/page'
import SpreadSuggestionsServer from '../(components)/Spread1'
import Link from 'next/link'

export default async function DashboardPage() {
  // Protect this route - redirects to sign-in if not authenticated
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  return (
    <>
      {/* <Nav /> */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Stock Newest Dashboard Oct 14th
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