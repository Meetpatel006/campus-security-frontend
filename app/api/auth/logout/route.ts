// app/api/auth/logout/route.ts

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  
  // Redirect to root page after logout
  redirect("/")
}
