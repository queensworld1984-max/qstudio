'use client'

import { useState, useEffect } from 'react'
import { Sparkles, FileText, Image, Video, Mic, UserCircle, Wand2, Loader2, Copy, Download, Play, AlertCircle } from 'lucide-react'

interface AIStatus {
  openai_configured: boolean
  replicate_configured: boolean
  available_providers: Record<string, string[]>
}

type TabType = 'script' | 'image' | 'video' | 'voice' | 'face' | 'render'

export default function AIStudioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('script')
  const [loading, setLoading] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Record<string, string | object> | null>(null)

  // Form states
  const [scriptPrompt, setScriptPrompt] = useState('')
  const [scriptStyle, setScriptStyle] = useState('cinematic')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageProvider, setImageProvider] = useState('flux')
  const [imageModel, setImageModel] = useState('schnell')
  const [videoImageUrl, setVideoImageUrl] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoResolution, setVideoResolution] = useState('480p')
  const [voiceText, setVoiceText] = useState('')
  const [voiceSpeaker, setVoiceSpeaker] = useState('v2/en_speaker_6')
  const [faceImageUrl, setFaceImageUrl] = useState('')
  const [facePrompt, setFacePrompt] = useState('professional headshot')
  const [faceStyle, setFaceStyle] = useState('photorealistic')

  useEffect(() => {
    fetchAIStatus()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const fetchAIStatus = async () => {
    try {
      const res = await fetch('/api/ai/status', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setAiStatus(data)
      }
    } catch (e) {
      console.error('Failed to fetch AI status:', e)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      let endpoint = ''
      let body: Record<string, unknown> = {}

      switch (activeTab) {
        case 'script':
          endpoint = '/api/ai/generate/script'
          body = { prompt: scriptPrompt, style: scriptStyle }
          break
        case 'image':
          endpoint = '/api/ai/generate/image'
          body = { prompt: imagePrompt, provider: imageProvider, model: imageModel }
          break
        case 'video':
          endpoint = '/api/ai/generate/video'
          body = { image_url: videoImageUrl, prompt: videoPrompt, resolution: videoResolution }
          break
        case 'voice':
          endpoint = '/api/ai/generate/voice'
          body = { text: voiceText, speaker: voiceSpeaker }
          break
        case 'face':
          endpoint = '/api/ai/generate/face'
          body = { face_image_url: faceImageUrl, prompt: facePrompt, style: faceStyle }
          break
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(errData.detail || `Error ${res.status}`)
      }

      const data = await res.json()
      setResult(data)

      // Auto-fill video image URL if image was generated
      if (activeTab === 'image' && data.image_url) {
        setVideoImageUrl(data.image_url)
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Generation failed'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'script' as TabType, label: 'Script', icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { id: 'image' as TabType, label: 'Image', icon: Image, color: 'from-purple-500 to-pink-500' },
    { id: 'video' as TabType, label: 'Video', icon: Video, color: 'from-orange-500 to-red-500' },
    { id: 'voice' as TabType, label: 'Voice', icon: Mic, color: 'from-green-500 to-emerald-500' },
    { id: 'face' as TabType, label: 'Face', icon: UserCircle, color: 'from-indigo-500 to-violet-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-500" />
            AI Studio
          </h1>
          <p className="text-gray-500 mt-1">Generate scripts, images, videos, voices, and face portraits with AI</p>
        </div>
        {aiStatus && (
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${aiStatus.openai_configured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              OpenAI {aiStatus.openai_configured ? 'Connected' : 'Not configured'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${aiStatus.replicate_configured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Replicate {aiStatus.replicate_configured ? 'Connected' : 'Not configured'}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); setError('') }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'bg-white text-gray-600 hover:bg-gray-50 border'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">
            {activeTab === 'script' && 'Generate Script'}
            {activeTab === 'image' && 'Generate Image'}
            {activeTab === 'video' && 'Generate Video'}
            {activeTab === 'voice' && 'Generate Voice'}
            {activeTab === 'face' && 'Generate Face Portrait'}
          </h2>

          {/* Script Form */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe your film or video</label>
                <textarea
                  value={scriptPrompt}
                  onChange={e => setScriptPrompt(e.target.value)}
                  placeholder="A short film about a detective investigating a mysterious disappearance in a futuristic city..."
                  className="w-full border rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                  value={scriptStyle}
                  onChange={e => setScriptStyle(e.target.value)}
                  className="w-full border rounded-lg p-2.5"
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="documentary">Documentary</option>
                  <option value="commercial">Commercial</option>
                  <option value="animation">Animation</option>
                  <option value="music_video">Music Video</option>
                  <option value="horror">Horror</option>
                  <option value="comedy">Comedy</option>
                </select>
              </div>
            </div>
          )}

          {/* Image Form */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Description</label>
                <textarea
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  placeholder="A cinematic wide shot of a neon-lit cyberpunk city at night, rain-soaked streets reflecting colorful lights..."
                  className="w-full border rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    value={imageProvider}
                    onChange={e => setImageProvider(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  >
                    <option value="flux">FLUX (Replicate)</option>
                    <option value="dalle">DALL-E 3 (OpenAI)</option>
                  </select>
                </div>
                {imageProvider === 'flux' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <select
                      value={imageModel}
                      onChange={e => setImageModel(e.target.value)}
                      className="w-full border rounded-lg p-2.5"
                    >
                      <option value="schnell">Schnell (Fast, $0.003)</option>
                      <option value="dev">Dev (Balanced, $0.025)</option>
                      <option value="pro">Pro (Best, $0.04)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Form */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Image URL</label>
                <input
                  value={videoImageUrl}
                  onChange={e => setVideoImageUrl(e.target.value)}
                  placeholder="https://... (generate an image first, URL auto-fills)"
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Tip: Generate an image in the Image tab first - the URL will auto-fill here</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motion Description</label>
                <textarea
                  value={videoPrompt}
                  onChange={e => setVideoPrompt(e.target.value)}
                  placeholder="Slow camera pan with gentle rain falling, lights flickering..."
                  className="w-full border rounded-lg p-3 h-20 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <select
                  value={videoResolution}
                  onChange={e => setVideoResolution(e.target.value)}
                  className="w-full border rounded-lg p-2.5"
                >
                  <option value="480p">480p ($0.09/sec)</option>
                  <option value="720p">720p ($0.25/sec)</option>
                </select>
              </div>
            </div>
          )}

          {/* Voice Form */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text to Speak</label>
                <textarea
                  value={voiceText}
                  onChange={e => setVoiceText(e.target.value)}
                  placeholder="Enter the dialogue or narration text..."
                  className="w-full border rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                <select
                  value={voiceSpeaker}
                  onChange={e => setVoiceSpeaker(e.target.value)}
                  className="w-full border rounded-lg p-2.5"
                >
                  <option value="v2/en_speaker_0">Male Voice 1</option>
                  <option value="v2/en_speaker_1">Male Voice 2</option>
                  <option value="v2/en_speaker_2">Male Voice 3</option>
                  <option value="v2/en_speaker_3">Female Voice 1</option>
                  <option value="v2/en_speaker_4">Female Voice 2</option>
                  <option value="v2/en_speaker_5">Female Voice 3</option>
                  <option value="v2/en_speaker_6">Narrator (Default)</option>
                  <option value="v2/en_speaker_7">Storyteller</option>
                  <option value="v2/en_speaker_8">Announcer</option>
                  <option value="v2/en_speaker_9">Deep Voice</option>
                </select>
              </div>
            </div>
          )}

          {/* Face Form */}
          {activeTab === 'face' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Face Image URL</label>
                <input
                  value={faceImageUrl}
                  onChange={e => setFaceImageUrl(e.target.value)}
                  placeholder="https://... URL of the face reference image"
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portrait Description</label>
                <input
                  value={facePrompt}
                  onChange={e => setFacePrompt(e.target.value)}
                  placeholder="professional headshot, business attire..."
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                  value={faceStyle}
                  onChange={e => setFaceStyle(e.target.value)}
                  className="w-full border rounded-lg p-2.5"
                >
                  <option value="photorealistic">Photorealistic</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="artistic">Artistic</option>
                  <option value="anime">Anime</option>
                  <option value="3d_render">3D Render</option>
                </select>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Generate
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Output</h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-500">
                {activeTab === 'script' && 'Writing your script...'}
                {activeTab === 'image' && 'Creating your image...'}
                {activeTab === 'video' && 'Generating video (this may take 1-3 minutes)...'}
                {activeTab === 'voice' && 'Synthesizing voice...'}
                {activeTab === 'face' && 'Generating face portrait...'}
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Sparkles className="h-12 w-12 mb-4" />
              <p>Your AI-generated content will appear here</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">
              {/* Script Result */}
              {activeTab === 'script' && result.script && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Generated Script</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(result.script, null, 2))}
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-auto max-h-[500px] whitespace-pre-wrap">
                    {typeof result.script === 'object' ? JSON.stringify(result.script, null, 2) : String(result.script)}
                  </pre>
                </div>
              )}

              {/* Image Result */}
              {activeTab === 'image' && result.image_url && (
                <div>
                  <img
                    src={String(result.image_url)}
                    alt="Generated"
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="mt-3 flex gap-2">
                    <a
                      href={String(result.image_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                    <button
                      onClick={() => {
                        setVideoImageUrl(String(result.image_url))
                        setActiveTab('video')
                      }}
                      className="flex items-center gap-1 text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200"
                    >
                      <Play className="h-3 w-3" /> Create Video
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(result.image_url))}
                      className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      <Copy className="h-3 w-3" /> Copy URL
                    </button>
                  </div>
                  {result.revised_prompt && (
                    <p className="mt-2 text-xs text-gray-400">Revised prompt: {String(result.revised_prompt)}</p>
                  )}
                </div>
              )}

              {/* Video Result */}
              {activeTab === 'video' && result.video_url && (
                <div>
                  <video
                    src={String(result.video_url)}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="mt-3 flex gap-2">
                    <a
                      href={String(result.video_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(result.video_url))}
                      className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      <Copy className="h-3 w-3" /> Copy URL
                    </button>
                  </div>
                </div>
              )}

              {/* Voice Result */}
              {activeTab === 'voice' && result.audio_url && (
                <div>
                  <audio
                    src={String(result.audio_url)}
                    controls
                    className="w-full"
                  />
                  <div className="mt-3 flex gap-2">
                    <a
                      href={String(result.audio_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  </div>
                </div>
              )}

              {/* Face Result */}
              {activeTab === 'face' && result.image_url && (
                <div>
                  <img
                    src={String(result.image_url)}
                    alt="Generated Face"
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="mt-3 flex gap-2">
                    <a
                      href={String(result.image_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(result.image_url))}
                      className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      <Copy className="h-3 w-3" /> Copy URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setActiveTab('script')
              setScriptPrompt('A 30-second commercial for a luxury product. Modern, sleek, and sophisticated.')
            }}
            className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
          >
            <FileText className="h-6 w-6 text-blue-500 mb-2" />
            <h3 className="font-medium">Write a Commercial</h3>
            <p className="text-sm text-gray-500">AI-generated 30-second ad script</p>
          </button>
          <button
            onClick={() => {
              setActiveTab('image')
              setImagePrompt('Cinematic wide shot, dramatic lighting, film grain, moody atmosphere')
            }}
            className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
          >
            <Image className="h-6 w-6 text-purple-500 mb-2" />
            <h3 className="font-medium">Create Storyboard</h3>
            <p className="text-sm text-gray-500">Generate cinematic scene images</p>
          </button>
          <button
            onClick={() => {
              setActiveTab('voice')
              setVoiceText('Welcome to the world of tomorrow. Where imagination meets reality.')
            }}
            className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
          >
            <Mic className="h-6 w-6 text-green-500 mb-2" />
            <h3 className="font-medium">Record Narration</h3>
            <p className="text-sm text-gray-500">AI voice for narration or dialogue</p>
          </button>
        </div>
      </div>
    </div>
  )
}
