import { useState, useEffect } from 'react';
import { Activity, Clock, Database, Zap } from 'lucide-react';

interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    cacheHitRate: 0,
    activeConnections: 0,
    memoryUsage: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate performance monitoring
    const interval = setInterval(() => {
      setMetrics({
        responseTime: Math.random() * 100 + 50, // 50-150ms
        cacheHitRate: Math.random() * 30 + 70, // 70-100%
        activeConnections: Math.floor(Math.random() * 10 + 5), // 5-15
        memoryUsage: Math.random() * 20 + 10 // 10-30MB
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Show Performance Monitor"
      >
        <Activity className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <Zap className="h-4 w-4 mr-2 text-green-500" />
          Performance Monitor
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            Response Time
          </div>
          <span className={`text-sm font-medium ${
            metrics.responseTime < 100 ? 'text-green-600' : 
            metrics.responseTime < 200 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {metrics.responseTime.toFixed(0)}ms
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Database className="h-4 w-4 mr-2" />
            Cache Hit Rate
          </div>
          <span className={`text-sm font-medium ${
            metrics.cacheHitRate > 80 ? 'text-green-600' : 
            metrics.cacheHitRate > 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Activity className="h-4 w-4 mr-2" />
            Active Connections
          </div>
          <span className="text-sm font-medium text-blue-600">
            {metrics.activeConnections}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Zap className="h-4 w-4 mr-2" />
            Memory Usage
          </div>
          <span className="text-sm font-medium text-purple-600">
            {metrics.memoryUsage.toFixed(1)}MB
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="text-green-600 font-medium">Optimized</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Last Update:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
