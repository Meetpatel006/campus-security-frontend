// app/api/admin/metrics/route.ts
// Simple metrics for dashboard.

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  // For simplicity, every user sees their own metrics (admin role could be extended)
  const { logs, cameras } = await getDb()
  const [countLogs, countCameras] = await Promise.all([
    logs.countDocuments({ userId: user._id }),
    cameras.countDocuments({ ownerId: user._id }),
  ])
  const high = await logs.countDocuments({ userId: user._id, severity: "high" })
  const resolved = await logs.countDocuments({ userId: user._id, resolved: true })
  const falsePositiveRate = countLogs ? resolved / countLogs : 0
  return NextResponse.json({
    totalLogs: countLogs,
    totalCameras: countCameras,
    highSeverity: high,
    falsePositiveRate,
  })
}
