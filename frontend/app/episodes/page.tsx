'use client'

import { useState } from 'react'
import { Plus, Play, Download, Trash2, Film } from 'lucide-react'

export default function EpisodesPage() {
  const [episodes] = useState([
    { id: '1', name: 'Episode 1', scenes: 5, status: 'draft' },
    { id: '2', name: 'Episode 2', scenes: 3, status: 'completed', output_url: '/downloads/ep2.mp4' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Episode Builder</h1>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg">
          <Plus className="h-4 w-4" /> New Episode
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {episodes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No episodes yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {episodes.map(ep => (
              <div key={ep.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Film className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{ep.name}</h3>
                    <p className="text-sm text-gray-500">{ep.scenes} scenes</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {ep.status === 'draft' && (
                    <button className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm">
                      <Play className="h-3 w-3" /> Export
                    </button>
                  )}
                  {ep.status === 'completed' && (
                    <button className="flex items-center gap-1 px-3 py-1 border rounded text-sm">
                      <Download className="h-3 w-3" /> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
