// types/schema.ts
// Zod schemas and TS types for inputs.

import { z } from "zod"

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const loginSchema = signupSchema

export const cameraSchema = z.object({
  name: z.string().min(1),
  streamUrl: z.string().url().or(z.literal("local-device")),
  location: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("inactive"),
})

export const detectFrameSchema = z.object({
  camera_id: z.union([z.number().int(), z.string()]),
  frame_data: z.string().startsWith("data:image/"),
  timestamp: z.string().datetime().optional(),
  videoLogId: z.string().optional(),
  frameTimeSec: z.coerce.number().nonnegative().optional(),
})

export type Detection = {
  label: string
  bbox?: [number, number, number, number] | null
  confidence: number
  timestamp?: string
}

export const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // accept both "limit" and "pageSize"; normalize later in route
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  cameraId: z.string().optional(),
  label: z.string().optional(),
  // new optional filters
  q: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(["json", "csv"]).optional(),
})
