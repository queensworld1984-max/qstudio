'use client'

import { useEffect, useState } from 'react'
import { renderAPI } from '@/lib/api'
import { Monitor, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function RenderPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, queued: 0, processing: 0, completed: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  const fetchJobs = async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        renderAPI.listJobs(),
        renderAPI.getQueueStatus()
      ])
      setJobs(jobsRes.data)
      setStats(statsRes.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [])
  
  useEffect(() => {
    if (stats.processing > 0) {
      const interval = setInterval(fetchJobs, 3000)
      return () => clearInterval(interval)
    }
  }, [stats.processing])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />
      case 'processing': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default: return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Render Queue</h1>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-gray-500">Total</div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="text-2xl font-bold text-yellow-600">{stats.queued}</div><div className="text-sm text-gray-500">Queued</div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="text-2xl font-bold text-blue-600">{stats.processing}</div><div className="text-sm text-gray-500">Processing</div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="text-2xl font-bold text-green-600">{stats.completed}</div><div className="text-sm text-gray-500">Completed</div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="text-2xl font-bold text-red-600">{stats.failed}</div><div className="text-sm text-gray-500">Failed</div></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Render Jobs</h2>
          <button onClick={fetchJobs} className="flex items-center px-3 py-1 border rounded text-sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</button>
        </div>

        {loading ? <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /> :
         jobs.length === 0 ? <p className="text-gray-500">No render jobs yet.</p> :
         <div className="space-y-3">
           {jobs.map(job => (
             <div key={job.id} className="border rounded-lg p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 {getStatusIcon(job.status)}
                 <div>
                   <div className="font-medium">Scene: {job.scene_id.slice(0, 8)}...</div>
                   <div className="text-sm text-gray-500">Provider: {job.provider} • {new Date(job.created_at).toLocaleString()}</div>
                 </div>
               </div>
               <div className="text-right">
                 {job.status === 'processing' && <div className="w-32 bg-gray-200 rounded-full h-2 mb-1"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${job.progress}%` }} /></div>}
                 <div className="text-sm">{job.progress}%</div>
                 {job.output_url && <a href={job.output_url} className="text-blue-600 text-sm">Download</a>}
                 {job.error_message && <div className="text-red-500 text-sm">{job.error_message}</div>}
               </div>
             </div>
           ))}
         </div>}
      </div>
    </div>
  )
}
