// app/api/cameras/[id]/route.ts
// PUT update, DELETE remove

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { cameraSchema } from "@/types/schema"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = cameraSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.flatten() }, { status: 422 })
  }
  const { cameras } = await getDb()
  const resolvedParams = await params
  const _id = new ObjectId(resolvedParams.id)
  const cam = await cameras.findOne({ _id })
  if (!cam || cam.ownerId.toString() !== user._id.toString()) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 })
  }
  await cameras.updateOne({ _id }, { $set: parsed.data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const { cameras, logs } = await getDb()
  const resolvedParams = await params
  const _id = new ObjectId(resolvedParams.id)
  const cam = await cameras.findOne({ _id })
  if (!cam || cam.ownerId.toString() !== user._id.toString()) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 })
  }
  await cameras.deleteOne({ _id })
  await logs.deleteMany({ cameraId: _id })
  return NextResponse.json({ ok: true })
}
