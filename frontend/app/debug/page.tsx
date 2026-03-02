'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    setInfo({
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      href: window.location.href,
      userAgent: navigator.userAgent,
    })
  }, [])

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1>🐛 Debug Info</h1>
      <pre style={{ background: '#111', padding: 20, borderRadius: 8 }}>
        {JSON.stringify(info, null, 2)}
      </pre>
      <h2>Test API:</h2>
      <button onClick={async () => {
        try {
          const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/auth/me')
          alert('Response: ' + res.status)
        } catch (e: any) {
          alert('Error: ' + e.message)
        }
      }}>Test Connection</button>
    </div>
  )
}
