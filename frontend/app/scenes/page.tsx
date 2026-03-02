'use client'

import { useEffect, useState } from 'react'
import { scenesAPI, projectsAPI, identityAPI } from '@/lib/api'
import { Plus, Trash2, Play, Settings } from 'lucide-react'

interface Scene {
  id: string
  name: string
  description: string | null
  duration: number
  status: string
  characters: any[]
  cinematography: any
  output_url: string | null
  thumbnail_url: string | null
}

export default function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newScene, setNewScene] = useState({ name: '', description: '', duration: 10, characters: [] as any[] })
  const [cinematography, setCinematography] = useState({ lens: '50mm', fov: 50, lighting: 'natural', camera_movement: 'static' })

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (selectedProject) { fetchScenes(); fetchCharacters() } }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.list()
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(res.data[0].id)
    } catch (e) { console.error(e) }
  }

  const fetchScenes = async () => {
    setLoading(true)
    try {
      const res = await scenesAPI.list(selectedProject)
      setScenes(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchCharacters = async () => {
    try {
      const res = await identityAPI.listCharacters(selectedProject)
      setCharacters(res.data)
    } catch (e) { console.error(e) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await scenesAPI.create({ ...newScene, project_id: selectedProject, cinematography })
      setShowModal(false)
      setNewScene({ name: '', description: '', duration: 10, characters: [] })
      fetchScenes()
    } catch (e) { console.error(e) }
  }

  const handleRender = async (sceneId: string) => {
    try {
      await scenesAPI.createRenderJob(sceneId, { provider: 'stub' })
      fetchScenes()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scene?')) return
    try {
      await scenesAPI.delete(id)
      fetchScenes()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scene Builder</h1>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="border rounded px-3 py-2">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Scenes</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded">
            <Plus className="h-4 w-4 mr-2" /> New Scene
          </button>
        </div>

        {loading ? <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /> :
         scenes.length === 0 ? <p className="text-gray-500">No scenes yet.</p> :
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {scenes.map(scene => (
             <div key={scene.id} className="border rounded-lg p-4">
               {scene.thumbnail_url && <img src={scene.thumbnail_url} alt={scene.name} className="w-full h-32 object-cover rounded mb-3" />}
               <div className="flex items-start justify-between">
                 <div><h3 className="font-medium">{scene.name}</h3>
                 <p className="text-sm text-gray-500">{scene.duration}s • {scene.status}</p>
                 <p className="text-sm text-gray-500">{scene.characters?.length || 0} characters</p></div>
               </div>
               <div className="flex gap-2 mt-3">
                 {scene.status === 'draft' && <button onClick={() => handleRender(scene.id)} className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm"><Play className="h-3 w-3 mr-1" /> Render</button>}
                 <button onClick={() => handleDelete(scene.id)} className="text-red-600 text-sm flex items-center"><Trash2 className="h-4 w-4 mr-1" /></button>
               </div>
             </div>
           ))}
         </div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Scene</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium">Name</label>
                <input type="text" required value={newScene.name} onChange={(e) => setNewScene({...newScene, name: e.target.value})}
                  className="w-full border rounded px-3 py-2 mt-1" /></div>
                <div><label className="block text-sm font-medium">Description</label>
                <textarea value={newScene.description} onChange={(e) => setNewScene({...newScene, description: e.target.value})}
                  className="w-full border rounded px-3 py-2 mt-1" /></div>
                <div><label className="block text-sm font-medium">Duration (seconds)</label>
                <input type="number" min="1" value={newScene.duration} onChange={(e) => setNewScene({...newScene, duration: parseInt(e.target.value)})}
                  className="w-full border rounded px-3 py-2 mt-1" /></div>
                <div><label className="block text-sm font-medium">Characters</label>
                <div className="mt-2 space-y-2">
                  {characters.map(c => (
                    <label key={c.id} className="flex items-center">
                      <input type="checkbox" checked={newScene.characters.some((ch: any) => ch.character_id === c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewScene({...newScene, characters: [...newScene.characters, { character_id: c.id, position: { x: 0, y: 0 }, scale: 1.0 }]})
                          else setNewScene({...newScene, characters: newScene.characters.filter((ch: any) => ch.character_id !== c.id)})
                        }} className="mr-2" />
                      {c.name}
                    </label>
                  ))}
                </div></div>
                <div><label className="block text-sm font-medium">Cinematography</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <select value={cinematography.lens} onChange={(e) => setCinematography({...cinematography, lens: e.target.value})} className="border rounded px-2 py-1">
                    <option>35mm</option><option>50mm</option><option>85mm</option><option>135mm</option>
                  </select>
                  <select value={cinematography.lighting} onChange={(e) => setCinematography({...cinematography, lighting: e.target.value})} className="border rounded px-2 py-1">
                    <option>natural</option><option>studio</option><option>cinematic</option><option>low-key</option>
                  </select>
                  <select value={cinematography.camera_movement} onChange={(e) => setCinematography({...cinematography, camera_movement: e.target.value})} className="border rounded px-2 py-1">
                    <option>static</option><option>pan</option><option>tilt</option><option>dolly</option>
                  </select>
                </div></div>
              </div>
              <div className="flex justify-end mt-6 gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
