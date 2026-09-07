import { useState, useEffect, useCallback } from 'react';
import {
  FiCpu, FiHardDrive, FiActivity, FiServer, FiCheckCircle, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { featuresAPI } from '../services/api';

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await featuresAPI.getSystemHealth();
      setHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const statusColor = {
    healthy: 'text-green-400 bg-green-500/10 border-green-500/20',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  const getBarColor = (pct) => {
    if (pct > 90) return 'bg-red-500';
    if (pct > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
            <FiActivity className="text-cyan-400" /> System Health
          </h1>
          <p className="text-dark-400 text-sm mt-1">Real-time system resource monitoring</p>
        </div>
        <button
          onClick={fetchHealth}
          className="p-2 rounded-lg bg-dark-900 border border-dark-700 text-dark-300 hover:bg-dark-800 hover:text-cyan-400 transition-colors"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-5 border ${statusColor[health?.status] || statusColor.healthy}`}>
        <div className="flex items-center gap-3">
          {health?.status === 'healthy' ? (
            <FiCheckCircle className="w-8 h-8" />
          ) : (
            <FiAlertTriangle className="w-8 h-8" />
          )}
          <div>
            <h2 className="text-lg font-bold capitalize">{health?.status || 'Unknown'}</h2>
            <p className="text-sm opacity-75">Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <FiCpu className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">CPU Usage</h3>
              <p className="text-2xl font-bold text-dark-100">{health?.resources?.cpu_percent || 0}%</p>
            </div>
          </div>
          <div className="w-full bg-dark-950 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${getBarColor(health?.resources?.cpu_percent || 0)}`} style={{ width: `${health?.resources?.cpu_percent || 0}%` }} />
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <FiServer className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Memory</h3>
              <p className="text-2xl font-bold text-dark-100">{health?.resources?.memory_percent || 0}%</p>
            </div>
          </div>
          <div className="w-full bg-dark-950 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${getBarColor(health?.resources?.memory_percent || 0)}`} style={{ width: `${health?.resources?.memory_percent || 0}%` }} />
          </div>
          <p className="text-xs text-dark-400 mt-2">{health?.resources?.memory_used_mb || 0} MB / {health?.resources?.memory_total_mb || 0} MB</p>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <FiHardDrive className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Disk</h3>
              <p className="text-2xl font-bold text-dark-100">{health?.resources?.disk_percent || 0}%</p>
            </div>
          </div>
          <div className="w-full bg-dark-950 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${getBarColor(health?.resources?.disk_percent || 0)}`} style={{ width: `${health?.resources?.disk_percent || 0}%` }} />
          </div>
          <p className="text-xs text-dark-400 mt-2">{health?.resources?.disk_used_gb || 0} GB / {health?.resources?.disk_total_gb || 0} GB</p>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <FiServer className="text-cyan-400" /> System Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {health?.system && Object.entries(health.system).map(([key, value]) => (
            <div key={key} className="bg-dark-950 rounded-lg p-3 border border-dark-700">
              <p className="text-xs text-dark-400 capitalize">{key.replace(/_/g, ' ')}</p>
              <p className="text-sm text-dark-100 font-medium mt-1">{value || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-4">Service Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {health?.services && Object.entries(health.services).map(([key, value]) => (
            <div key={key} className="bg-dark-950 rounded-lg p-4 border border-dark-700 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${value === 'active' ? 'bg-green-400' : value === 'unavailable' ? 'bg-yellow-400' : 'bg-red-400'}`} />
              <div>
                <p className="text-sm font-medium text-dark-100 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-dark-400 capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
