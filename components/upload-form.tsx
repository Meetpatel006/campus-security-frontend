// components/upload-form.tsx
"use client"

import type React from "react"

import useSWR from "swr"
import { useState } from "react"
import { apiClient, fileToBase64 } from "@/lib/api-client"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UploadForm() {
  const [cameraId, setCameraId] = useState<string>("1") // Default camera ID
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoLogId, setVideoLogId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [progress, setProgress] = useState<string>("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cameraId || !file) return
    
    setStatus("Processing video...")
    try {
      // Convert file to base64
      const base64Data = await fileToBase64(file)
      
      // Use the complete video processing workflow from api-client
      const result = await apiClient.processVideoComplete({
        video_data: base64Data,
        camera_id: parseInt(cameraId),
        location: "Upload Form" // You might want to get this from camera data
      })
      
      setStatus("Upload and analysis completed")
      setVideoUrl(result.video_url)
      setVideoLogId(result.video_id)
      
      // Store analysis results for display
      setProgress(`Analysis complete: ${result.detected_class} (${(result.confidence * 100).toFixed(1)}% confidence)`)
      
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    }
  }

  async function analyzeVideo(stepSec = 1) {
    if (!videoUrl || !videoLogId || !cameraId) return
    setAnalyzing(true)
    setProgress("Re-analyzing uploaded video...")

    try {
      // Since the video is already processed, we can trigger additional analysis
      // using the video URL from the previous upload
      const result = await apiClient.detectVideo({
        video_url: videoUrl,
        camera_id: parseInt(cameraId),
        location: "Upload Form Re-analysis"
      })
      
      setProgress(`Re-analysis complete: ${result.detected_class} (${(result.confidence * 100).toFixed(1)}% confidence)`)
      
    } catch (error: any) {
      setProgress(`Re-analysis failed: ${error.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-white/20 p-4 flex flex-col gap-3">
      <div className="flex gap-3">
        <input
          type="file"
          accept="video/mp4,video/webm"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="bg-black text-white"
        />
      </div>
      <button className="self-start border border-white px-3 py-1 hover:bg-white hover:text-black">Upload</button>
      {status && <p className="text-white/70">{status}</p>}

      {videoUrl && (
        <div className="mt-3 flex flex-col gap-3">
          <video className="w-full max-w-xl border border-white/20" src={videoUrl} controls crossOrigin="anonymous" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border border-white px-3 py-1 hover:bg-white hover:text-black disabled:opacity-50"
              onClick={() => analyzeVideo(1)}
              disabled={analyzing}
            >
              {analyzing ? "Re-analyzing..." : "Re-analyze Video"}
            </button>
            <button
              type="button"
              className="border border-white px-3 py-1 hover:bg-white hover:text-black disabled:opacity-50"
              onClick={() => setAnalyzing(false)}
              disabled={!analyzing}
            >
              Stop
            </button>
            {progress && <span className="text-sm text-white/70">{progress}</span>}
          </div>
        </div>
      )}
    </form>
  )
}
