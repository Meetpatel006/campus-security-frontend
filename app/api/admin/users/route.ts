// app/api/admin/users/route.ts
// GET list all users (admin only)

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser, isAdmin } from "@/lib/auth"

export async function GET() {
  const me = await getCurrentUser()
  if (!me || !isAdmin(me)) return NextResponse.json({ detail: "Forbidden" }, { status: 403 })

  const { users } = await getDb()
  const list = await users
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json({ users: list })
}
