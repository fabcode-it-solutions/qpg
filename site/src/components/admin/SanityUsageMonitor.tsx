"use client";

import { useState, useEffect } from "react";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

interface UsageStats {
  totalRequests: number;
  averageResponseTime: number;
  slowestEndpoints: Array<{ name: string; avgDuration: number; count: number }>;
  cacheHitRate: number;
  sanityApiCalls: number;
  databaseCalls: number;
  errorRate: number;
}

export default function SanityUsageMonitor() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [timeWindow, setTimeWindow] = useState(300000); // 5 minutes default

  useEffect(() => {
    const fetchStats = () => {
      const summary = performanceMonitor.getPerformanceSummary(timeWindow);
      setStats(summary);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeWindow]);

  if (!stats) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-4"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const getBandwidthEstimate = () => {
    // Rough estimate: 1 Sanity API call ≈ 5-50KB depending on query
    const avgBytesPerCall = 25000; // 25KB average
    const estimatedBytes = stats.sanityApiCalls * avgBytesPerCall;
    const estimatedMB = Math.round(estimatedBytes / (1024 * 1024) * 100) / 100;
    return estimatedMB;
  };

  const getOptimizationStatus = () => {
    const cacheHitRate = stats.cacheHitRate;
    const avgResponseTime = stats.averageResponseTime;

    if (cacheHitRate >= 80 && avgResponseTime < 100) {
      return { status: "excellent", color: "text-green-600", bg: "bg-green-50" };
    } else if (cacheHitRate >= 60 && avgResponseTime < 200) {
      return { status: "good", color: "text-yellow-600", bg: "bg-yellow-50" };
    } else {
      return { status: "needs improvement", color: "text-red-600", bg: "bg-red-50" };
    }
  };

  const optimization = getOptimizationStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sanity Usage Monitor</h2>
        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(Number(e.target.value))}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value={60000}>Last 1 minute</option>
          <option value={300000}>Last 5 minutes</option>
          <option value={900000}>Last 15 minutes</option>
          <option value={3600000}>Last 1 hour</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Sanity API Calls
          </h3>
          <div className="text-2xl font-bold text-blue-600">
            {stats.sanityApiCalls}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ~{getBandwidthEstimate()}MB bandwidth
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Cache Hit Rate
          </h3>
          <div className="text-2xl font-bold text-green-600">
            {stats.cacheHitRate}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Higher is better</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Avg Response Time
          </h3>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(stats.averageResponseTime)}ms
          </div>
          <p className="text-xs text-gray-500 mt-1">Lower is better</p>
        </div>
      </div>

      {/* Optimization Status */}
      <div className={`p-4 rounded-lg border ${optimization.bg}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Optimization Status</h3>
          <span className={`font-semibold capitalize ${optimization.color}`}>
            {optimization.status}
          </span>
        </div>
        
        <div className="mt-2 text-sm text-gray-700">
          {optimization.status === "excellent" && (
            "Great job! Your Sanity usage is highly optimized."
          )}
          {optimization.status === "good" && (
            "Good performance. Consider increasing cache times or reducing query complexity."
          )}
          {optimization.status === "needs improvement" && (
            "Performance could be improved. Check query optimization and caching strategies."
          )}
        </div>
      </div>

      {/* Slowest Endpoints */}
      {stats.slowestEndpoints.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-medium mb-3">Slowest Endpoints</h3>
          <div className="space-y-2">
            {stats.slowestEndpoints.map((endpoint, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-mono">
                  {endpoint.name}
                </span>
                <div className="text-right text-xs">
                  <div className="font-medium">
                    {Math.round(endpoint.avgDuration)}ms avg
                  </div>
                  <div className="text-gray-500">{endpoint.count} calls</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bandwidth Optimization Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Optimization Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use light queries for listings, full queries only when needed</li>
          <li>• Optimize image quality and sizes (current: 65% quality)</li>
          <li>• Increase cache times for static content</li>
          <li>• Batch multiple queries when possible</li>
          <li>• Monitor your Sanity dashboard for usage limits</li>
        </ul>
      </div>

      {/* Error Rate Alert */}
      {stats.errorRate > 5 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">⚠️ High Error Rate</h3>
          <p className="text-sm text-red-800">
            Error rate is {stats.errorRate}%. Check network connectivity and Sanity service status.
          </p>
        </div>
      )}
    </div>
  );
}