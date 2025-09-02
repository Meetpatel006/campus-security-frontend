// app/api/upload/video/route.ts
// Upload video to Azure Blob Storage via external API

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"
import { apiClient } from "@/lib/api-client"

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  console.log("🎥 Uploading video to Azure...")

  try {
    const body = await req.json()
    const { video_data, camera_id, location } = body

    if (!video_data || !camera_id) {
      return NextResponse.json({ detail: "video_data and camera_id required" }, { status: 400 })
    }

    console.log(`📹 Video data size: ${video_data.length} chars, Camera ID: ${camera_id}`)

    const { cameras } = await getDb()
    
    // Verify camera ownership
    const cam = await cameras.findOne({ _id: new ObjectId(camera_id), ownerId: user._id })
    if (!cam) return NextResponse.json({ detail: "Camera not found" }, { status: 404 })

    console.log(`🎯 Calling external API for video upload...`)

    // Call external API to upload video
    const result = await apiClient.uploadVideo({
      video_data,
      camera_id: parseInt(camera_id),
      location: location || cam.location || "Unknown"
    })

    console.log(`✅ Video uploaded successfully: ${result.video_id}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error("Video upload error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
