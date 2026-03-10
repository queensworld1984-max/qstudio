'use client'

import Link from 'next/link'
import { Film, Play, Star, Zap, Shield, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Film className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold text-white">Q Studio</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            AI-Powered Film
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Production</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Create professional films with AI. From script to screen — identity-locked characters, 
            cinematic scenes, and seamless editing.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:opacity-90 transition"
            >
              <Play className="h-5 w-5" />
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            { icon: Users, title: 'Identity Engine', desc: 'Face-referenced characters with locked identity consistency' },
            { icon: Film, title: 'Scene Builder', desc: 'AI-generated scenes with cinematic templates' },
            { icon: Zap, title: 'Smart Rendering', desc: 'Background processing with real-time progress' },
          ].map((feature, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <feature.icon className="h-10 w-10 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
