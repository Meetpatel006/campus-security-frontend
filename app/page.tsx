// app/page.tsx
// Landing page component

"use client"

import Link from "next/link"
import {ShadowOverlay} from "@/components/shadow-overlay"


export default function HomePage() {
  
  return (
    <main className="min-h-dvh bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <ShadowOverlay
          color="rgba(30, 41, 59, 0.8)"
          animation={{
            scale: 60,
            speed: 30
          }}
          noise={{
            opacity: 0.3,
            scale: 1.2
          }}
          className="w-full h-full"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white/10 px-6 py-4 backdrop-blur-sm bg-black/20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="text-lg font-semibold">Campus Safety</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-white/70 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-6 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
              Smart Campus Safety
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
                Anomaly Detection
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
              Advanced AI-powered monitoring system that detects anomalies, analyzes camera feeds, 
              and delivers real-time alerts to keep your campus safe and secure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-white/90 transition-all text-lg backdrop-blur-sm"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/login" 
                className="border border-white/20 px-8 py-4 rounded-lg font-medium hover:bg-white/5 transition-all text-lg backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 bg-gray-900/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Everything you need to maintain a safe and secure campus environment
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
                <p className="text-white/70">
                  Monitor multiple camera feeds simultaneously with intelligent anomaly detection algorithms.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Alerts</h3>
                <p className="text-white/70">
                  Get immediate notifications when suspicious activities or anomalies are detected.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-white/70">
                  Comprehensive analytics and reporting to track incidents and system performance.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Incident Management</h3>
                <p className="text-white/70">
                  Efficiently manage and track security incidents with detailed logging and documentation.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Detection</h3>
                <p className="text-white/70">
                  Advanced machine learning algorithms for accurate anomaly detection and threat assessment.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Multi-User Access</h3>
                <p className="text-white/70">
                  Role-based access control for security teams, administrators, and authorized personnel.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Secure Your Campus?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Join educational institutions worldwide that trust our AI-powered safety monitoring system 
              to protect their communities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-white/90 transition-all text-lg backdrop-blur-sm"
              >
                Get Started Today
              </Link>
              <Link 
                href="/login" 
                className="text-white/70 hover:text-white transition-colors text-lg"
              >
                Already have an account? Sign in →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-8 backdrop-blur-sm bg-black/20">
          <div className="max-w-7xl mx-auto text-center text-white/50">
            <p>&copy; 2025 Campus Safety Anomaly Monitor. Built for educational security.</p>
          </div>
        </footer>
      </div>
    </main>
  )
}
