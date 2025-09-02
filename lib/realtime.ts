// lib/realtime.ts
// Simple in-memory SSE hub keyed by userId.

type Subscriber = {
  id: string
  write: (data: string) => void
  close: () => void
}

type Hub = Map<string, Set<Subscriber>>

declare global {
  // eslint-disable-next-line no-var
  var __sseHub: Hub | undefined
}

const hub: Hub = global.__sseHub || new Map()
if (!global.__sseHub) {
  global.__sseHub = hub
}

export function subscribe(userId: string, sub: Subscriber) {
  if (!hub.has(userId)) hub.set(userId, new Set())
  hub.get(userId)!.add(sub)
  return () => {
    hub.get(userId)?.delete(sub)
  }
}

export function publish(userId: string, event: string, payload: any) {
  const subs = hub.get(userId)
  if (!subs || subs.size === 0) return
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
  for (const s of subs) {
    try {
      s.write(message)
    } catch {
      // drop broken subscriber
      subs.delete(s)
    }
  }
}
