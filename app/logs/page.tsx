import LogsClient from "@/components/logs-client"

export const dynamic = "force-dynamic"

export default function LogsPage() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4 text-pretty">Detection Logs</h1>
      <LogsClient />
    </main>
  )
}
