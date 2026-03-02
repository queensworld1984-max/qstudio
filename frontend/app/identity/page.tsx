'use client'

import { useEffect, useState } from 'react'
import { identityAPI, projectsAPI } from '@/lib/api'
import { Plus, Trash2, Lock, Unlock } from 'lucide-react'

interface Character {
  id: string
  name: string
  project_id: string
  master_portrait_url: string | null
  identity_locked: boolean
  similarity_threshold: number
}

export default function IdentityPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newChar, setNewChar] = useState({ name: '', identity_locked: true, similarity_threshold: 80 })

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (selectedProject) fetchCharacters() }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.list()
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(res.data[0].id)
    } catch (e) { console.error(e) }
  }

  const fetchCharacters = async () => {
    setLoading(true)
    try {
      const res = await identityAPI.listCharacters(selectedProject)
      setCharacters(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await identityAPI.createCharacter({ ...newChar, project_id: selectedProject })
      setShowModal(false)
      setNewChar({ name: '', identity_locked: true, similarity_threshold: 80 })
      fetchCharacters()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this character?')) return
    try {
      await identityAPI.deleteCharacter(id)
      fetchCharacters()
    } catch (e) { console.error(e) }
  }

  const toggleLock = async (char: Character) => {
    try {
      await identityAPI.updateCharacter(char.id, { identity_locked: !char.identity_locked })
      fetchCharacters()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Identity Engine</h1>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="border rounded px-3 py-2">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Characters</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded">
            <Plus className="h-4 w-4 mr-2" /> New Character
          </button>
        </div>

        {loading ? <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /> :
         characters.length === 0 ? <p className="text-gray-500">No characters yet.</p> :
         <div className="grid gap-4 md:grid-cols-3">
           {characters.map(char => (
             <div key={char.id} className="border rounded-lg p-4">
               <div className="flex items-start justify-between">
                 <div><h3 className="font-medium">{char.name}</h3>
                 <p className="text-sm text-gray-500">Threshold: {char.similarity_threshold}%</p></div>
                 <button onClick={() => toggleLock(char)} className={`p-2 rounded ${char.identity_locked ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
                   {char.identity_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                 </button>
               </div>
               {char.master_portrait_url && <img src={char.master_portrait_url} alt={char.name} className="mt-3 w-full h-32 object-cover rounded" />}
               <button onClick={() => handleDelete(char.id)} className="mt-3 text-red-600 text-sm flex items-center"><Trash2 className="h-4 w-4 mr-1" /> Delete</button>
             </div>
           ))}
         </div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Character</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium">Name</label>
                <input type="text" required value={newChar.name} onChange={(e) => setNewChar({...newChar, name: e.target.value})}
                  className="w-full border rounded px-3 py-2 mt-1" /></div>
                <div className="flex items-center"><input type="checkbox" checked={newChar.identity_locked}
                  onChange={(e) => setNewChar({...newChar, identity_locked: e.target.checked})} className="mr-2" />
                <label className="text-sm">Identity Lock</label></div>
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
