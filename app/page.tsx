// app/page.tsx
// Landing page component

"use client"

import Link from "next/link"
import {ShadowOverlay} from "@/components/shadow-overlay"
import { FeatureCard } from "@/components/feature-card"
import { FeatureIcons } from "@/components/feature-icons"

const features = [
  {
    title: "Real-time Monitoring",
    icon: FeatureIcons.Video,
    description: "Monitor multiple camera feeds simultaneously with intelligent anomaly detection algorithms."
  },
  {
    title: "Instant Alerts",
    icon: FeatureIcons.Shield,
    description: "Get immediate notifications when suspicious activities or anomalies are detected."
  },
  {
    title: "Analytics Dashboard",
    icon: FeatureIcons.BarChart3,
    description: "Comprehensive analytics and reporting to track incidents and system performance."
  },
  {
    title: "Incident Management",
    icon: FeatureIcons.AlertTriangle,
    description: "Efficiently manage and track security incidents with detailed logging and documentation."
  },
  {
    title: "AI-Powered Detection",
    icon: FeatureIcons.Zap,
    description: "Advanced machine learning algorithms for accurate anomaly detection and threat assessment."
  },
  {
    title: "Multi-User Access",
    icon: FeatureIcons.Users,
    description: "Role-based access control for security teams, administrators, and authorized personnel."
  }
];


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
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  feature={feature}
                  className="bg-gray-900/60 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-gray-900/80 transition-all duration-300"
                />
              ))}
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
