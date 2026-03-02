'use client'

import { useEffect, useState } from 'react'

export default function TestAPIPage() {
  const [result, setResult] = useState<string>('')

  const testApi = async () => {
    setResult('Testing...')
    try {
      const res = await fetch('http://72.62.165.54:8000/')
      const data = await res.text()
      setResult('SUCCESS: ' + data)
    } catch (e: any) {
      setResult('ERROR: ' + e.message)
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1>API Test</h1>
      <p>API_URL env: {process.env.NEXT_PUBLIC_API_URL}</p>
      <button onClick={testApi} style={{ padding: 10, margin: 10, cursor: 'pointer' }}>
        Test API Call
      </button>
      <p>{result}</p>
    </div>
  )
}
