'use client'

import { useEffect, useState } from 'react'
import { episodesAPI, projectsAPI, scenesAPI } from '@/lib/api'
import { Plus, Trash2, Play, Download } from 'lucide-react'

interface Episode {
  id: string
  name: string
  description: string | null
  scene_order: string[]
  status: string
  output_url: string | null
  duration: number
}

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [scenes, setScenes] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newEp, setNewEp] = useState({ name: '', description: '', scene_order: [] as string[] })

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (selectedProject) { fetchEpisodes(); fetchScenes() } }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.list()
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(res.data[0].id)
    } catch (e) { console.error(e) }
  }

  const fetchEpisodes = async () => {
    setLoading(true)
    try {
      const res = await episodesAPI.list(selectedProject)
      setEpisodes(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchScenes = async () => {
    try {
      const res = await scenesAPI.list(selectedProject)
      setScenes(res.data.filter((s: any) => s.status === 'completed'))
    } catch (e) { console.error(e) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await episodesAPI.create({ ...newEp, project_id: selectedProject })
      setShowModal(false)
      setNewEp({ name: '', description: '', scene_order: [] })
      fetchEpisodes()
    } catch (e) { console.error(e) }
  }

  const handleExport = async (episodeId: string) => {
    try {
      await episodesAPI.createExportJob(episodeId, { format: 'mp4', resolution: '1080p', aspect_ratio: '16:9' })
      fetchEpisodes()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this episode?')) return
    try {
      await episodesAPI.delete(id)
      fetchEpisodes()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Episodes</h1>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="border rounded px-3 py-2">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Episodes</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded">
            <Plus className="h-4 w-4 mr-2" /> New Episode
          </button>
        </div>

        {loading ? <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /> :
         episodes.length === 0 ? <p className="text-gray-500">No episodes yet.</p> :
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {episodes.map(ep => (
             <div key={ep.id} className="border rounded-lg p-4">
               <h3 className="font-medium">{ep.name}</h3>
               <p className="text-sm text-gray-500">{ep.scene_order?.length || 0} scenes • {ep.status}</p>
               <div className="flex gap-2 mt-3">
                 {ep.status === 'draft' && <button onClick={() => handleExport(ep.id)} className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm"><Play className="h-3 w-3 mr-1" /> Export</button>}
                 {ep.output_url && <a href={ep.output_url} className="flex items-center px-3 py-1 border rounded text-sm"><Download className="h-3 w-3 mr-1" /> Download</a>}
                 <button onClick={() => handleDelete(ep.id)} className="text-red-600 text-sm flex items-center"><Trash2 className="h-4 w-4" /></button>
               </div>
             </div>
           ))}
         </div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Episode</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium">Name</label>
                <input type="text" required value={newEp.name} onChange={(e) => setNewEp({...newEp, name: e.target.value})}
                  className="w-full border rounded px-3 py-2 mt-1" /></div>
                <div><label className="block text-sm font-medium">Description</label>
                <textarea value={newEp.description} onChange={(e) => setNewEp({...newEp, description: e.target.value})}
                  className="w-full border rounded px-3 py-2 mt-1" /></div>
                <div><label className="block text-sm font-medium">Scenes</label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {scenes.map(s => (
                    <label key={s.id} className="flex items-center">
                      <input type="checkbox" checked={newEp.scene_order.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewEp({...newEp, scene_order: [...newEp.scene_order, s.id]})
                          else setNewEp({...newEp, scene_order: newEp.scene_order.filter((id: string) => id !== s.id)})
                        }} className="mr-2" />
                      {s.name} ({s.duration}s)
                    </label>
                  ))}
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
