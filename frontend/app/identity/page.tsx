'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Lock, Unlock, User, Upload } from 'lucide-react'

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
  const [projects] = useState([{ id: '1', name: 'My First Film' }])
  const [selectedProject, setSelectedProject] = useState('1')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newChar, setNewChar] = useState({ name: '', identity_locked: true, similarity_threshold: 80 })

  // Demo mode - show sample characters
  useEffect(() => {
    setCharacters([
      { id: '1', name: 'Main Character', project_id: '1', master_portrait_url: null, identity_locked: true, similarity_threshold: 80 },
      { id: '2', name: 'Supporting Role', project_id: '1', master_portrait_url: null, identity_locked: false, similarity_threshold: 75 },
    ])
  }, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const char: Character = {
      id: Date.now().toString(),
      name: newChar.name,
      project_id: selectedProject,
      master_portrait_url: null,
      identity_locked: newChar.identity_locked,
      similarity_threshold: newChar.similarity_threshold
    }
    setCharacters([...characters, char])
    setShowModal(false)
    setNewChar({ name: '', identity_locked: true, similarity_threshold: 80 })
  }

  const toggleLock = (id: string) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, identity_locked: !c.identity_locked } : c))
  }

  const deleteChar = (id: string) => {
    if (confirm('Delete this character?')) {
      setCharacters(characters.filter(c => c.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Identity Engine</h1>
        <select 
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Characters</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg">
            <Plus className="h-4 w-4" /> New Character
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : characters.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No characters yet. Create one to get started.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {characters.map(char => (
              <div key={char.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">{char.name}</h3>
                      <p className="text-sm text-gray-500">Threshold: {char.similarity_threshold}%</p>
                    </div>
                  </div>
                  <button onClick={() => toggleLock(char.id)} className={`p-2 rounded ${char.identity_locked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {char.identity_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
                    <Upload className="h-3 w-3" /> Upload Faces
                  </button>
                  <button onClick={() => deleteChar(char.id)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Character</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input type="text" required value={newChar.name} onChange={(e) => setNewChar({...newChar, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Identity Lock</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={newChar.identity_locked} onChange={(e) => setNewChar({...newChar, identity_locked: e.target.checked})} />
                    <span className="text-sm text-gray-600">Lock identity for consistency</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Similarity Threshold: {newChar.similarity_threshold}%</label>
                  <input type="range" min="50" max="100" value={newChar.similarity_threshold} onChange={(e) => setNewChar({...newChar, similarity_threshold: parseInt(e.target.value)})} className="w-full mt-2" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
