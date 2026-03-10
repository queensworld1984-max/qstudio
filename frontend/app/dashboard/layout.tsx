'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Film, Menu, X, LogOut, User, Folder, Users, Film as FilmIcon, Clapperboard, Monitor, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard/projects', label: 'Projects', icon: Folder },
  { href: '/dashboard/identity', label: 'Identity', icon: Users },
  { href: '/dashboard/scenes', label: 'Scenes', icon: FilmIcon },
  { href: '/dashboard/episodes', label: 'Episodes', icon: Clapperboard },
  { href: '/dashboard/render', label: 'Render', icon: Monitor },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Get user info from token decode (simple version)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ name: payload.sub || 'User', email: payload.email || '' })
    } catch {
      setUser({ name: 'User', email: '' })
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-6 w-6 text-purple-500" />
          <span className="font-bold">Q Studio</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
          <div className="p-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Film className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold">Q Studio</span>
            </Link>
          </div>

          <nav className="px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            {user && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="p-1 hover:text-red-400">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen lg:p-8 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
