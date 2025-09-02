// lib/auth.ts
// JWT utilities, password hashing, auth helpers.

import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies, headers } from "next/headers"
import { ObjectId } from "mongodb"
import { getDb } from "./db"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET")

export type JwtPayload = { sub: string; email: string }

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" })
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (!token) return null
  const payload = verifyJwt(token)
  if (!payload) return null
  const { users } = await getDb()
  const user = await users.findOne({ _id: new ObjectId(payload.sub) }, { projection: { password: 0 } })
  return user
}

export function requireSameOrigin(): boolean {
  const h = headers()
  const origin = h.get("origin")
  const host = h.get("host")
  if (!origin || !host) return true // best effort in serverless previews
  try {
    const url = new URL(origin)
    return url.host === host
  } catch {
    return false
  }
}

export function isAdmin(user: any): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  const adminEnv = process.env.ADMIN_EMAILS || ""
  const emails = adminEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return emails.includes((user.email || "").toLowerCase())
}
