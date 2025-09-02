// components/camera-grid.tsx
"use client"

import useSWR from "swr"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useCameraContext } from "./camera-provider"
import { captureVideoFrame } from "@/lib/api-client"
import { Video, VideoOff, ScreenShare, Eye, EyeOff } from "lucide-react"
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
    <div className="relative bg-black min-h-48">
      <video ref={videoRef} className="w-full h-auto object-contain" muted playsInline />
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          size="sm"
          variant={isDetecting ? "destructive" : "default"}
          onClick={toggleDetection}
          className="text-xs h-7 px-2 bg-black/60 hover:bg-black/80 border-gray-600"
        >
          {isDetecting ? "🔴 Stop" : "▶️ Detect"}
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-xs text-white">
        <div className="flex justify-between items-center">
          <span className="font-medium">Live Detection: <span className={isDetecting ? "text-green-400" : "text-gray-400"}>{isDetecting ? "ON" : "OFF"}</span></span>
          {lastDetection && (
            <span className={`font-medium ${lastDetection.is_anomaly ? "text-red-400" : "text-green-400"}`}>
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
    <div className="relative bg-black min-h-48">
      <video 
        ref={videoRef}
        src={camera.streamUrl} 
        className="w-full h-auto object-contain" 
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
          className="text-xs h-7 px-2 bg-black/60 hover:bg-black/80 border-gray-600"
        >
          {isDetecting ? "🔴 Stop" : "▶️ Detect"}
        </Button>
      </div>
      {lastDetection && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-xs text-white">
          <div className="flex justify-between items-center">
            <span className="font-medium">Detection: <span className={isDetecting ? "text-green-400" : "text-gray-400"}>{isDetecting ? "ON" : "OFF"}</span></span>
            <span className={`font-medium ${lastDetection.is_anomaly ? "text-red-400" : "text-green-400"}`}>
              {lastDetection.detected_class} ({Math.round(lastDetection.confidence * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function ScreenShareCard() {
  const { isScreenSharing, toggleScreenShare, screenStream } = useCameraContext()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null)
  const [lastDetection, setLastDetection] = useState<any>(null)
  
  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream
      videoRef.current.play().catch(console.error)
    }
  }, [screenStream])

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const sendFrameForDetection = async () => {
    try {
      const frameData = await captureFrame();
      if (!frameData) return;

      // Use a default camera ID for screen sharing
      const response = await fetch('/api/detect/frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera_id: 'screen-share-default',
          frame_data: frameData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastDetection(result);
        console.log('Detection result:', result);
      } else {
        console.error('Detection failed:', response.status);
      }
    } catch (error) {
      console.error('Error sending frame for detection:', error);
    }
  };

  const startDetection = () => {
    if (detectionInterval) return;
    
    setIsDetecting(true);
    // Send a frame every 2 seconds for detection
    const interval = setInterval(sendFrameForDetection, 2000);
    setDetectionInterval(interval);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    setIsDetecting(false);
    setLastDetection(null);
  };

  const handleStopSharing = () => {
    stopDetection();
    toggleScreenShare();
  };

  useEffect(() => {
    return () => {
      stopDetection(); // Clean up detection interval
    };
  }, [detectionInterval]);
  
  return (
    <div className="relative group bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-700 hover:border-blue-500 transition-colors min-h-64 flex flex-col">
      {isScreenSharing && screenStream ? (
        <div className="relative flex-1 bg-black">
          {/* Header with title and status */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
                <span className="text-white font-medium text-sm">Screen Share</span>
              </div>
              <ScreenShare className="w-4 h-4 text-white/70" />
            </div>
          </div>
          
          {/* Detection status overlay */}
          {lastDetection && (
            <div className="absolute top-16 left-3 bg-black/70 text-white p-2 rounded-lg text-sm z-20">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${lastDetection.is_anomaly ? 'bg-red-500' : 'bg-green-500'}`} />
                <span>{lastDetection.detected_class}</span>
                <span className="text-gray-300">({(lastDetection.confidence * 100).toFixed(1)}%)</span>
              </div>
            </div>
          )}

          {/* Video content */}
          <div className="relative w-full h-full min-h-48">
            <video 
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              autoPlay
              muted
              playsInline
            />
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Bottom controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex gap-2">
              <Button
                onClick={isDetecting ? stopDetection : startDetection}
                size="sm"
                className={`${
                  isDetecting 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white border-none`}
              >
                {isDetecting ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Detecting
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Start Detection
                  </>
                )}
              </Button>
              <Button
                onClick={handleStopSharing}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white border-none"
              >
                <VideoOff className="w-4 h-4 mr-2" />
                Stop Sharing
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center bg-gray-900/50 p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                <ScreenShare className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Screen Share</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Share your screen with the team for real-time collaboration</p>
            </div>
          </div>
          <div className="p-4 bg-gray-800/50 border-t border-gray-700">
            <Button
              onClick={toggleScreenShare}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none transition-colors"
            >
              <Video className="w-4 h-4 mr-2" />
              Start Screen Share
            </Button>
          </div>
        </>
      )}
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
    <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="p-3 flex items-center justify-between bg-gray-800/50 border-b border-gray-700">
        <div className="flex-1">
          <div className="font-semibold text-white text-sm">{cam.name}</div>
          <div className="text-xs text-gray-400">{cam.location}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  status === "active" 
                    ? "bg-green-400 shadow-green-400/50 shadow-sm" 
                    : "bg-gray-500"
                }`}
                aria-hidden="true"
              />
              <span className={`font-medium ${status === "active" ? "text-green-400" : "text-gray-400"}`}>
                {status === "active" ? "Online" : "Offline"}
              </span>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => editCamera(cam)}
              className="h-7 px-2 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Edit
            </Button>
          </div>
        </div>
      </div>
      <div className="relative bg-black">
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
  const { editCamera, isScreenSharing, screenStream } = useCameraContext()
  
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
