// components/logs-table.tsx
"use client"

import useSWR from "swr"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LogsTable() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const { data } = useSWR(`/api/logs?page=${page}${query ? `&label=${encodeURIComponent(query)}` : ""}`, fetcher)
  const items = data?.items || []
  const total = data?.total || 0
  const limit = data?.limit || 20
  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="border border-white/20">
      <div className="p-3 flex items-center justify-between gap-2 border-b border-white/10">
        <input
          className="bg-black text-white border border-white/20 px-3 py-2"
          placeholder="Filter by label..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <a
          className="border border-white px-3 py-1"
          href={`/api/logs?format=csv${query ? `&label=${encodeURIComponent(query)}` : ""}`}
          target="_blank"
          rel="noreferrer"
        >
          Export CSV
        </a>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/40">
            <tr className="[&>th]:px-3 [&>th]:py-2 border-b border-white/10">
              <th>Time</th>
              <th>Camera</th>
              <th>Labels</th>
              <th>Confidence</th>
              <th>Snapshot</th>
              <th>Video</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => (
              <tr key={idx} className="[&>td]:px-3 [&>td]:py-2 border-b border-white/10">
                <td>{new Date(it.timestamp).toLocaleString()}</td>
                <td>{it.cameraId}</td>
                <td>{(it.detections || []).map((d: any) => d.label).join(", ")}</td>
                <td>{(it.detections || []).map((d: any) => Math.round(d.confidence * 100)).join(", ")}</td>
                <td>
                  {it.snapshotUrl ? (
                    <a className="underline" href={it.snapshotUrl} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {it.videoUrl ? (
                    <a className="underline" href={it.videoUrl} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-white/60" colSpan={6}>
                  No logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 flex items-center justify-between">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="border border-white px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-white/70">
          Page {page} / {pages}
        </div>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
          className="border border-white px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
