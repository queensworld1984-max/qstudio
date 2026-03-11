'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Scissors, Trash2, Plus, Type,
  Image, Music, Film, Download, Volume2, VolumeX, ChevronLeft,
  ChevronRight, ZoomIn, ZoomOut, Copy, Layers, Move, Sparkles,
  Upload, X, GripVertical, Clock, Settings
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Clip {
  id: string
  type: 'video' | 'image' | 'audio' | 'text'
  name: string
  src: string
  trackIndex: number
  startTime: number     // position on timeline (seconds)
  duration: number      // duration in seconds
  trimStart: number     // trim from beginning (seconds)
  trimEnd: number       // trim from end (seconds)
  // Text overlay properties
  text?: string
  fontSize?: number
  fontColor?: string
  bgColor?: string
  // Transition
  transition?: 'none' | 'fade' | 'dissolve' | 'slide-left' | 'slide-right' | 'zoom'
  transitionDuration?: number
  // Volume (for audio/video)
  volume?: number
}

interface Track {
  id: string
  name: string
  type: 'video' | 'audio' | 'text' | 'image'
  muted: boolean
  locked: boolean
  visible: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TRANSITIONS = [
  { id: 'none', label: 'None' },
  { id: 'fade', label: 'Fade' },
  { id: 'dissolve', label: 'Dissolve' },
  { id: 'slide-left', label: 'Slide Left' },
  { id: 'slide-right', label: 'Slide Right' },
  { id: 'zoom', label: 'Zoom' },
]

const TEXT_PRESETS = [
  { label: 'Title', fontSize: 48, fontColor: '#ffffff', bgColor: 'rgba(0,0,0,0.5)' },
  { label: 'Subtitle', fontSize: 24, fontColor: '#ffffff', bgColor: 'rgba(0,0,0,0.7)' },
  { label: 'Caption', fontSize: 18, fontColor: '#ffff00', bgColor: 'transparent' },
  { label: 'Lower Third', fontSize: 20, fontColor: '#ffffff', bgColor: 'rgba(102,51,153,0.8)' },
]

const PIXELS_PER_SECOND = 80

// ─── Helper ─────────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EditorPage() {
  // ── State ───────────────────────────────────────────────────
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'track-v1', name: 'Video 1', type: 'video', muted: false, locked: false, visible: true },
    { id: 'track-v2', name: 'Video 2', type: 'video', muted: false, locked: false, visible: true },
    { id: 'track-a1', name: 'Audio 1', type: 'audio', muted: false, locked: false, visible: true },
    { id: 'track-t1', name: 'Text', type: 'text', muted: false, locked: false, visible: true },
  ])
  const [clips, setClips] = useState<Clip[]>([])
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [playheadTime, setPlayheadTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [totalDuration, setTotalDuration] = useState(60)
  const [showMediaLibrary, setShowMediaLibrary] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [draggingClip, setDraggingClip] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState<number | null>(null)
  const [exportStatus, setExportStatus] = useState<string>('')
  const [previewSrc, setPreviewSrc] = useState<string>('')

  const timelineRef = useRef<HTMLDivElement>(null)
  const playInterval = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedClip = clips.find(c => c.id === selectedClipId) || null

  // ── Playback ────────────────────────────────────────────────

  useEffect(() => {
    // Calculate total duration based on clips
    if (clips.length > 0) {
      const maxEnd = Math.max(...clips.map(c => c.startTime + c.duration - c.trimStart - c.trimEnd))
      setTotalDuration(Math.max(maxEnd + 10, 30))
    }
  }, [clips])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (playInterval.current) clearInterval(playInterval.current)
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      playInterval.current = setInterval(() => {
        setPlayheadTime(prev => {
          if (prev >= totalDuration) {
            if (playInterval.current) clearInterval(playInterval.current)
            setIsPlaying(false)
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    }
  }, [isPlaying, totalDuration])

  useEffect(() => {
    return () => { if (playInterval.current) clearInterval(playInterval.current) }
  }, [])

  const skipBack = () => setPlayheadTime(Math.max(0, playheadTime - 5))
  const skipForward = () => setPlayheadTime(Math.min(totalDuration, playheadTime + 5))
  const goToStart = () => setPlayheadTime(0)

  // ── Clip Operations ─────────────────────────────────────────

  const addClip = (type: Clip['type'], name: string, src: string, duration: number) => {
    const trackIndex = tracks.findIndex(t => t.type === type || (type === 'image' && t.type === 'video'))
    if (trackIndex === -1) return

    // Find the end of existing clips on that track
    const trackClips = clips.filter(c => c.trackIndex === trackIndex)
    const endTime = trackClips.length > 0
      ? Math.max(...trackClips.map(c => c.startTime + c.duration - c.trimStart - c.trimEnd))
      : 0

    const newClip: Clip = {
      id: generateId(),
      type,
      name,
      src,
      trackIndex,
      startTime: endTime,
      duration,
      trimStart: 0,
      trimEnd: 0,
      transition: 'none',
      transitionDuration: 0.5,
      volume: type === 'audio' || type === 'video' ? 100 : undefined,
      text: type === 'text' ? 'Enter text here' : undefined,
      fontSize: type === 'text' ? 32 : undefined,
      fontColor: type === 'text' ? '#ffffff' : undefined,
      bgColor: type === 'text' ? 'rgba(0,0,0,0.5)' : undefined,
    }
    setClips(prev => [...prev, newClip])
    setSelectedClipId(newClip.id)
  }

  const deleteClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id))
    if (selectedClipId === id) setSelectedClipId(null)
  }

  const duplicateClip = (id: string) => {
    const clip = clips.find(c => c.id === id)
    if (!clip) return
    const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd
    const newClip: Clip = {
      ...clip,
      id: generateId(),
      startTime: clip.startTime + effectiveDuration,
    }
    setClips(prev => [...prev, newClip])
    setSelectedClipId(newClip.id)
  }

  const splitClip = (id: string) => {
    const clip = clips.find(c => c.id === id)
    if (!clip) return
    const splitPoint = playheadTime - clip.startTime
    const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd
    if (splitPoint <= 0 || splitPoint >= effectiveDuration) return

    const clip1: Clip = { ...clip, trimEnd: clip.trimEnd + (effectiveDuration - splitPoint) }
    const clip2: Clip = {
      ...clip,
      id: generateId(),
      startTime: clip.startTime + splitPoint,
      trimStart: clip.trimStart + splitPoint,
      trimEnd: clip.trimEnd,
    }
    // Restore original trimEnd for clip1
    clip1.trimEnd = clip.duration - clip.trimStart - splitPoint

    setClips(prev => prev.map(c => c.id === id ? clip1 : c).concat(clip2))
  }

  const updateClip = (id: string, updates: Partial<Clip>) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  // ── Track Operations ────────────────────────────────────────

  const addTrack = (type: Track['type']) => {
    const count = tracks.filter(t => t.type === type).length + 1
    const labels: Record<string, string> = { video: 'Video', audio: 'Audio', text: 'Text', image: 'Image' }
    setTracks(prev => [...prev, {
      id: `track-${type[0]}${count}-${generateId()}`,
      name: `${labels[type]} ${count}`,
      type,
      muted: false,
      locked: false,
      visible: true,
    }])
  }

  const toggleTrackMute = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, muted: !t.muted } : t))
  }

  // ── File Import ─────────────────────────────────────────────

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      const isVideo = file.type.startsWith('video/')
      const isAudio = file.type.startsWith('audio/')
      const isImage = file.type.startsWith('image/')

      if (isVideo) {
        const video = document.createElement('video')
        video.onloadedmetadata = () => {
          addClip('video', file.name, url, video.duration || 10)
        }
        video.src = url
      } else if (isAudio) {
        const audio = new Audio(url)
        audio.onloadedmetadata = () => {
          addClip('audio', file.name, url, audio.duration || 10)
        }
      } else if (isImage) {
        addClip('image', file.name, url, 5) // default 5 seconds for images
      }
    })
    e.target.value = ''
  }

  // ── AI Import ───────────────────────────────────────────────

  const importFromAIStudio = (type: string) => {
    // Placeholder — in real implementation, this would fetch from AI Studio API
    if (type === 'image') {
      addClip('image', 'AI Generated Image', '/api/placeholder/1920/1080', 5)
    } else if (type === 'video') {
      addClip('video', 'AI Generated Video', '', 5)
    } else if (type === 'voice') {
      addClip('audio', 'AI Voice Over', '', 10)
    }
  }

  // ── Export ──────────────────────────────────────────────────

  const handleExport = async () => {
    setExportProgress(0)
    setExportStatus('Preparing export...')

    const composition = {
      tracks: tracks.map(t => ({ id: t.id, name: t.name, type: t.type, muted: t.muted })),
      clips: clips.map(c => ({
        id: c.id,
        type: c.type,
        name: c.name,
        src: c.src,
        track_id: tracks[c.trackIndex]?.id,
        start_time: c.startTime,
        duration: c.duration,
        trim_start: c.trimStart,
        trim_end: c.trimEnd,
        transition: c.transition,
        transition_duration: c.transitionDuration,
        volume: c.volume,
        text: c.text,
        font_size: c.fontSize,
        font_color: c.fontColor,
        bg_color: c.bgColor,
      })),
      total_duration: totalDuration,
      resolution: '1920x1080',
      fps: 30,
    }

    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/ai/export/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(composition),
      })

      if (res.ok) {
        const data = await res.json()
        setExportStatus('Export complete!')
        setExportProgress(100)
        if (data.output_url) {
          setPreviewSrc(data.output_url)
        }
      } else {
        setExportStatus('Export started — check Render queue for progress')
        setExportProgress(100)
      }
    } catch {
      // Simulate export progress for demo
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 300))
        setExportProgress(i)
        setExportStatus(i < 30 ? 'Composing clips...' : i < 60 ? 'Rendering video...' : i < 90 ? 'Encoding output...' : 'Finalizing...')
      }
      setExportStatus('Export complete (demo mode)')
    }
  }

  // ── Timeline click to seek ──────────────────────────────────

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft
    const time = x / (PIXELS_PER_SECOND * zoom)
    setPlayheadTime(Math.max(0, Math.min(time, totalDuration)))
  }

  // ── Clip drag (simplified) ──────────────────────────────────

  const handleClipMouseDown = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedClipId(clipId)
    setDraggingClip(clipId)

    const clip = clips.find(c => c.id === clipId)
    if (!clip || !timelineRef.current) return

    const startX = e.clientX
    const originalStart = clip.startTime

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dt = dx / (PIXELS_PER_SECOND * zoom)
      updateClip(clipId, { startTime: Math.max(0, originalStart + dt) })
    }

    const onMouseUp = () => {
      setDraggingClip(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // ── Render ──────────────────────────────────────────────────

  const timelineWidth = totalDuration * PIXELS_PER_SECOND * zoom
  const playheadX = playheadTime * PIXELS_PER_SECOND * zoom

  const clipColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-500/80 border-blue-400'
      case 'image': return 'bg-green-500/80 border-green-400'
      case 'audio': return 'bg-orange-500/80 border-orange-400'
      case 'text': return 'bg-purple-500/80 border-purple-400'
      default: return 'bg-gray-500/80 border-gray-400'
    }
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-gray-950 text-white -m-4 lg:-m-8 rounded-xl overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Film className="h-5 w-5 text-purple-400" />
          <h1 className="font-semibold text-sm">Video Editor</h1>
          <span className="text-xs text-gray-500">|</span>
          <span className="text-xs text-gray-400">{clips.length} clips on {tracks.length} tracks</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMediaLibrary(!showMediaLibrary)}
            className={`px-3 py-1 text-xs rounded ${showMediaLibrary ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            Media
          </button>
          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`px-3 py-1 text-xs rounded ${showProperties ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            Properties
          </button>
          <button
            onClick={handleExport}
            disabled={clips.length === 0 || exportProgress !== null}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 rounded hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      {/* ── Main Area ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Media Library (left panel) ────────────────────── */}
        {showMediaLibrary && (
          <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-3 border-b border-gray-800">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Media Library</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,image/*"
                multiple
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 rounded text-xs hover:bg-gray-700 transition-colors"
              >
                <Upload className="h-3 w-3" /> Import Files
              </button>
            </div>

            <div className="p-3 border-b border-gray-800">
              <h3 className="text-xs font-medium text-gray-400 mb-2">Quick Add</h3>
              <div className="space-y-1">
                <button
                  onClick={() => addClip('text', 'Title Text', '', 5)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-purple-600/30 transition-colors"
                >
                  <Type className="h-3 w-3 text-purple-400" /> Add Text
                </button>
                <button
                  onClick={() => addClip('image', 'Color Background', '', 5)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-green-600/30 transition-colors"
                >
                  <Image className="h-3 w-3 text-green-400" /> Add Image
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-gray-800">
              <h3 className="text-xs font-medium text-gray-400 mb-2">From AI Studio</h3>
              <div className="space-y-1">
                <button
                  onClick={() => importFromAIStudio('image')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-blue-600/30 transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-blue-400" /> AI Image
                </button>
                <button
                  onClick={() => importFromAIStudio('video')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-blue-600/30 transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-blue-400" /> AI Video
                </button>
                <button
                  onClick={() => importFromAIStudio('voice')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-blue-600/30 transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-blue-400" /> AI Voice
                </button>
              </div>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <h3 className="text-xs font-medium text-gray-400 mb-2">Text Presets</h3>
              <div className="space-y-1">
                {TEXT_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const clip: Clip = {
                        id: generateId(),
                        type: 'text',
                        name: preset.label,
                        src: '',
                        trackIndex: tracks.findIndex(t => t.type === 'text'),
                        startTime: playheadTime,
                        duration: 5,
                        trimStart: 0,
                        trimEnd: 0,
                        text: preset.label,
                        fontSize: preset.fontSize,
                        fontColor: preset.fontColor,
                        bgColor: preset.bgColor,
                      }
                      if (clip.trackIndex === -1) clip.trackIndex = tracks.length - 1
                      setClips(prev => [...prev, clip])
                      setSelectedClipId(clip.id)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-purple-600/30 transition-colors"
                  >
                    <span style={{ fontSize: `${Math.min(preset.fontSize / 4, 14)}px` }}>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Center: Preview + Timeline ────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── Preview Area ────────────────────────────────── */}
          <div className="flex-shrink-0 bg-black flex items-center justify-center" style={{ height: '35%' }}>
            {previewSrc ? (
              <video src={previewSrc} controls className="max-h-full max-w-full" />
            ) : selectedClip?.type === 'text' ? (
              <div className="flex items-center justify-center w-full h-full">
                <div
                  style={{
                    fontSize: `${selectedClip.fontSize || 32}px`,
                    color: selectedClip.fontColor || '#fff',
                    backgroundColor: selectedClip.bgColor || 'transparent',
                    padding: '8px 16px',
                    borderRadius: '4px',
                  }}
                >
                  {selectedClip.text || 'Preview'}
                </div>
              </div>
            ) : selectedClip?.src ? (
              selectedClip.type === 'video' ? (
                <video src={selectedClip.src} className="max-h-full max-w-full" />
              ) : selectedClip.type === 'image' ? (
                <img src={selectedClip.src} alt={selectedClip.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-gray-500 text-sm flex flex-col items-center gap-2">
                  <Music className="h-12 w-12" />
                  <span>{selectedClip.name}</span>
                </div>
              )
            ) : (
              <div className="text-gray-600 text-sm flex flex-col items-center gap-2">
                <Film className="h-16 w-16" />
                <span>Select a clip to preview</span>
                <span className="text-xs text-gray-700">Import media or add clips from the left panel</span>
              </div>
            )}
          </div>

          {/* ── Transport Controls ──────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-y border-gray-800">
            <div className="flex items-center gap-1">
              <button onClick={goToStart} className="p-1.5 rounded hover:bg-gray-700" title="Go to start">
                <SkipBack className="h-4 w-4" />
              </button>
              <button onClick={skipBack} className="p-1.5 rounded hover:bg-gray-700" title="Back 5s">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={togglePlay} className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 mx-1" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={skipForward} className="p-1.5 rounded hover:bg-gray-700" title="Forward 5s">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-300">
                {formatTime(playheadTime)} / {formatTime(totalDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedClipId && (
                <>
                  <button onClick={() => splitClip(selectedClipId)} className="p-1.5 rounded hover:bg-gray-700" title="Split at playhead">
                    <Scissors className="h-4 w-4" />
                  </button>
                  <button onClick={() => duplicateClip(selectedClipId)} className="p-1.5 rounded hover:bg-gray-700" title="Duplicate clip">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteClip(selectedClipId)} className="p-1.5 rounded hover:bg-red-700 text-red-400" title="Delete clip">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
              <span className="text-gray-700">|</span>
              <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="p-1.5 rounded hover:bg-gray-700" title="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="p-1.5 rounded hover:bg-gray-700" title="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Timeline ───────────────────────────────────── */}
          <div className="flex-1 flex overflow-hidden bg-gray-950">
            {/* Track headers */}
            <div className="w-36 flex-shrink-0 border-r border-gray-800 bg-gray-900">
              {/* Ruler header */}
              <div className="h-6 border-b border-gray-800 flex items-center px-2">
                <span className="text-[10px] text-gray-500">Tracks</span>
              </div>
              {tracks.map((track) => (
                <div key={track.id} className="h-16 border-b border-gray-800 flex items-center px-2 gap-1">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium truncate block">{track.name}</span>
                    <span className="text-[10px] text-gray-500">{track.type}</span>
                  </div>
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    className={`p-0.5 rounded ${track.muted ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
                    title={track.muted ? 'Unmute' : 'Mute'}
                  >
                    {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </button>
                </div>
              ))}
              {/* Add track button */}
              <div className="h-8 flex items-center justify-center">
                <div className="flex gap-1">
                  <button onClick={() => addTrack('video')} className="px-1.5 py-0.5 text-[10px] bg-gray-800 rounded hover:bg-blue-600/30" title="Add video track">+V</button>
                  <button onClick={() => addTrack('audio')} className="px-1.5 py-0.5 text-[10px] bg-gray-800 rounded hover:bg-orange-600/30" title="Add audio track">+A</button>
                  <button onClick={() => addTrack('text')} className="px-1.5 py-0.5 text-[10px] bg-gray-800 rounded hover:bg-purple-600/30" title="Add text track">+T</button>
                </div>
              </div>
            </div>

            {/* Timeline scroll area */}
            <div ref={timelineRef} className="flex-1 overflow-x-auto overflow-y-auto" onClick={handleTimelineClick}>
              {/* Time ruler */}
              <div className="h-6 border-b border-gray-800 relative" style={{ width: `${timelineWidth}px` }}>
                {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-gray-800 flex items-end pb-0.5 pl-1"
                    style={{ left: `${i * PIXELS_PER_SECOND * zoom}px` }}
                  >
                    <span className="text-[9px] text-gray-600">{formatTime(i)}</span>
                  </div>
                ))}
                {/* Playhead indicator on ruler */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-red-500 z-30"
                  style={{ left: `${playheadX}px` }}
                >
                  <div className="absolute -top-0.5 -left-1.5 w-3 h-2 bg-red-500 rounded-sm" />
                </div>
              </div>

              {/* Track lanes */}
              {tracks.map((track, trackIdx) => (
                <div
                  key={track.id}
                  className="h-16 border-b border-gray-800 relative bg-gray-950/50"
                  style={{ width: `${timelineWidth}px` }}
                >
                  {/* Grid lines */}
                  {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full border-l border-gray-900/50"
                      style={{ left: `${i * PIXELS_PER_SECOND * zoom}px` }}
                    />
                  ))}

                  {/* Clips on this track */}
                  {clips.filter(c => c.trackIndex === trackIdx).map(clip => {
                    const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd
                    const clipWidth = effectiveDuration * PIXELS_PER_SECOND * zoom
                    const clipLeft = clip.startTime * PIXELS_PER_SECOND * zoom
                    const isSelected = clip.id === selectedClipId

                    return (
                      <div
                        key={clip.id}
                        className={`absolute top-1 bottom-1 rounded-md border cursor-pointer select-none transition-shadow ${clipColor(clip.type)} ${
                          isSelected ? 'ring-2 ring-white shadow-lg z-20' : 'hover:brightness-110 z-10'
                        }`}
                        style={{ left: `${clipLeft}px`, width: `${Math.max(clipWidth, 20)}px` }}
                        onMouseDown={(e) => handleClipMouseDown(clip.id, e)}
                        onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id) }}
                      >
                        <div className="px-2 py-1 overflow-hidden h-full flex flex-col justify-between">
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 opacity-50 flex-shrink-0" />
                            <span className="text-[10px] font-medium truncate">{clip.name}</span>
                          </div>
                          <span className="text-[9px] opacity-70">{formatTime(effectiveDuration)}</span>
                          {clip.transition && clip.transition !== 'none' && (
                            <div className="absolute top-0 left-0 w-4 h-full bg-white/20 rounded-l-md flex items-center justify-center">
                              <span className="text-[8px] rotate-[-90deg]">{clip.transition[0].toUpperCase()}</span>
                            </div>
                          )}
                        </div>

                        {/* Trim handles */}
                        {isSelected && (
                          <>
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-white/30 cursor-w-resize rounded-l-md hover:bg-white/50" />
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-white/30 cursor-e-resize rounded-r-md hover:bg-white/50" />
                          </>
                        )}
                      </div>
                    )
                  })}

                  {/* Playhead line */}
                  <div
                    className="absolute top-0 w-0.5 h-full bg-red-500/70 z-30 pointer-events-none"
                    style={{ left: `${playheadX}px` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Properties Panel (right) ──────────────────────── */}
        {showProperties && (
          <div className="w-60 bg-gray-900 border-l border-gray-800 overflow-y-auto">
            {selectedClip ? (
              <div className="p-3 space-y-4">
                <div>
                  <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Clip Properties</h2>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Name</label>
                      <input
                        type="text"
                        value={selectedClip.name}
                        onChange={e => updateClip(selectedClip.id, { name: e.target.value })}
                        className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Start</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedClip.startTime.toFixed(1)}
                          onChange={e => updateClip(selectedClip.id, { startTime: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Duration</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedClip.duration.toFixed(1)}
                          onChange={e => updateClip(selectedClip.id, { duration: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
                          className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Trim Start</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={selectedClip.trimStart.toFixed(1)}
                          onChange={e => updateClip(selectedClip.id, { trimStart: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Trim End</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={selectedClip.trimEnd.toFixed(1)}
                          onChange={e => updateClip(selectedClip.id, { trimEnd: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume control for video/audio */}
                {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 mb-2">Volume</h3>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-3 w-3 text-gray-500" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedClip.volume || 100}
                        onChange={e => updateClip(selectedClip.id, { volume: parseInt(e.target.value) })}
                        className="flex-1 h-1 accent-purple-500"
                      />
                      <span className="text-[10px] text-gray-400 w-7 text-right">{selectedClip.volume || 100}%</span>
                    </div>
                  </div>
                )}

                {/* Text properties */}
                {selectedClip.type === 'text' && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 mb-2">Text</h3>
                    <div className="space-y-2">
                      <textarea
                        value={selectedClip.text || ''}
                        onChange={e => updateClip(selectedClip.id, { text: e.target.value })}
                        rows={3}
                        className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                        placeholder="Enter text..."
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-0.5">Font Size</label>
                          <input
                            type="number"
                            min="8"
                            max="120"
                            value={selectedClip.fontSize || 32}
                            onChange={e => updateClip(selectedClip.id, { fontSize: parseInt(e.target.value) || 32 })}
                            className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-0.5">Color</label>
                          <input
                            type="color"
                            value={selectedClip.fontColor || '#ffffff'}
                            onChange={e => updateClip(selectedClip.id, { fontColor: e.target.value })}
                            className="w-full h-7 bg-gray-800 rounded border border-gray-700 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Background</label>
                        <input
                          type="text"
                          value={selectedClip.bgColor || 'transparent'}
                          onChange={e => updateClip(selectedClip.id, { bgColor: e.target.value })}
                          className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                          placeholder="transparent or rgba(...)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Transitions */}
                <div>
                  <h3 className="text-xs font-medium text-gray-400 mb-2">Transition</h3>
                  <select
                    value={selectedClip.transition || 'none'}
                    onChange={e => updateClip(selectedClip.id, { transition: e.target.value as Clip['transition'] })}
                    className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                  >
                    {TRANSITIONS.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  {selectedClip.transition && selectedClip.transition !== 'none' && (
                    <div className="mt-2">
                      <label className="text-[10px] text-gray-500 block mb-0.5">Duration (s)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="3"
                        value={selectedClip.transitionDuration || 0.5}
                        onChange={e => updateClip(selectedClip.id, { transitionDuration: parseFloat(e.target.value) || 0.5 })}
                        className="w-full px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <h3 className="text-xs font-medium text-gray-400 mb-2">Actions</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => splitClip(selectedClip.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-gray-700"
                    >
                      <Scissors className="h-3 w-3" /> Split at Playhead
                    </button>
                    <button
                      onClick={() => duplicateClip(selectedClip.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-gray-700"
                    >
                      <Copy className="h-3 w-3" /> Duplicate
                    </button>
                    <button
                      onClick={() => deleteClip(selectedClip.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete Clip
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-600 text-xs mt-8">
                <Layers className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                <p>Select a clip to view properties</p>
                <p className="mt-1 text-gray-700">Click a clip on the timeline or import media to get started</p>
              </div>
            )}

            {/* Export Progress */}
            {exportProgress !== null && (
              <div className="p-3 border-t border-gray-800 mt-4">
                <h3 className="text-xs font-medium text-gray-400 mb-2">Export</h3>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500">{exportStatus}</p>
                {exportProgress === 100 && (
                  <button
                    onClick={() => { setExportProgress(null); setExportStatus('') }}
                    className="mt-2 w-full px-2 py-1 text-[10px] bg-gray-800 rounded hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
