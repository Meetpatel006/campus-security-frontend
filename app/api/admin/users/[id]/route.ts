// app/api/admin/users/[id]/route.ts
// PATCH update role (admin only)

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser()
  if (!me || !isAdmin(me)) return NextResponse.json({ detail: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const role = body?.role
  if (!["user", "admin"].includes(role)) {
    return NextResponse.json({ detail: "Invalid role" }, { status: 422 })
  }

  const { users } = await getDb()
  const _id = new ObjectId(params.id)

  // Prevent self-demotion lockout if no other admin exists (optional safety)
  if (me._id.toString() === _id.toString()) {
    const otherAdmin = await users.findOne({ _id: { $ne: _id }, role: "admin" })
    if (!otherAdmin && role !== "admin") {
      return NextResponse.json({ detail: "Cannot remove last admin role from yourself" }, { status: 400 })
    }
  }

  await users.updateOne({ _id }, { $set: { role } })
  return NextResponse.json({ ok: true })
}
