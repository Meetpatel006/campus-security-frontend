// app/api/logs/route.ts
// Paginated logs with filters and optional CSV export.

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { logsQuerySchema } from "@/types/schema"
import { ObjectId } from "mongodb"

function toCSV(rows: any[]) {
  const headers = ["timestamp", "cameraId", "labels", "confidence", "videoUrl", "snapshotUrl", "resolved"]
  const lines = [headers.join(",")]
  for (const r of rows) {
    const labels = (r.detections || []).map((d: any) => d.label).join("|")
    const confidences = (r.detections || []).map((d: any) => d.confidence).join("|")
    lines.push(
      [
        new Date(r.timestamp).toISOString(),
        r.cameraId,
        `"${labels}"`,
        `"${confidences}"`,
        r.videoUrl || "",
        r.snapshotUrl || "",
        r.resolved ? "true" : "false",
      ].join(","),
    )
  }
  return lines.join("\n")
}

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const url = new URL(req.url)
  const parsed = logsQuerySchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    pageSize: url.searchParams.get("pageSize"),
    cameraId: url.searchParams.get("cameraId") || undefined,
    label: url.searchParams.get("label") || undefined,
    q: url.searchParams.get("q") || undefined,
    severity: url.searchParams.get("severity") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    format: url.searchParams.get("format") || undefined,
  })
  if (!parsed.success) return NextResponse.json({ detail: parsed.error.flatten() }, { status: 422 })

  const { page, cameraId, label, q, severity, from, to, format } = parsed.data
  // normalize limit from either limit or pageSize (default 20)
  const limit = parsed.data.pageSize ?? parsed.data.limit ?? 20

  const { logs } = await getDb()
  const query: any = { userId: user._id }

  if (cameraId) {
    try {
      query.cameraId = new ObjectId(cameraId)
    } catch {
      // ignore invalid id
    }
  }

  if (label) {
    query["detections.label"] = label
  }

  // free-text search on detection labels (case-insensitive)
  if (q && q.trim()) {
    query.$or = [
      { "detections.label": { $regex: q.trim(), $options: "i" } },
      // optionally search a top-level message if your schema has it
      { message: { $regex: q.trim(), $options: "i" } },
    ]
  }

  // severity filter: support either top-level severity or per-detection severity if present
  if (severity) {
    query.$or = (query.$or || []).concat([{ severity }, { "detections.severity": severity }])
  }

  // date range on timestamp field (fallback to createdAt if your schema uses that)
  const range: any = {}
  if (from) range.$gte = new Date(from)
  if (to) range.$lte = new Date(to)
  if (Object.keys(range).length > 0) {
    query.$and = (query.$and || []).concat([{ $or: [{ timestamp: range }, { createdAt: range }] }])
  }

  const total = await logs.countDocuments(query)
  const items = await logs
    .find(query)
    .sort({ timestamp: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray()

  if (format === "csv") {
    const csv = toCSV(items)
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename="logs-${Date.now()}.csv"`,
      },
    })
  }

  // return both shapes for compatibility with both table components
  return NextResponse.json({
    items,
    data: items,
    page,
    limit,
    pageSize: limit,
    total,
  })
}
