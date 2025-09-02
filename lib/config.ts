// lib/config.ts
// Configuration for external API and application settings

export const config = {
  // External API Configuration
  externalApi: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL || "https://gcet--campus-safety-fastapi-app-dev.modal.run",
    apiKey: process.env.EXTERNAL_API_KEY, // Optional API key
    timeout: 30000, // 30 seconds timeout
  },
  
  // Application Settings
  app: {
    name: "Campus Safety Anomaly Monitor",
    version: "1.0.0",
    maxFileSize: 100 * 1024 * 1024, // 100MB max file size
    supportedVideoFormats: ["video/mp4", "video/webm", "video/avi", "video/mov"],
  },
  
  // Detection Settings
  detection: {
    confidenceThreshold: 0.5, // Minimum confidence for alerts
    classes: [
      'Abuse',
      'Arrest',
      'Arson',
      'Assault',
      'Burglary',
      'Explosion',
      'Fighting',
      'Normal_Videos_for_Event_Recognition',
      'RoadAccidents',
      'Robbery',
      'Shooting',
      'Shoplifting',
      'Stealing',
      'Vandalism',
    ] as const,
  },
  
  // Database Configuration
  database: {
    name: "campus_safety",
    connectionString: process.env.MONGODB_URI,
  },
} as const

export type Config = typeof config
export type DetectionClass = typeof config.detection.classes[number]
