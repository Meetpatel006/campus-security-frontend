// components/video-upload-form.tsx
"use client"

import type React from "react"
import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { apiClient, fileToBase64, type VideoUploadResponse, type VideoDetectionResponse, type CompleteVideoProcessingResponse } from "@/lib/api-client"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function VideoUploadForm() {
  const [cameraId, setCameraId] = useState<string>("1") // Default camera ID
  const [file, setFile] = useState<File | null>(null)
  const [location, setLocation] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [processing, setProcessing] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [result, setResult] = useState<VideoUploadResponse | VideoDetectionResponse | CompleteVideoProcessingResponse | null>(null)
  const [error, setError] = useState<string>("")

  // Upload video to Azure Blob Storage only
  async function uploadVideo(e: React.FormEvent) {
    e.preventDefault()
    if (!cameraId || !file) {
      setError("Please select a camera and file")
      return
    }

    setProcessing(true)
    setError("")
    setResult(null)
    setProgress(10)

    try {
      setStatus("Converting video to base64...")
      const base64 = await fileToBase64(file)
      setProgress(30)

      setStatus("Uploading to Azure Blob Storage...")
      const uploadResult = await apiClient.uploadVideo({
        video_data: base64,
        camera_id: parseInt(cameraId),
        location: location || "Default Location"
      })

      setProgress(100)
      setStatus("Video uploaded successfully!")
      setResult(uploadResult)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setProcessing(false)
    }
  }

  // Process video from uploaded URL
  async function processVideo() {
    if (!result?.video_url) return

    setProcessing(true)
    setError("")
    setProgress(0)

    try {
      setStatus("Processing video for anomaly detection...")
      setProgress(20)

      const processResult = await apiClient.detectVideo({
        video_url: result.video_url,
        camera_id: parseInt(cameraId),
        location: location || "Unknown Location"
      })

      setProgress(100)
      setStatus("Video processed successfully!")
      setResult({ ...result, ...processResult })

    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setProcessing(false)
    }
  }

  // Complete workflow - upload and process in one step
  async function uploadAndProcess(e: React.FormEvent) {
    e.preventDefault()
    if (!cameraId || !file) {
      setError("Please select a camera and file")
      return
    }

    setProcessing(true)
    setError("")
    setResult(null)
    setProgress(10)

    try {
      setStatus("Converting video to base64...")
      const base64 = await fileToBase64(file)
      setProgress(30)

      setStatus("Uploading and processing video...")
      const completeResult = await apiClient.processVideoComplete({
        video_data: base64,
        camera_id: parseInt(cameraId),
        location: location || "Unknown Location"
      })

      setProgress(100)
      setStatus("Video uploaded and processed successfully!")
      setResult(completeResult)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Upload & Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                <Input
                  placeholder="Override camera location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Video File</label>
              <Input
                type="file"
                accept="video/mp4,video/webm,video/avi"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                type="button"
                onClick={uploadVideo}
                disabled={processing || !cameraId || !file}
              >
                Upload Only
              </Button>
              
              <Button 
                type="button"
                onClick={uploadAndProcess}
                disabled={processing || !cameraId || !file}
                variant="default"
              >
                Upload & Analyze
              </Button>
              
              {result?.video_url && !('is_anomaly' in result) && (
                <Button 
                  type="button"
                  onClick={processVideo}
                  disabled={processing}
                  variant="outline"
                >
                  Analyze Uploaded Video
                </Button>
              )}
            </div>
          </form>

          {processing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Results
                  {'is_anomaly' in result && (
                    <Badge variant={result.is_anomaly ? "destructive" : "default"}>
                      {result.is_anomaly ? "Anomaly Detected" : "Normal"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.video_url && (
                  <div>
                    <h4 className="font-medium mb-2">Video</h4>
                    <video 
                      src={result.video_url} 
                      controls 
                      className="w-full max-w-md border rounded"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {result.video_id && (
                    <div>
                      <strong>Video ID:</strong> {result.video_id}
                    </div>
                  )}
                  
                  {'detected_class' in result && result.detected_class && (
                    <div>
                      <strong>Detected Class:</strong> {result.detected_class}
                    </div>
                  )}
                  
                  {'confidence' in result && result.confidence && (
                    <div>
                      <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                  
                  {'timestamp' in result && result.timestamp && (
                    <div>
                      <strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>

                {'alerts_generated' in result && result.alerts_generated && result.alerts_generated.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Alerts Generated</h4>
                    <div className="space-y-2">
                      {result.alerts_generated.map((alert, index: number) => (
                        <div key={index} className="p-2 border rounded text-sm">
                          <div><strong>Type:</strong> {alert.type}</div>
                          <div><strong>Confidence:</strong> {(alert.confidence * 100).toFixed(1)}%</div>
                          {alert.frame_number && (
                            <div><strong>Frame:</strong> {alert.frame_number}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
