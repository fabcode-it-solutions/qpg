"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { SecurityAnalytics, VideoSecurityAnalyticsProps } from "@/types";

export default function VideoSecurityAnalytics({
  userId,
  isAdmin = false,
}: VideoSecurityAnalyticsProps) {
  const [analytics, setAnalytics] = useState<SecurityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(7); // days

  useEffect(() => {
    fetchAnalytics();
  }, [userId, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/security/analytics?userId=${userId}&days=${dateRange}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resolveActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/security/resolve/${activityId}`, {
        method: "POST",
      });

      if (response.ok) {
        fetchAnalytics(); // Refresh data
      }
    } catch (err) {
      console.error("Failed to resolve activity:", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-50 rounded-lg p-6">
        <p className="text-red-300">Error: {error}</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-2">
            Total Access
          </h3>
          <p className="text-white text-2xl font-bold">
            {analytics.summary.totalAccess}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            in the last {dateRange} days
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Unique IPs</h3>
          <p className="text-white text-2xl font-bold">
            {analytics.summary.uniqueIps}
          </p>
          <p className="text-gray-400 text-xs mt-1">Different locations</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-2">
            Security Alerts
          </h3>
          <p
            className={`text-2xl font-bold ${
              analytics.summary.suspiciousCount > 0
                ? "text-red-500"
                : "text-green-500"
            }`}
          >
            {analytics.summary.suspiciousCount}
          </p>
          <p className="text-gray-400 text-xs mt-1">Suspicious activities</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-gray-800 rounded-lg p-4">
        <label className="text-gray-400 text-sm mr-4">Time Range:</label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(parseInt(e.target.value))}
          className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Suspicious Activities */}
      {analytics.suspiciousActivities.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-white text-lg font-semibold mb-4">
            Security Alerts
          </h3>
          <div className="space-y-3">
            {analytics.suspiciousActivities.map((activity) => (
              <div
                key={activity.id}
                className={`border rounded-lg p-4 ${
                  activity.resolved
                    ? "border-gray-600 bg-gray-700 bg-opacity-50"
                    : "border-red-600 bg-red-900 bg-opacity-20"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-medium ${
                          activity.resolved ? "text-gray-400" : "text-red-400"
                        }`}
                      >
                        {activity.activityType.replace(/_/g, " ").toUpperCase()}
                      </span>
                      {activity.resolved && (
                        <span className="text-xs text-green-400">Resolved</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-1">
                      {activity.details}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {format(new Date(activity.timestamp), "PPpp")}
                    </p>
                  </div>
                  {isAdmin && !activity.resolved && (
                    <button
                      onClick={() => resolveActivity(activity.id)}
                      className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Access Logs */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white text-lg font-semibold mb-4">
          Recent Access History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Action</th>
                <th className="text-left py-2">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {analytics.accessLogs.slice(0, 20).map((log, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-700 hover:bg-gray-700"
                >
                  <td className="py-2 text-gray-300">
                    {format(new Date(log.date), "MMM d, h:mm a")}
                  </td>
                  <td className="py-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        log.action === "stream_started"
                          ? "bg-green-900 text-green-300"
                          : log.action === "stream_ended"
                          ? "bg-gray-700 text-gray-300"
                          : log.action === "token_generated"
                          ? "bg-blue-900 text-blue-300"
                          : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 font-mono text-xs">
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
