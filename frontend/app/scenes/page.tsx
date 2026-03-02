'use client'

import { useState } from 'react'
import { Plus, Play, Trash2, Film } from 'lucide-react'

export default function ScenesPage() {
  const [scenes, setScenes] = useState([
    { id: '1', name: 'Opening Scene', duration: 30, status: 'draft', characters: 2 },
    { id: '2', name: 'Dialogue Sequence', duration: 45, status: 'rendering', characters: 1 },
  ])

  const handleRender = (id: string) => {
    // Demo: show rendering feedback
    setScenes(scenes.map(s => s.id === id ? { ...s, status: 'rendering' } : s))
    setTimeout(() => {
      setScenes(scenes.map(s => s.id === id ? { ...s, status: 'completed' } : s))
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scene Builder</h1>
        <button 
          onClick={() => {
            setScenes([...scenes, { id: Date.now().toString(), name: `Scene ${scenes.length + 1}`, duration: 30, status: 'draft', characters: 1 }])
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" /> New Scene
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Scenes</h2>
        </div>

        {scenes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No scenes yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenes.map(scene => (
              <div key={scene.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Film className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{scene.name}</h3>
                      <p className="text-sm text-gray-500">{scene.duration}s • {scene.characters} characters</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleRender(scene.id)}
                    disabled={scene.status === 'rendering'}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-all ${
                      scene.status === 'rendering' 
                        ? 'bg-blue-600 text-white animate-pulse' 
                        : scene.status === 'completed'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                    }`}
                  >
                    <Play className={`h-3 w-3 ${scene.status === 'rendering' ? 'animate-spin' : ''}`} /> 
                    {scene.status === 'rendering' ? 'Rendering...' : scene.status === 'completed' ? 'Done' : 'Render'}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-red-600 hover:scale-110 transition-transform">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
