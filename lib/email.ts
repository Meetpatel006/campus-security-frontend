// lib/email.ts
// Nodemailer transport + sendAlert helper.

import nodemailer from "nodemailer"
import { ObjectId } from "mongodb"

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn("[email] SMTP env not fully configured. Emails will fail.")
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: SMTP_USER, // Your Gmail email address
    pass: SMTP_PASS  // Your Gmail app password
  },
  tls: {
    rejectUnauthorized: false
  }
})

export async function sendAlertEmail(to: string, subject: string, html: string) {
  if (!SMTP_HOST) return
  await transporter.sendMail({
    from: `"Campus Safety" <${SMTP_USER}>`,
    to,
    subject,
    html,
  })
}

export async function sendAnomalyAlert(userId: string, anomalyDetails: {
  cameraName: string;
  location: string;
  timestamp: Date;
  description: string;
}) {
  const { getDb } = await import('./db')
  const { users } = await getDb()
  
  // Get user email from database
  const user = await users.findOne({ _id: new ObjectId(userId) })
  if (!user) {
    console.error(`User not found for ID: ${userId}`)
    return
  }

  const subject = `🚨 Anomaly Alert - ${anomalyDetails.cameraName}`
  const html = `
    <h2>Security Anomaly Detected</h2>
    <p>An anomaly has been detected in your monitored area:</p>
    <ul>
      <li><strong>Camera:</strong> ${anomalyDetails.cameraName}</li>
      <li><strong>Location:</strong> ${anomalyDetails.location}</li>
      <li><strong>Time:</strong> ${anomalyDetails.timestamp.toLocaleString()}</li>
    </ul>
    <p><strong>Description:</strong> ${anomalyDetails.description}</p>
    <p>Please check your dashboard for more details and take appropriate action.</p>
    <p>Best regards,<br>Campus Safety System</p>
  `

  await sendAlertEmail(user.email, subject, html)
}
