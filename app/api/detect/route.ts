// app/api/detect/route.ts
// Handle frame detection and video processing

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"
import { apiClient } from "@/lib/api-client"

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

    // For frame analysis, call the real external API
    console.log(`🎯 Calling external API for frame detection...`)
    
    let detection: any
    
    try {
      // Call external API for frame detection
      const apiResult = await apiClient.detectFrame({
        frame_data,
        camera_id: parseInt(camera_id),
        location: cam.location || "Unknown",
        timestamp,
        videoLogId,
        frameTimeSec
      })

      console.log(`✅ External API response: ${apiResult.is_anomaly ? 'ANOMALY' : 'NORMAL'} - ${apiResult.detected_class}`)

      // Map API response to our format
      const severity: "low" | "medium" | "high" | "critical" = apiResult.is_anomaly 
        ? (apiResult.confidence > 0.8 ? "high" : "medium") 
        : "low"
      
      detection = {
        frameTimeSec: apiResult.frameTimeSec || frameTimeSec || 0,
        timestamp: new Date(timestamp || Date.now()),
        frame_data: frame_data,
        camera_id: camera_id,
        is_anomaly: apiResult.is_anomaly,
        detected_class: apiResult.detected_class,
        label: apiResult.detected_class,
        confidence: apiResult.confidence,
        severity: severity,
        external_api_response: apiResult.external_api_response
      }

    } catch (apiError) {
      console.error("External API error, falling back to mock detection:", apiError)
      
      // Fallback to mock detection if API fails
      const isAnomaly = Math.random() > 0.8 // 20% chance of anomaly for demo
      const detectedClass = isAnomaly ? "Suspicious Activity" : "Normal"
      const confidence = 0.85 + Math.random() * 0.15 // 0.85-1.0
      const severity: "low" | "medium" | "high" | "critical" = isAnomaly 
        ? (confidence > 0.9 ? "high" : "medium") 
        : "low"
      
      detection = {
        frameTimeSec: frameTimeSec || 0,
        timestamp: new Date(timestamp || Date.now()),
        frame_data: frame_data,
        camera_id: camera_id,
        is_anomaly: isAnomaly,
        detected_class: detectedClass,
        label: detectedClass,
        confidence: confidence,
        severity: severity,
        fallback: true,
        error: apiError instanceof Error ? apiError.message : "API Error"
      }
    }

    // Update the log entry if videoLogId is provided, otherwise create a new detection log
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
              label: detection.label,
              confidence: detection.confidence,
              severity: detection.severity
            }
          },
          $set: {
            updatedAt: new Date(),
            // Update main detection if this frame has higher confidence
            ...(detection.is_anomaly && {
              detections: [{
                label: detection.label,
                detected_class: detection.detected_class,
                confidence: detection.confidence,
                severity: detection.severity,
                timestamp: detection.timestamp,
                is_anomaly: detection.is_anomaly
              }],
              severity: detection.severity
            })
          }
        }
      )
    } else {
      // Create a new standalone detection log
      const newLogEntry = {
        cameraId: cam._id,
        userId: user._id,
        type: "anomaly" as const,
        timestamp: detection.timestamp,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "new" as const,
        severity: detection.severity,
        resolved: false,
        detections: [{
          label: detection.label,
          detected_class: detection.detected_class,
          confidence: detection.confidence,
          severity: detection.severity,
          timestamp: detection.timestamp,
          is_anomaly: detection.is_anomaly
        }],
        frames: [{
          timestamp: detection.timestamp,
          frameTimeSec: detection.frameTimeSec,
          is_anomaly: detection.is_anomaly,
          detected_class: detection.detected_class,
          label: detection.label,
          confidence: detection.confidence,
          severity: detection.severity
        }],
        data: {
          detected_class: detection.detected_class,
          is_anomaly: detection.is_anomaly,
          confidence: detection.confidence,
          description: `Frame detection: ${detection.label}`
        },
        videoUrl: null,
        snapshotUrl: null
      }

      const logResult = await logs.insertOne(newLogEntry as any)
      detection.logId = logResult.insertedId.toString()
    }

    return NextResponse.json(detection)
  } catch (error) {
    console.error("Detection error:", error)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
