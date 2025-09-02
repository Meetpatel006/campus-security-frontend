// components/camera-modal.tsx
"use client"

import { useEffect, useState } from "react"

export default function CameraModal() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [streamUrl, setStreamUrl] = useState("")
  const [location, setLocation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function addCamera() {
    setSaving(true)
    setError(null)
    const body: any = { name, streamUrl: streamUrl || "local-device", location }
    const res = await fetch("/api/cameras", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.detail ? JSON.stringify(data.detail) : "Failed to add camera")
      return
    }
    setOpen(false)
    setName("")
    setStreamUrl("")
    setLocation("")
    window.dispatchEvent(new CustomEvent("cameras:refresh"))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <button className="border border-white px-3 py-1 hover:bg-white hover:text-black" onClick={() => setOpen(true)}>
        Add Camera
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-6 w-[480px] max-w-full">
            <div className="text-lg font-medium mb-4">Add Camera</div>
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
              <div className="flex items-center justify-end space-x-2 pt-4">
                <button className="px-3 py-1 border border-white/40" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  className="bg-white text-black px-3 py-1 hover:bg-white/90 disabled:opacity-50"
                  disabled={saving}
                  onClick={addCamera}
                >
                  {saving ? "Adding..." : "Add Camera"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
