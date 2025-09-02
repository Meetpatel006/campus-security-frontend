// scripts/e2e.mjs
// Minimal E2E flow: signup -> add camera -> open SSE -> simulate detect.

const base = process.env.BASE_URL || "http://localhost:3000"

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const jar = {}
  const fetchWithCookies = async (url, opts = {}) => {
    opts.headers ||= {}
    let cookie = jar.cookie
    if (cookie) opts.headers["cookie"] = cookie
    const res = await fetch(base + url, { ...opts, redirect: "manual" })
    const setCookie = res.headers.get("set-cookie")
    if (setCookie) jar.cookie = setCookie.split(",")[0]
    return res
  }

  console.log("[e2e] signup")
  let res = await fetchWithCookies("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `test${Date.now()}@example.com`, password: "Password123!" }),
  })
  if (!res.ok) {
    console.log("[e2e] signup failed, trying login")
    res = await fetchWithCookies("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "demo@example.com", password: "Password123!" }),
    })
    if (!res.ok) throw new Error("auth failed")
  }

  console.log("[e2e] add camera")
  res = await fetchWithCookies("/api/cameras", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Lobby Cam", streamUrl: "local-device", location: "Main Lobby" }),
  })
  if (!res.ok) throw new Error("add camera failed")
  const cam = await res.json()

  console.log("[e2e] open SSE")
  const es = new EventSource(base + "/api/alerts/stream", { withCredentials: true })
  es.addEventListener("alert", (ev) => {
    console.log("[e2e] alert:", ev.data)
  })

  console.log("[e2e] simulate detect")
  // use a 1x1 white pixel as dummy frame
  const frame = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD..."
  res = await fetchWithCookies("/api/detect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ camera_id: cam._id, frame_data: frame, timestamp: new Date().toISOString() }),
  })
  console.log("[e2e] detect status", res.status)
  await delay(1000)
  es.close()

  console.log("[e2e] done")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
