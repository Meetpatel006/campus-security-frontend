// app/api/alerts/stream/route.ts
// SSE stream for authenticated user.

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { subscribe } from "@/lib/realtime"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const write = (data: string) => controller.enqueue(encoder.encode(data))
      // initial comment to keep connection open
      write(`: connected\n\n`)
      const unsub = subscribe(user._id.toString(), {
        id: crypto.randomUUID(),
        write,
        close: () => controller.close(),
      })
      const keepAlive = setInterval(() => write(`: ping ${Date.now()}\n\n`), 15000)
      // cleanup
      // @ts-ignore
      controller["unsub"] = () => {
        clearInterval(keepAlive)
        unsub()
      }
    },
    cancel(reason) {
      // @ts-ignore
      this["unsub"]?.()
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
