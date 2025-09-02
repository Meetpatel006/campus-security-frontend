// app/api/upload/route.ts
// Accept multipart upload per camera, store to STORAGE_PATH, save metadata in logs.

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"
import fs from "fs/promises"
import path from "path"
const STORAGE_PATH = process.env.STORAGE_PATH || "uploads"

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const cameraId = form.get("cameraId")?.toString()
  const file = form.get("file") as File | null
  if (!cameraId || !file) {
    return NextResponse.json({ detail: "cameraId and file required" }, { status: 400 })
  }

  const { cameras, logs } = await getDb()
  const cam = await cameras.findOne({ _id: new ObjectId(cameraId), ownerId: user._id })
  if (!cam) return NextResponse.json({ detail: "Camera not found" }, { status: 404 })

  const dir = path.join(process.cwd(), STORAGE_PATH, user._id.toString(), cameraId)
  await fs.mkdir(dir, { recursive: true })
  const arrayBuffer = await file.arrayBuffer()
  const buf = Buffer.from(arrayBuffer)
  const filename = `${Date.now()}-${file.name}`
  const filePath = path.join(dir, filename)
  await fs.writeFile(filePath, buf)

  const videoUrl = `/uploads/${user._id.toString()}/${cameraId}/${filename}`

  const insertRes = await logs.insertOne({
    cameraId: cam._id,
    userId: user._id,
    detections: [],
    snapshotUrl: null,
    videoUrl,
    timestamp: new Date(),
    resolved: false,
    frames: [],
  })

  return NextResponse.json({ ok: true, videoUrl, logId: insertRes.insertedId.toString() })
}
