// components/admin-metrics.tsx
"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminMetrics() {
  const { data } = useSWR("/api/admin/metrics", fetcher)
  const m = data || { totalLogs: 0, totalCameras: 0, highSeverity: 0, falsePositiveRate: 0 }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="border border-white/20 p-3">
        <div className="text-sm text-white/60">Cameras</div>
        <div className="text-2xl font-bold">{m.totalCameras}</div>
      </div>
      <div className="border border-white/20 p-3">
        <div className="text-sm text-white/60">Logs</div>
        <div className="text-2xl font-bold">{m.totalLogs}</div>
      </div>
      <div className="border border-white/20 p-3">
        <div className="text-sm text-white/60">High Severity</div>
        <div className="text-2xl font-bold">{m.highSeverity}</div>
      </div>
      <div className="border border-white/20 p-3">
        <div className="text-sm text-white/60">False Positive Rate</div>
        <div className="text-2xl font-bold">{(m.falsePositiveRate * 100).toFixed(1)}%</div>
      </div>
    </div>
  )
}
