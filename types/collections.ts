// types/collections.ts
// Collection types for MongoDB

import { ObjectId } from "mongodb"

export interface UserDocument {
  _id: ObjectId
  email: string
  hashedPassword: string
  name: string
  role: "admin" | "user"
  createdAt: Date
  updatedAt: Date
}

export interface CameraDocument {
  _id: ObjectId
  name: string
  location: string
  ownerId: ObjectId
  status: "active" | "inactive"
  lastUpdate: Date
  createdAt: Date
  updatedAt: Date
}

export interface LogDocument {
  _id: ObjectId
  cameraId: ObjectId
  userId: ObjectId
  type: "motion" | "anomaly" | "alert" | "video_upload"
  timestamp: Date
  data: {
    confidence?: number
    description?: string
    imageUrl?: string
    videoUrl?: string
    detected_class?: string
    is_anomaly?: boolean
  }
  status: "new" | "reviewed" | "archived"
  reviewedBy?: ObjectId
  createdAt: Date
  updatedAt: Date
  // Additional fields for video processing
  detections?: Array<{
    is_anomaly: boolean
    detected_class: string
    confidence: number
    timestamp: Date
  }>
  frames?: Array<{
    timestamp: Date
    frameTimeSec: number
    is_anomaly: boolean
    detected_class: string
    confidence: number
  }>
  videoUrl?: string
  snapshotUrl?: string | null
  resolved?: boolean
  externalVideoId?: string
}

export interface AlertDocument {
  _id: ObjectId
  cameraId: ObjectId
  userId: ObjectId
  type: string
  confidence: number
  frameNumber?: number
  timestamp: Date
  resolved: boolean
  logId?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Collections {
  users: UserDocument
  cameras: CameraDocument
  logs: LogDocument
  alerts: AlertDocument
}
