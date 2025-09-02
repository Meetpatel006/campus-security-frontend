// components/logs-table.tsx
"use client"

import useSWR from "swr"
import { useState } from "react"
import { useRouter } from "next/navigation"

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url, { credentials: "include" })
    
    if (response.status === 401) {
      // User is not authenticated, redirect to login
      window.location.href = '/login'
      throw new Error('Unauthorized - redirecting to login')
    }
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // If JSON parsing fails, use the default error message
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  } catch (error) {
    // Re-throw with proper error message formatting
    if (error instanceof Error) {
      throw error
    }
    throw new Error(String(error))
  }
}

export default function LogsTable() {
  const [query, setQuery] = useState("")
  const { data, error, isLoading } = useSWR(
    `/api/logs${query ? `?q=${encodeURIComponent(query)}` : ""}`, 
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 1
    }
  )
  
  // Temporary debug to see what we're getting
  console.log("LogsTable - Data:", data)
  console.log("LogsTable - Error:", error)
  console.log("LogsTable - Loading:", isLoading)
  console.log("LogsTable - Items count:", data?.items?.length || 0)
  
  const items = data?.items || []
  const total = data?.total || items.length

  const handleCsvExport = async () => {
    try {
      const response = await fetch(`/api/logs?format=csv${query ? `&q=${encodeURIComponent(query)}` : ""}`, {
        credentials: "include"
      })
      
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `logs-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('CSV export failed:', error)
    }
  }

  return (
    <div className="border border-white/20">
      <div className="p-3 flex items-center justify-between gap-2 border-b border-white/10">
        <input
          className="bg-black text-white border border-white/20 px-3 py-2"
          placeholder="Filter by label..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="border border-white px-3 py-1 hover:bg-white/10 transition-colors"
          onClick={handleCsvExport}
          type="button"
        >
          Export CSV
        </button>
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
                <td>{new Date(it.timestamp || it.createdAt).toLocaleString()}</td>
                <td>{it.cameraId}</td>
                <td>{(it.detections || []).map((d: any) => d.label || d.detected_class || "").filter(Boolean).join(", ")}</td>
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
                  {isLoading ? "Loading..." : error ? (
                    (() => {
                      const errorMessage = error?.message || String(error)
                      if (errorMessage.includes('Unauthorized')) {
                        return "Redirecting to login..."
                      }
                      return `Error: ${errorMessage}`
                    })()
                  ) : "No logs yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 flex items-center justify-between">
        <div className="text-white/70">
          Total logs: {total}
        </div>
        <div className="text-white/60 text-sm">
          Showing all available logs
        </div>
      </div>
    </div>
  )
}
