"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Row = {
  id: string
  cameraId: string | null
  label: string
  confidence: number | null
  severity: "low" | "medium" | "high" | "critical" | null
  createdAt: string | null
}

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

function useCameras() {
  return useSWR<{ data?: { id: string; name?: string | null }[] }>(
    "/api/cameras",
    (url) => fetch(url, { credentials: "include" }).then((r) => r.json()),
    { revalidateOnFocus: false },
  )
}

export default function LogsClient() {
  const [cameraId, setCameraId] = useState<string>("all")
  const [q, setQ] = useState<string>("")
  const [severity, setSeverity] = useState<string>("all")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  const params = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("pageSize", String(pageSize))
    if (cameraId !== "all") sp.set("cameraId", cameraId)
    if (q) sp.set("q", q)
    if (severity !== "all") sp.set("severity", severity)
    if (from) sp.set("from", from)
    if (to) sp.set("to", to)
    return sp.toString()
  }, [cameraId, q, severity, from, to, page])

  const { data, isLoading, error } = useSWR<any>(`/api/logs?${params}`, fetcher, { revalidateOnFocus: false })

  const { data: cams } = useCameras()

  // Create a lookup map for camera names
  const cameraNames = useMemo(() => {
    const map = new Map()
    if (cams?.data) {
      cams.data.forEach(cam => {
        map.set(cam.id, cam.name || cam.id)
      })
    }
    return map
  }, [cams?.data])

  const serverRows: any[] = data?.data ?? data?.items ?? []
  const mapped: Row[] = serverRows.map((doc: any) => {
    const id = String(doc._id ?? doc.id ?? "")
    const cameraId =
      typeof doc.cameraId === "object" && doc.cameraId !== null
        ? ((doc.cameraId as any).toString?.() ?? "")
        : String(doc.cameraId ?? "")
    const ts = doc.timestamp ?? doc.createdAt ?? null
    const dets: any[] = Array.isArray(doc.detections) ? doc.detections : []
    const top = dets.reduce((acc, d) => (acc && acc.confidence > d.confidence ? acc : d), null as any)
    return {
      id,
      cameraId: cameraId || null,
      label: top?.label || top?.detected_class || dets[0]?.label || dets[0]?.detected_class || "",
      confidence:
        typeof top?.confidence === "number"
          ? top.confidence
          : typeof dets[0]?.confidence === "number"
            ? dets[0]?.confidence
            : null,
      severity: doc.severity ?? top?.severity ?? null,
      createdAt: ts ? new Date(ts).toISOString() : null,
    }
  })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function resetFilters() {
    setCameraId("all")
    setQ("")
    setSeverity("all")
    setFrom("")
    setTo("")
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="camera">Camera</Label>
              <Select
                value={cameraId}
                onValueChange={(v) => {
                  setCameraId(v)
                  setPage(1)
                }}
              >
                <SelectTrigger id="camera" className="w-full">
                  <SelectValue placeholder="All cameras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(cams?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={severity}
                onValueChange={(v) => {
                  setSeverity(v)
                  setPage(1)
                }}
              >
                <SelectTrigger id="severity" className="w-full">
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="datetime-local"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="datetime-local"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                placeholder="Label or message"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : error ? "Failed to load" : `${total} result${total === 1 ? "" : "s"}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>

          <Table>
            <TableCaption>Recent detection events</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Camera</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Conf</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapped.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</TableCell>
                  <TableCell>{row.cameraId ? (cameraNames.get(row.cameraId) || row.cameraId) : "-"}</TableCell>
                  <TableCell className="max-w-xl truncate">{row.label || "-"}</TableCell>
                  <TableCell>{row.confidence != null ? `${Math.round(row.confidence * 100) / 100}` : "-"}</TableCell>
                  <TableCell className="capitalize">{row.severity ?? "-"}</TableCell>
                </TableRow>
              ))}
              {!isLoading && mapped.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No logs found with current filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
