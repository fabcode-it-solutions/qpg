/**
 * Performance Monitoring Utility
 * 
 * Tracks API response times, cache hit rates, and system metrics
 * for production monitoring and optimization insights.
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface CacheMetric {
  key: string;
  hit: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory
  
  // Track API endpoint performance
  async trackApiCall<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      
      this.addMetric({
        name,
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        metadata: { ...metadata, success: true }
      });
      
      return result;
    } catch (error) {
      this.addMetric({
        name,
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        metadata: { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      throw error;
    }
  }

  // Track Sanity API calls specifically
  async trackSanityCall<T>(
    queryName: string,
    operation: () => Promise<T>,
    cached: boolean = false
  ): Promise<T> {
    return this.trackApiCall(
      `sanity:${queryName}`,
      operation,
      { cached, source: 'sanity' }
    );
  }

  // Track database operations
  async trackDbCall<T>(
    queryName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.trackApiCall(
      `db:${queryName}`,
      operation,
      { source: 'database' }
    );
  }

  // Track cache operations
  trackCacheOperation(key: string, hit: boolean): void {
    this.cacheMetrics.push({
      key,
      hit,
      timestamp: Date.now()
    });

    // Keep cache metrics limited in memory
    if (this.cacheMetrics.length > this.MAX_METRICS) {
      this.cacheMetrics = this.cacheMetrics.slice(-this.MAX_METRICS);
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep metrics limited in memory
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  // Get performance summary for monitoring dashboard
  getPerformanceSummary(timeWindowMs: number = 300000): {
    totalRequests: number;
    averageResponseTime: number;
    slowestEndpoints: Array<{ name: string; avgDuration: number; count: number }>;
    cacheHitRate: number;
    sanityApiCalls: number;
    databaseCalls: number;
    errorRate: number;
  } {
    const cutoffTime = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    const recentCacheMetrics = this.cacheMetrics.filter(m => m.timestamp > cutoffTime);

    // Group by endpoint
    const endpointStats = new Map<string, { durations: number[]; errors: number }>();
    
    recentMetrics.forEach(metric => {
      if (!endpointStats.has(metric.name)) {
        endpointStats.set(metric.name, { durations: [], errors: 0 });
      }
      
      const stats = endpointStats.get(metric.name)!;
      stats.durations.push(metric.duration);
      
      if (metric.metadata?.success === false) {
        stats.errors++;
      }
    });

    // Calculate averages and find slowest endpoints
    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([name, stats]) => ({
        name,
        avgDuration: stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length,
        count: stats.durations.length,
        errorCount: stats.errors
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    // Cache hit rate
    const cacheHits = recentCacheMetrics.filter(m => m.hit).length;
    const cacheHitRate = recentCacheMetrics.length > 0 
      ? (cacheHits / recentCacheMetrics.length) * 100 
      : 0;

    // API call breakdown
    const sanityApiCalls = recentMetrics.filter(m => m.name.startsWith('sanity:')).length;
    const databaseCalls = recentMetrics.filter(m => m.name.startsWith('db:')).length;

    // Error rate
    const totalErrors = recentMetrics.filter(m => m.metadata?.success === false).length;
    const errorRate = recentMetrics.length > 0 
      ? (totalErrors / recentMetrics.length) * 100 
      : 0;

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0,
      slowestEndpoints,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      sanityApiCalls,
      databaseCalls,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  // Get raw metrics for detailed analysis
  getRawMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  // Clear old metrics (useful for memory management)
  clearOldMetrics(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    this.cacheMetrics = this.cacheMetrics.filter(m => m.timestamp > cutoffTime);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-cleanup old metrics every hour
setInterval(() => {
  performanceMonitor.clearOldMetrics();
}, 60 * 60 * 1000);