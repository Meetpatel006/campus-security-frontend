// components/camera-grid.tsx
"use client"

import useSWR from "swr"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useCameraContext } from "./camera-provider"
import { captureVideoFrame } from "@/lib/api-client"
import { Video, VideoOff, ScreenShare } from "lucide-react"
import { useRouter } from "next/navigation"

type Camera = {
  _id: string
  name: string
  streamUrl: string
  location: string
  status: string
  lastSeen?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((data) => data.cameras || [])

function LocalDeviceFeed({ camera }: { camera: Camera }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [lastDetection, setLastDetection] = useState<any>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          // Start detection after video is playing
          startDetection()
        }
      } catch (e) {
        console.error(e)
      }
    }
    start()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
      stopDetection()
    }
  }, [])

  const startDetection = () => {
    if (detectionIntervalRef.current || !videoRef.current) return
    
    setIsDetecting(true)
    // Capture and analyze frames every 5 seconds
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return
      
      try {
        const frameData = captureVideoFrame(videoRef.current)
        console.log(`📸 Capturing frame for camera ${camera._id}`)
        
        const response = await fetch('/api/detect/frame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            camera_id: camera._id,
            frame_data: frameData,
            timestamp: new Date().toISOString(),
            frameTimeSec: videoRef.current.currentTime
          })
        })
        
        if (response.ok) {
          const detection = await response.json()
          setLastDetection(detection)
          console.log(`🔍 Detection result:`, detection)
          
          if (detection.is_anomaly) {
            console.warn(`⚠️ ANOMALY DETECTED: ${detection.detected_class} (${Math.round(detection.confidence * 100)}%)`)
          }
        }
      } catch (error) {
        console.error('Frame detection failed:', error)
      }
    }, 5000) // Check every 5 seconds
  }

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
      setIsDetecting(false)
    }
  }

  const toggleDetection = () => {
    if (isDetecting) {
      stopDetection()
    } else {
      startDetection()
    }
  }

  return (
    <div className="relative border border-white/20">
      <video ref={videoRef} className="w-full h-auto" muted playsInline />
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          size="sm"
          variant={isDetecting ? "destructive" : "default"}
          onClick={toggleDetection}
          className="text-xs"
        >
          {isDetecting ? "🔴 Stop" : "▶️ Detect"}
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-white">
        <div className="flex justify-between items-center">
          <span>Live Detection: {isDetecting ? "ON" : "OFF"}</span>
          {lastDetection && (
            <span className={lastDetection.is_anomaly ? "text-red-400" : "text-green-400"}>
              {lastDetection.detected_class} ({Math.round(lastDetection.confidence * 100)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function StreamVideoFeed({ camera }: { camera: Camera }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [lastDetection, setLastDetection] = useState<any>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startDetection = () => {
    if (detectionIntervalRef.current || !videoRef.current) return
    
    setIsDetecting(true)
    // Capture and analyze frames every 10 seconds for stream videos
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return
      
      try {
        const frameData = captureVideoFrame(videoRef.current)
        console.log(`📸 Capturing frame for stream camera ${camera._id}`)
        
        const response = await fetch('/api/detect/frame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            camera_id: camera._id,
            frame_data: frameData,
            timestamp: new Date().toISOString(),
            frameTimeSec: videoRef.current.currentTime
          })
        })
        
        if (response.ok) {
          const detection = await response.json()
          setLastDetection(detection)
          console.log(`🔍 Stream detection result:`, detection)
          
          if (detection.is_anomaly) {
            console.warn(`⚠️ STREAM ANOMALY DETECTED: ${detection.detected_class} (${Math.round(detection.confidence * 100)}%)`)
          }
        }
      } catch (error) {
        console.error('Stream frame detection failed:', error)
      }
    }, 10000) // Check every 10 seconds for streams
  }

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
      setIsDetecting(false)
    }
  }

  const toggleDetection = () => {
    if (isDetecting) {
      stopDetection()
    } else {
      startDetection()
    }
  }

  useEffect(() => {
    return () => stopDetection()
  }, [])

  return (
    <div className="relative">
      <video 
        ref={videoRef}
        src={camera.streamUrl} 
        className="w-full h-auto" 
        controls
        onLoadedData={() => {
          // Auto-start detection when video loads
          if (videoRef.current && videoRef.current.readyState >= 2) {
            startDetection()
          }
        }}
      />
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          size="sm"
          variant={isDetecting ? "destructive" : "default"}
          onClick={toggleDetection}
          className="text-xs"
        >
          {isDetecting ? "🔴 Stop" : "▶️ Detect"}
        </Button>
      </div>
      {lastDetection && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-white">
          <div className="flex justify-between items-center">
            <span>Detection: {isDetecting ? "ON" : "OFF"}</span>
            <span className={lastDetection.is_anomaly ? "text-red-400" : "text-green-400"}>
              {lastDetection.detected_class} ({Math.round(lastDetection.confidence * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function ScreenShareCard() {
  const { isScreenSharing, toggleScreenShare } = useCameraContext()
  
  return (
    <div className="relative group bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-700 hover:border-blue-500 transition-colors h-64 flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gray-900/50">
        <div className="text-center p-4">
          <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
            <ScreenShare className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Screen Share</h3>
          <p className="text-sm text-gray-400 mt-1">Share your screen with the team</p>
        </div>
      </div>
      <div className="p-4 bg-gray-800/50 border-t border-gray-700">
        <Button
          onClick={toggleScreenShare}
          className={`w-full ${isScreenSharing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isScreenSharing ? (
            <>
              <VideoOff className="w-4 h-4 mr-2" />
              Stop Sharing
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Start Screen Share
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function CameraCard({ cam }: { cam: Camera }) {
  const { editCamera } = useCameraContext()
  const [status, setStatus] = useState<string>(cam.status || "unknown")

  useEffect(() => setStatus(cam.status || "unknown"), [cam.status])

  async function heartbeat() {
    try {
      await fetch(`/api/cameras/${cam._id}/heartbeat`, { method: "POST" })
    } catch {}
  }

  const isLocal = cam.streamUrl === "local-device"

  useEffect(() => {
    if (!isLocal) return
    const id = setInterval(() => heartbeat(), 20_000)
    return () => clearInterval(id)
  }, [isLocal])

  return (
    <div className="relative border border-white/30">
      <div className="p-2 flex items-center justify-between border-b border-white/10">
        <div>
          <div className="font-semibold">{cam.name}</div>
          <div className="text-xs text-white/60">{cam.location}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-xs">
              <span
                className={`inline-block h-2 w-2 rounded-full ${status === "active" ? "bg-white" : "border border-white"}`}
                aria-hidden="true"
              />
              <span className="text-white/70">{status === "active" ? "Online" : "Offline"}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => editCamera(cam)}>
              Edit
            </Button>
          </div>
        </div>
      </div>
      <div className="relative">
        {isLocal ? (
          <LocalDeviceFeed camera={cam} />
        ) : (
          <StreamVideoFeed camera={cam} />
        )}
      </div>
    </div>
  )
}

export default function CameraGrid() {
  const { data, error, isLoading, mutate } = useSWR<Camera[]>("/api/cameras", fetcher)
  const { editCamera, isScreenSharing } = useCameraContext()
  
  // Listen for camera refresh events
  useEffect(() => {
    const handleRefresh = () => {
      mutate() // This will refetch the data
    }
    
    window.addEventListener('cameras:refresh', handleRefresh)
    return () => window.removeEventListener('cameras:refresh', handleRefresh)
  }, [mutate])
  
  // Ensure cameras is always an array
  const cameras = Array.isArray(data) ? data : []

  if (error) {
    return (
      <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
        Error loading cameras: {error.message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900/50 rounded-lg overflow-hidden h-64 animate-pulse">
            <div className="h-full w-full bg-gray-800/50" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cameras.map((camera) => (
        <CameraCard key={camera._id} cam={camera} />
      ))}
      <ScreenShareCard />
      {cameras.length === 0 && <p className="text-white/60">No cameras yet. Add one to get started.</p>}
    </div>
  )
}
