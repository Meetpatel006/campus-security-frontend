// app/api/cameras/[id]/heartbeat/route.ts
// Mark camera as online and update lastSeen. Auth + ownership required.

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const { cameras } = await getDb()
  const resolvedParams = await params
  const _id = new ObjectId(resolvedParams.id)
  const cam = await cameras.findOne({ _id, ownerId: user._id })
  if (!cam) return NextResponse.json({ detail: "Not found" }, { status: 404 })

  await cameras.updateOne({ _id }, { $set: { lastSeen: new Date(), status: "active" } })
  return NextResponse.json({ ok: true, serverTime: new Date().toISOString() })
}
