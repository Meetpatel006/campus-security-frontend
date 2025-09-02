// Optional: serve files from /uploads if not using default static serving.
// In most Next deployments, anything under /public is served automatically.
// This route is a no-op placeholder in case you deploy elsewhere.

// You can remove this file if not needed.
export async function GET() {
  return new Response("Not Found", { status: 404 })
}
