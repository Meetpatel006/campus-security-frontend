'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricsData {
  activeCameras: number;
  systemStatus: string;
  recentAlerts: number;
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>({
    activeCameras: 0,
    systemStatus: 'Loading...',
    recentAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setMetrics(prev => ({
          ...prev,
          systemStatus: 'Error'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <MetricsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gray-900 border border-white/20 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white/70 text-sm">Active Cameras</p>
            <p className="text-2xl font-bold">{metrics.activeCameras}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 border border-white/20 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${
            metrics.systemStatus === 'Operational' ? 'bg-green-500/20' : 'bg-yellow-500/20'
          } rounded-lg flex items-center justify-center`}>
            {metrics.systemStatus === 'Operational' ? (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-white/70 text-sm">System Status</p>
            <p className={`text-lg font-semibold ${
              metrics.systemStatus === 'Operational' ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {metrics.systemStatus}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 border border-white/20 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-white/70 text-sm">Recent Alerts (24h)</p>
            <p className="text-2xl font-bold">{metrics.recentAlerts}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-900 border border-white/20 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
