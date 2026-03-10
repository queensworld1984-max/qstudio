'use client'

import { useState, useRef } from 'react'
import { Plus, Play, Trash2, Film, Upload, Image, Sparkles, X, Check } from 'lucide-react'

// Demo templates
const TEMPLATES = [
  { id: 1, name: 'Executive Office', category: 'business', thumbnail: '🏢' },
  { id: 2, name: 'Luxury Home', category: 'residential', thumbnail: '🏠' },
  { id: 3, name: 'City Street', category: 'outdoor', thumbnail: '🌆' },
  { id: 4, name: 'Boardroom', category: 'business', thumbnail: '🏛️' },
  { id: 5, name: 'Studio Set', category: 'indoor', thumbnail: '🎬' },
  { id: 6, name: 'Nature Park', category: 'outdoor', thumbnail: '🌳' },
  { id: 7, name: 'Modern Kitchen', category: 'residential', thumbnail: '🍳' },
  { id: 8, name: 'Rooftop', category: 'outdoor', thumbnail: '🌅' },
]

interface Scene {
  id: string
  name: string
  duration: number
  status: string
  characters: number
  template?: string
  image?: string
}

export default function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', name: 'Opening Scene', duration: 30, status: 'draft', characters: 2, template: 'Executive Office' },
    { id: '2', name: 'Dialogue Sequence', duration: 45, status: 'rendering', characters: 1, template: 'Luxury Home' },
  ])
  const [showUpload, setShowUpload] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRender = (id: string) => {
    setScenes(scenes.map(s => s.id === id ? { ...s, status: 'rendering' } : s))
    setTimeout(() => {
      setScenes(scenes.map(s => s.id === id ? { ...s, status: 'completed' } : s))
    }, 2000)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // Create local URLs for demo
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file)
        setUploadedImages(prev => [...prev, url])
      })
    }
  }

  const applyTemplate = (templateName: string) => {
    if (selectedScene) {
      setScenes(scenes.map(s => s.id === selectedScene ? { ...s, template: templateName } : s))
    } else {
      // Create new scene with template
      const newScene: Scene = {
        id: Date.now().toString(),
        name: templateName,
        duration: 30,
        status: 'draft',
        characters: 1,
        template: templateName
      }
      setScenes([...scenes, newScene])
    }
    setShowTemplates(false)
    setSelectedScene(null)
  }

  const deleteImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scene Builder</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
          >
            <Upload className="h-4 w-4" /> Upload Photo
          </button>
          <button 
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all"
          >
            <Sparkles className="h-4 w-4" /> AI Templates
          </button>
          <button 
            onClick={() => {
              setScenes([...scenes, { id: Date.now().toString(), name: `Scene ${scenes.length + 1}`, duration: 30, status: 'draft', characters: 1 }])
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> New Scene
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Scenes</h2>
          <span className="text-sm text-gray-500">{scenes.length} scenes</span>
        </div>

        {scenes.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No scenes yet. Upload a photo or choose a template to get started.</p>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setShowUpload(true)} className="px-4 py-2 border rounded-lg">Upload Photo</button>
              <button onClick={() => setShowTemplates(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Browse Templates</button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenes.map(scene => (
              <div key={scene.id} className="border rounded-lg p-4 hover:shadow-md transition-all group">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {scene.image ? (
                    <img src={scene.image} alt={scene.name} className="w-full h-full object-cover" />
                  ) : scene.template ? (
                    <span className="text-4xl">{TEMPLATES.find(t => t.name === scene.template)?.thumbnail}</span>
                  ) : (
                    <Film className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{scene.name}</h3>
                    <p className="text-sm text-gray-500">{scene.duration}s • {scene.template || 'No template'}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleRender(scene.id)}
                    disabled={scene.status === 'rendering'}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-sm transition-all ${
                      scene.status === 'rendering' 
                        ? 'bg-blue-600 text-white animate-pulse' 
                        : scene.status === 'completed'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {scene.status === 'rendering' ? (
                      <>⟳ Rendering...</>
                    ) : scene.status === 'completed' ? (
                      <>✓ Done</>
                    ) : (
                      <>▶ Render</>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedScene(scene.id)
                      setShowTemplates(true)
                    }}
                    className="p-1.5 border rounded hover:bg-gray-50"
                    title="Change Template"
                  >
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </button>
                  <button 
                    onClick={() => setScenes(scenes.filter(s => s.id !== scene.id))}
                    className="p-1.5 border rounded hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Photos</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleUpload}
                className="hidden" 
              />
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Click to upload photos</p>
              <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
            </div>

            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Uploaded ({uploadedImages.length})</p>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-full h-20 object-cover rounded" />
                      <button 
                        onClick={() => deleteImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newScene: Scene = {
                      id: Date.now().toString(),
                      name: `Photo Scene ${scenes.length + 1}`,
                      duration: 30,
                      status: 'draft',
                      characters: 1,
                      image: uploadedImages[0]
                    }
                    setScenes([...scenes, newScene])
                    setShowUpload(false)
                  }}
                  className="w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                >
                  Create Scene from Photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">AI Templates</h2>
              <button onClick={() => { setShowTemplates(false); setSelectedScene(null) }} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search templates..." 
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['All', 'Business', 'Residential', 'Outdoor', 'Indoor'].map(cat => (
                <button key={cat} className="px-3 py-1 rounded-full text-sm border hover:bg-purple-50 hover:border-purple-500 whitespace-nowrap">
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.name)}
                  className="border rounded-lg p-3 text-center hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <div className="text-3xl mb-1">{template.thumbnail}</div>
                  <div className="text-sm font-medium group-hover:text-purple-600">{template.name}</div>
                  <div className="text-xs text-gray-400">{template.category}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button 
                onClick={() => {
                  // Generate more templates
                  const newTemplates = [
                    ...TEMPLATES,
                    ...Array.from({ length: 8 }, (_, i) => ({
                      id: TEMPLATES.length + i + 1,
                      name: `AI Scene ${TEMPLATES.length + i + 1}`,
                      category: ['business', 'residential', 'outdoor', 'indoor'][i % 4],
                      thumbnail: ['🎥', '🌃', '🏪', '🚗', '✈️', '🏖️', '🎭', '🗿'][i]
                    }))
                  ]
                  // Apply random template
                  applyTemplate(newTemplates[Math.floor(Math.random() * newTemplates.length)].name)
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Generate 8 More AI Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
