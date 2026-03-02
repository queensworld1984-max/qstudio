'use client'

import Link from 'next/link'
import { 
  Film, 
  Users, 
  Wand2, 
  Video, 
  Sparkles, 
  Shield, 
  Zap, 
  Layers,
  Play,
  ChevronRight,
  CheckCircle
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Q Studio
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#capabilities" className="text-gray-300 hover:text-white transition">Capabilities</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Enter Studio
              </Link>
              <Link 
                href="/dashboard" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-lg font-medium transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">AI-Powered Film Production</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Create Hollywood-Quality{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                AI Films
              </span>{' '}
              in Your Browser
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              The world's most advanced AI film production operating system. 
              From script to screen — pre-production, production, and post-production 
              all in one powerful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition flex items-center justify-center gap-2"
              >
                Start Creating Free
                <ChevronRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
            
            <p className="mt-6 text-gray-500 text-sm">
              No credit card required • Start with free credits
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'AI Models', value: '50+' },
              { label: 'Scenes Created', value: '1M+' },
              { label: 'Film Minutes', value: '500K+' },
              { label: 'Users', value: '100K+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Complete Film Production Suite
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create professional AI films — from concept to final render
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Film,
                title: 'Script & Storyboard',
                description: 'Write scripts with AI assistance, auto-generate storyboards, and plan your shots with intelligent scene parsing.',
                color: 'from-purple-600 to-purple-800'
              },
              {
                icon: Users,
                title: 'Identity Engine',
                description: 'Create consistent AI characters with face references. Lock identity, manage versions, and ensure continuity across scenes.',
                color: 'from-pink-600 to-pink-800'
              },
              {
                icon: Wand2,
                title: 'Scene Generation',
                description: 'Generate stunning scenes with multi-character support, cinematography controls, and AI-powered visuals.',
                color: 'from-red-600 to-red-800'
              },
              {
                icon: Video,
                title: 'Render Queue',
                description: 'Process renders with intelligent queue management, real-time progress tracking, and batch processing.',
                color: 'from-orange-600 to-orange-800'
              },
              {
                icon: Layers,
                title: 'Episode Builder',
                description: 'Stitch scenes together into episodes, add transitions, and export in multiple formats and aspect ratios.',
                color: 'from-yellow-600 to-yellow-800'
              },
              {
                icon: Zap,
                title: 'Real-time Preview',
                description: 'Preview your scenes instantly, make adjustments on the fly, and see changes in real-time.',
                color: 'from-green-600 to-green-800'
              },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-24 bg-gradient-to-b from-black to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Professional Tools,{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Simplified
                </span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: 'Multi-Character Scenes',
                    description: 'Orchestrate complex scenes with multiple AI characters, each with their own identity, wardrobe, and expressions.'
                  },
                  {
                    title: 'Cinematography Controls',
                    description: 'Full control over lens, depth of field, motion, lighting, and color grading. Import your own LUTs.'
                  },
                  {
                    title: 'Voice & Audio',
                    description: 'Text-to-speech with accent control, voice cloning, lip-sync alignment, and multi-track audio mixing.'
                  },
                  {
                    title: 'Asset Management',
                    description: 'Organize wardrobe, spaces, and assets with powerful tagging, filtering, and version control.'
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30" />
              <div className="relative bg-gray-900 rounded-3xl border border-white/10 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-gray-400 text-sm">Q Studio Editor</span>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-white/5 rounded-lg w-3/4" />
                  <div className="h-8 bg-white/5 rounded-lg w-1/2" />
                  <div className="h-32 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-white/10" />
                  <div className="flex gap-2">
                    <div className="h-20 bg-white/5 rounded-lg flex-1" />
                    <div className="h-20 bg-white/5 rounded-lg flex-1" />
                    <div className="h-20 bg-white/5 rounded-lg flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Loved by Content Creators
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Q Studio transformed our content pipeline. We went from concept to finished episode in days, not weeks.",
                author: "Sarah Chen",
                role: "Content Director, StreamLabs"
              },
              {
                quote: "The identity consistency is incredible. Our characters look exactly the same across 50+ scenes.",
                author: "Marcus Rodriguez",
                role: "Founder, AI Studios"
              },
              {
                quote: "Finally, a platform that handles the entire production workflow. No more jumping between different tools.",
                author: "Emily Watson",
                role: "Executive Producer"
              },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-bold">{testimonial.author}</div>
                  <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-red-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Create Your Masterpiece?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of creators building the future of AI film production.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-6 text-gray-400 text-sm">
            No credit card required • 100+ free credits on signup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Q Studio</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            <div className="text-gray-500 text-sm">
              © 2026 Q Studio. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
