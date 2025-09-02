// lib/db.ts
// MongoDB connection helper with singleton caching and typed collections.

import { Collection, MongoClient, ServerApiVersion } from "mongodb"
import { Collections, UserDocument, CameraDocument, LogDocument, AlertDocument } from "@/types/collections"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("Missing MONGODB_URI")
}

const DB_NAME = "campus_safety" // Specific database name for the project

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>
if (!global.__mongoClientPromise) {
  const client = new MongoClient(uri, {
    serverApi: { 
      version: ServerApiVersion.v1, 
      strict: true, 
      deprecationErrors: true 
    },
  })
  global.__mongoClientPromise = client.connect()
}
clientPromise = global.__mongoClientPromise!

// Type-safe collection getters
export async function getDb() {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  // Initialize collections with proper types
  return {
    client,
    db,
    users: db.collection<UserDocument>("users"),
    cameras: db.collection<CameraDocument>("cameras"),
    logs: db.collection<LogDocument>("logs"),
    alerts: db.collection<AlertDocument>("alerts"),
  } as const
}

// Export collection types for use in the application
export type DbCollections = {
  [K in keyof Collections]: Collection<Collections[K]>
}
