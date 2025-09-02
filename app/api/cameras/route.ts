// app/api/cameras/route.ts
// GET list, POST create

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { cameraSchema } from "@/types/schema"
import { ObjectId } from "mongodb"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const { cameras } = await getDb()

  const list = await cameras.find({ ownerId: user._id }).project({ ownerId: 0 }).sort({ createdAt: -1 }).toArray()

  const now = Date.now()
  const staleMs = 30_000
  const updates: Promise<any>[] = []
  const enriched = list.map((c: any) => {
    const lastSeenMs = c.lastSeen ? new Date(c.lastSeen).getTime() : 0
    const isStale = !lastSeenMs || now - lastSeenMs > staleMs
    const desired = isStale ? "inactive" : "active"
    if (c.status !== desired) {
      updates.push(cameras.updateOne({ _id: c._id }, { $set: { status: desired } }))
      c.status = desired
    }
    return c
  })
  if (updates.length) await Promise.all(updates)

  return NextResponse.json({ cameras: enriched })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = cameraSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.flatten() }, { status: 422 })
  }
  const { cameras } = await getDb()
  const doc = {
    ...parsed.data,
    ownerId: new ObjectId(user._id),
    status: "inactive" as const,
    createdAt: new Date(),
    lastUpdate: new Date(),
    updatedAt: new Date(),
  }
  const res = await cameras.insertOne(doc as any)
  return NextResponse.json({ _id: res.insertedId, ...doc })
}
