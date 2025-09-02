// app/api/detect/frame/route.ts
// Handle individual frame detection

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"
import { sendAnomalyAlert } from "@/lib/email"

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
    
    // Handle screen sharing case or verify camera ownership
    let cam = null;
    if (camera_id === 'screen-share-default') {
      // For screen sharing, create a virtual camera object
      cam = {
        _id: 'screen-share-default',
        name: 'Screen Share',
        type: 'screen-share',
        location: 'Screen Capture',
        ownerId: user._id
      };
    } else {
      // Verify camera ownership for regular cameras
      cam = await cameras.findOne({ _id: new ObjectId(camera_id), ownerId: user._id })
      if (!cam) return NextResponse.json({ detail: "Camera not found" }, { status: 404 })
    }

    // Call external ML API for frame detection
    let detectionResult
    try {
      console.log(`🔍 Sending frame to external ML API: ${EXTERNAL_API_BASE}/api/detect/frame`)
      
      // Convert MongoDB ObjectId to integer for external API
      const numericCameraId = parseInt(camera_id.replace(/[^0-9]/g, '').slice(-6)) || 1
      
      const requestPayload = {
        camera_id: numericCameraId,
        frame_data: frame_data,
        timestamp: timestamp || new Date().toISOString()
      }
      
      console.log(`📤 Request payload:`, {
        camera_id: requestPayload.camera_id,
        frame_data: frame_data.substring(0, 50) + '...',
        timestamp: requestPayload.timestamp
      })
      
      const response = await fetch(`${EXTERNAL_API_BASE}/api/detect/frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error(`❌ External API Error:`, errorData)
        throw new Error(`External API error: ${response.status} - ${errorData.detail || 'Unknown error'}`)
      }

      detectionResult = await response.json()
      console.log(`✅ External API Success:`, detectionResult)
      
    } catch (apiError) {
      console.error("External API call failed:", apiError)
      
      // Fallback to mock detection if external API fails
      detectionResult = {
        camera_id: parseInt(camera_id.replace(/[^0-9]/g, '').slice(-6)) || 1,
        is_anomaly: false,
        detected_class: "Normal",
        confidence: 0.5,
        timestamp: new Date().toISOString(),
        details: {
          final_confidence: 0.5,
          processing_time: 0,
          model_version: "fallback"
        },
        error: "External API unavailable - using fallback"
      }
    }

    const detection = {
      frameTimeSec: frameTimeSec || 0,
      timestamp: new Date(detectionResult.timestamp || timestamp || Date.now()),
      frame_data: frame_data,
      camera_id: camera_id, // Keep original MongoDB ObjectId for internal use
      is_anomaly: detectionResult.is_anomaly || false,
      detected_class: detectionResult.detected_class || "Normal",
      confidence: detectionResult.confidence || 0.5,
      external_api_response: detectionResult
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

    // Log detection for analytics and send email alert
    if (detection.is_anomaly) {
      const logResult = await logs.insertOne({
        type: 'anomaly',
        cameraId: new ObjectId(camera_id),
        userId: user._id,
        timestamp: detection.timestamp,
        detections: [{
          is_anomaly: detection.is_anomaly,
          detected_class: detection.detected_class,
          label: detection.detected_class,
          confidence: detection.confidence,
          severity: "high",
          timestamp: detection.timestamp
        }],
        severity: "high",
        data: {
          detected_class: detection.detected_class,
          confidence: detection.confidence,
          description: `Frame anomaly detected: ${detection.detected_class}`
        },
        status: 'new',
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Send email alert
      try {
        await sendAnomalyAlert(user._id.toString(), {
          cameraName: cam.name || 'Unknown Camera',
          location: cam.location || 'Unknown Location',
          timestamp: detection.timestamp,
          description: `Frame anomaly detected: ${detection.detected_class}`
        })
      } catch (emailError) {
        console.error("Failed to send anomaly alert email:", emailError)
      }
    }

    return NextResponse.json(detection)
    
  } catch (error) {
    console.error("Frame detection error:", error)
    return NextResponse.json({ 
      detail: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
