// app/api/auth/login/route.ts

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { signJwt, verifyPassword } from "@/lib/auth"
import { loginSchema } from "@/types/schema"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.flatten() }, { status: 422 })
  }
  const { email, password } = parsed.data
  const { users } = await getDb()

  const user = await users.findOne({ email })
  if (!user) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 400 })
  }
  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 400 })
  }

  const token = signJwt({ sub: user._id.toString(), email })
  const cookieStore = await cookies()
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return NextResponse.json({ _id: user._id, email: user.email, role: user.role || "user" })
}
