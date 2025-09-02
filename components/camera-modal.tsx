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
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-900 border border-white/20 rounded-lg p-6 w-[480px] max-w-full">
        <div className="text-lg font-medium mb-4">{isEdit ? 'Edit' : 'Add'} Camera</div>
        <div className="space-y-4">
          <div>
            <div className="mb-1">Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Entrance"
              className="w-full bg-black/50 border border-white/20 px-3 py-1 rounded-lg"
            />
          </div>
          <div>
            <div className="mb-1">Stream URL (optional)</div>
            <input
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="rtsp:// or leave empty for local device"
              className="w-full bg-black/50 border border-white/20 px-3 py-1 rounded-lg"
            />
          </div>
          <div>
            <div className="mb-1">Location</div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Building A, Floor 1"
              className="w-full bg-black/50 border border-white/20 px-3 py-1 rounded-lg"
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex items-center justify-between pt-4">
            <div className="space-x-2">
              <button className="px-3 py-1 border border-white/40" onClick={onClose}>
                Cancel
              </button>
              <button
                className="bg-white text-black px-3 py-1 hover:bg-white/90 disabled:opacity-50"
                disabled={saving}
                onClick={saveCamera}
              >
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Camera"}
              </button>
            </div>
            
            {isEdit && onDelete && (
              <button 
                className="px-3 py-1 bg-red-600 text-white hover:bg-red-700" 
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
