// components/camera-modal.tsx
"use client"

import { useEffect, useState } from "react"

type Camera = {
  _id: string
  name: string
  streamUrl: string
  location: string
  status: string
  lastSeen?: string
}

type CameraModalProps = {
  camera?: Camera
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
}

export default function CameraModal({ camera, onClose, onSave, onDelete }: CameraModalProps) {
  const [name, setName] = useState(camera?.name ?? "")
  const [streamUrl, setStreamUrl] = useState(camera?.streamUrl ?? "")
  const [location, setLocation] = useState(camera?.location ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isEdit = !!camera

  async function saveCamera() {
    setSaving(true)
    setError(null)
    const body: any = { name, streamUrl: streamUrl || "local-device", location }
    const url = isEdit ? `/api/cameras/${camera._id}` : "/api/cameras"
    const method = isEdit ? "PUT" : "POST"
    
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.detail ? JSON.stringify(data.detail) : `Failed to ${isEdit ? 'update' : 'add'} camera`)
      return
    }
    
    onSave()
    onClose()
  }

  async function handleDelete() {
    if (!camera || !onDelete) return
    if (!confirm('Are you sure you want to delete this camera?')) return
    
    const res = await fetch(`/api/cameras/${camera._id}`, {
      method: 'DELETE'
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.detail ? JSON.stringify(data.detail) : 'Failed to delete camera')
      return
    }
    
    onDelete()
    onClose()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden'
    
    window.addEventListener("keydown", onKey)
    
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  // Handle backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" 
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-white/20 rounded-lg p-6 w-[480px] max-w-full shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-lg font-medium mb-4">{isEdit ? 'Edit' : 'Add'} Camera</div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Entrance"
              className="w-full bg-black/50 border border-white/20 px-3 py-2 rounded-md focus:border-white/40 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Stream URL (optional)</label>
            <input
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="rtsp:// or leave empty for local device"
              className="w-full bg-black/50 border border-white/20 px-3 py-2 rounded-md focus:border-white/40 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Building A, Floor 1"
              className="w-full bg-black/50 border border-white/20 px-3 py-2 rounded-md focus:border-white/40 focus:outline-none transition-colors"
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex items-center justify-between pt-4">
            <div className="space-x-3">
              <button 
                className="px-4 py-2 border border-white/40 rounded-md hover:border-white/60 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-white text-black px-4 py-2 rounded-md hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={saving}
                onClick={saveCamera}
              >
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Camera"}
              </button>
            </div>
            
            {isEdit && onDelete && (
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" 
                onClick={handleDelete}
              >
                Delete Camera
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
