// app/api/auth/signup/route.ts

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { hashPassword, signJwt } from "@/lib/auth"
import { signupSchema } from "@/types/schema"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.flatten() }, { status: 422 })
  }
  const { email, password } = parsed.data
  const { users } = await getDb()

  const existing = await users.findOne({ email })
  if (existing) {
    return NextResponse.json({ detail: "Email already in use" }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)
  const adminEnv = process.env.ADMIN_EMAILS || ""
  const adminEmails = adminEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const role = adminEmails.includes(email.toLowerCase()) ? "admin" : "user"
  const user = {
    email,
    password: passwordHash,
    role,
    createdAt: new Date(),
  }
  const res = await users.insertOne(user)
  const token = signJwt({ sub: res.insertedId.toString(), email })
  const cookieStore = await cookies()
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return NextResponse.json({ _id: res.insertedId, email, role })
}
