'use client'

import { useState } from 'react'
import { Monitor, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function RenderPage() {
  const [jobs] = useState([
    { id: '1', scene: 'Opening Scene', status: 'completed', progress: 100, time: '2m ago' },
    { id: '2', scene: 'Dialogue Sequence', status: 'rendering', progress: 67, time: 'In progress' },
    { id: '3', scene: 'Final Scene', status: 'queued', progress: 0, time: 'Waiting' },
  ])

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rendering': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Render Monitor</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Render Queue</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Monitor className="h-4 w-4" />
            2 workers active
          </div>
        </div>

        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h3 className="font-medium">{job.scene}</h3>
                    <p className="text-sm text-gray-500">{job.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    job.status === 'completed' ? 'text-green-600' :
                    job.status === 'rendering' ? 'text-blue-600' :
                    job.status === 'failed' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {job.status === 'rendering' ? `${job.progress}%` : job.status}
                  </span>
                </div>
              </div>
              {job.status === 'rendering' && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${job.progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
