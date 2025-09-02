// app/api/process/video-complete/route.ts
// Complete video processing workflow - upload and analyze

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"
import { apiClient } from "@/lib/api-client"

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  console.log("🎥 Processing complete video workflow...")

  try {
    const body = await req.json()
    const { video_data, camera_id, location } = body

    if (!video_data || !camera_id) {
      return NextResponse.json({ detail: "video_data and camera_id required" }, { status: 400 })
    }

    console.log(`📹 Video data size: ${video_data.length} chars, Camera ID: ${camera_id}`)

    const { cameras, logs, alerts } = await getDb()
    
    // Verify camera ownership
    const cam = await cameras.findOne({ _id: new ObjectId(camera_id), ownerId: user._id })
    if (!cam) return NextResponse.json({ detail: "Camera not found" }, { status: 404 })

    console.log(`🎯 Calling external API for complete processing...`)

    // Call external API for complete video processing
    const result = await apiClient.processVideoComplete({
      video_data,
      camera_id: parseInt(camera_id),
      location: location || cam.location || "Unknown"
    })

    console.log(`✅ External API response: ${result.is_anomaly ? 'ANOMALY' : 'NORMAL'} - ${result.detected_class}`)

    // Store results in database
    const logEntry = {
      cameraId: cam._id,
      userId: user._id,
      type: "video_upload" as const,
      timestamp: new Date(),
      status: "new" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        videoUrl: result.video_url,
        detected_class: result.detected_class,
        is_anomaly: result.is_anomaly,
        confidence: result.confidence
      },
      detections: [{
        is_anomaly: result.is_anomaly,
        detected_class: result.detected_class,
        confidence: result.confidence,
        timestamp: new Date(result.timestamp)
      }],
      frames: [],
      videoUrl: result.video_url,
      snapshotUrl: null,
      resolved: false,
      externalVideoId: result.video_id
    }

    const logResult = await logs.insertOne(logEntry as any)

    // Create alerts if anomaly detected
    if (result.is_anomaly && result.alerts_generated) {
      const alertPromises = result.alerts_generated.map((alert: any) => 
        alerts.insertOne({
          cameraId: cam._id,
          userId: user._id,
          type: alert.type,
          confidence: alert.confidence,
          frameNumber: alert.frame_number,
          timestamp: new Date(alert.timestamp),
          resolved: false,
          logId: logResult.insertedId,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any)
      )
      await Promise.all(alertPromises)
    }

    return NextResponse.json({
      ...result,
      logId: logResult.insertedId.toString()
    })

  } catch (error) {
    console.error("Complete video processing error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
