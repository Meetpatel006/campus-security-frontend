// lib/api-client.ts
// Utility functions for external API communication

const EXTERNAL_API_BASE = "https://gcet--campus-safety-fastapi-app-dev.modal.run"

export interface VideoUploadRequest {
  video_data: string // base64 encoded video with data URI prefix
  camera_id: number
  location: string
}

export interface VideoUploadResponse {
  video_id: string
  video_url: string
  blob_name: string
  message: string
}

export interface VideoDetectionRequest {
  video_url: string
  camera_id: number
  location: string
}

export interface VideoDetectionResponse {
  video_id: string
  camera_id: number
  is_anomaly: boolean
  detected_class: string
  confidence: number
  timestamp: string
  alerts_generated: Array<{
    alert_id: number
    type: string
    confidence: number
    frame_number: number
    timestamp: string
  }>
  video_url: string
  location: string
}

export interface FrameDetectionRequest {
  frame_data: string // base64 encoded image with data URI prefix
  camera_id: number
  location: string
  timestamp?: string
  videoLogId?: string
  frameTimeSec?: number
}

export interface FrameDetectionResponse {
  frameTimeSec: number
  timestamp: Date
  frame_data: string
  camera_id: string
  is_anomaly: boolean
  detected_class: string
  confidence: number
  external_api_response?: any
}

export interface CompleteVideoProcessingRequest {
  video_data: string
  camera_id: number
  location: string
}

export interface CompleteVideoProcessingResponse extends VideoDetectionResponse {
  upload_info: {
    blob_name: string
    video_id: string
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = EXTERNAL_API_BASE) {
    this.baseUrl = baseUrl
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    console.log(`🌐 Making API request to: ${url}`)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log(`📡 API response: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      console.error(`❌ API Error:`, errorData)
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log(`✅ API Success:`, result)
    return result
  }

  async uploadVideo(data: VideoUploadRequest): Promise<VideoUploadResponse> {
    return this.makeRequest<VideoUploadResponse>('/api/upload/video', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async detectVideo(data: VideoDetectionRequest): Promise<VideoDetectionResponse> {
    return this.makeRequest<VideoDetectionResponse>('/api/detect/video', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async detectFrame(data: FrameDetectionRequest): Promise<FrameDetectionResponse> {
    return this.makeRequest<FrameDetectionResponse>('/api/detect/frame', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async processVideoComplete(data: CompleteVideoProcessingRequest): Promise<CompleteVideoProcessingResponse> {
    return this.makeRequest<CompleteVideoProcessingResponse>('/api/process/video-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Export a default instance
export const apiClient = new ApiClient()

// Export the class for custom instances
export { ApiClient }

// Helper function to convert File to base64 data URI
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// Helper function to convert canvas frame to base64 data URI
export function canvasToBase64(canvas: HTMLCanvasElement, mimeType: string = 'image/jpeg', quality: number = 0.8): string {
  return canvas.toDataURL(mimeType, quality)
}

// Helper function to convert video frame to base64
export function captureVideoFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvasToBase64(canvas)
}

// Detection classes as defined in the API documentation
export const DETECTION_CLASSES = [
  'Abuse',
  'Arrest',
  'Arson',
  'Assault',
  'Burglary',
  'Explosion',
  'Fighting',
  'Normal_Videos_for_Event_Recognition',
  'RoadAccidents',
  'Robbery',
  'Shooting',
  'Shoplifting',
  'Stealing',
  'Vandalism',
] as const

export type DetectionClass = typeof DETECTION_CLASSES[number]
