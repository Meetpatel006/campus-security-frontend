// app/dashboard/page.tsx
// Auth-protected server component showing cameras, upload, logs, and admin metrics.

import { getCurrentUser } from "@/lib/auth"
import CameraGrid from "@/components/camera-grid"
import { CameraProvider, AddCameraButton } from "@/components/camera-provider"
import VideoUploadForm from "@/components/video-upload-form"
import LogsTable from "@/components/logs-table"
import AdminMetrics from "@/components/admin-metrics"
import AdminUsers from "@/components/admin-users"
import Link from "next/link"
import { Suspense } from 'react'
import { DashboardMetrics } from './metrics'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <main className="min-h-dvh bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">You must be logged in.</p>
          <Link className="border border-white px-4 py-2" href="/login">
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CS</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Campus Safety Dashboard</h1>
                  <p className="text-white/60 text-sm">Welcome back, {user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white/70">System Online</span>
              </div>
              <form action="/api/auth/logout" method="post">
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-medium">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Cards */}
        <DashboardMetrics />
        <section className="mb-8">
          <div className="bg-gray-900/50 border border-white/10 rounded-lg">
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Camera Management</span>
                  </h2>
                  <p className="text-white/60 text-sm mt-1">Monitor and manage your security cameras</p>
                </div>
                <AddCameraButton />
              </div>
            </div>
            <div className="p-6">
              <CameraProvider>
                <CameraGrid />
              </CameraProvider>
            </div>
          </div>
        </section>

        {/* Two Column Layout for Upload and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Video Upload Section */}
          <section>
            <div className="bg-gray-900/50 border border-white/10 rounded-lg h-full">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Video Analysis</span>
                </h2>
                <p className="text-white/60 text-sm mt-1">Upload videos for anomaly detection</p>
              </div>
              <div className="p-6">
                <VideoUploadForm />
              </div>
            </div>
          </section>

          {/* Recent Activity Logs */}
          <section>
            <div className="bg-gray-900/50 border border-white/10 rounded-lg h-full">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Activity Logs</span>
                </h2>
                <p className="text-white/60 text-sm mt-1">System activity and detection history</p>
              </div>
              <div className="p-6">
                <LogsTable />
              </div>
            </div>
          </section>
        </div>

        {/* Admin Sections */}
        <div className="space-y-8">
          {/* System Metrics */}
          <section>
            <div className="bg-gray-900/50 border border-white/10 rounded-lg">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>System Metrics</span>
                </h2>
                <p className="text-white/60 text-sm mt-1">Performance and usage analytics</p>
              </div>
              <div className="p-6">
                <AdminMetrics />
              </div>
            </div>
          </section>

          {/* User Management - Admin Only */}
          {user.role === "admin" && (
            <section>
              <div className="bg-gray-900/50 border border-white/10 rounded-lg">
                <div className="px-6 py-4 border-b border-white/10">
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <span>User Management</span>
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full font-medium">Admin</span>
                  </h2>
                  <p className="text-white/60 text-sm mt-1">Manage system users and permissions</p>
                </div>
                <div className="p-6">
                  <AdminUsers />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
