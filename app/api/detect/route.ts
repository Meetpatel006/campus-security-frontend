// app/api/detect/route.ts
// Handle frame detection and video processing

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"

const EXTERNAL_API_BASE = "https://gcet--campus-safety-fastapi-app-dev.modal.run"

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { camera_id, frame_data, timestamp, videoLogId, frameTimeSec } = body

    if (!camera_id || !frame_data) {
      return NextResponse.json({ detail: "camera_id and frame_data required" }, { status: 400 })
    }

    const { cameras, logs } = await getDb()
    
    // Verify camera ownership
    const cam = await cameras.findOne({ _id: new ObjectId(camera_id), ownerId: user._id })
    if (!cam) return NextResponse.json({ detail: "Camera not found" }, { status: 404 })

    // For frame analysis, we'll store the detection result in the database
    // In a real scenario, you might want to batch these or process differently
    
    // For now, let's just store the frame data and return a mock detection
    // You would replace this with actual API call to your ML service
    
    const detection = {
      frameTimeSec: frameTimeSec || 0,
      timestamp: new Date(timestamp || Date.now()),
      frame_data: frame_data,
      camera_id: camera_id,
      // Mock detection result - replace with actual API call
      is_anomaly: Math.random() > 0.8, // 20% chance of anomaly for demo
      detected_class: "Normal",
      confidence: 0.95
    }

    // Update the log entry if videoLogId is provided
    if (videoLogId) {
      await logs.updateOne(
        { _id: new ObjectId(videoLogId) },
        { 
          $push: { 
            frames: {
              timestamp: detection.timestamp,
              frameTimeSec: detection.frameTimeSec,
              is_anomaly: detection.is_anomaly,
              detected_class: detection.detected_class,
              confidence: detection.confidence
            }
          }
        }
      )
    }

    return NextResponse.json(detection)
  } catch (error) {
    console.error("Detection error:", error)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
