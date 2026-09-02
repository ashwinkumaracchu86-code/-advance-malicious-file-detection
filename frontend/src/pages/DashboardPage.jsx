import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiFile, FiCheckCircle, FiAlertTriangle, FiShield, FiXOctagon, FiActivity, FiRefreshCw
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardAPI } from '../services/api';

const COLORS = {
  safe: '#22c55e',
  suspicious: '#eab308',
  malicious: '#ef4444',
  neutral: '#64748b',
  cyan: '#06b6d4',
};

const StatCard = ({ icon: Icon, count, label, color, bgColor }) => (
  <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <Icon className={`text-xl ${color}`} />
    </div>
    <div>
      <div className="text-2xl font-bold text-dark-100">{count ?? '—'}</div>
      <div className="text-sm text-dark-400">{label}</div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-dark-100 text-sm font-medium">{payload[0].name || payload[0].payload?.name}</p>
      <p className="text-dark-300 text-xs">Count: {payload[0].value}</p>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-dark-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const total = stats?.total_scans || 0;
  const safe = stats?.safe_count || 0;
  const suspicious = stats?.suspicious_count || 0;
  const malicious = stats?.malicious_count || 0;
  const quarantined = stats?.quarantined_count || 0;
  const detectionRate = stats?.detection_percentage ?? (total > 0 ? (((suspicious + malicious) / total) * 100).toFixed(1) : 0);

  const riskPieData = [
    { name: 'Safe', value: safe },
    { name: 'Suspicious', value: suspicious },
    { name: 'Malicious', value: malicious },
  ].filter((d) => d.value > 0);

  const dailyData = (stats?.daily_scans || []).map((d) => ({
    name: d.date?.slice(5) || d.date,
    scans: d.count,
  }));

  const fileTypeData = Object.entries(stats?.file_type_distribution || {}).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const recentScans = stats?.recent_scans || [];
  const recentThreats = recentScans.filter((s) => ['suspicious', 'malicious'].includes(s.classification));

  const PIE_COLORS = [COLORS.safe, COLORS.suspicious, COLORS.malicious];
  const FILE_COLORS = [COLORS.cyan, '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#f87171'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-1">System overview and detection statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <FiActivity className="text-cyan-400" />
            <span>{detectionRate}% detection rate</span>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg bg-dark-900 border border-dark-700 text-dark-300 hover:bg-dark-800 hover:text-cyan-400 disabled:opacity-40 transition-colors"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={FiFile} count={total} label="Total Scanned" color="text-cyan-400" bgColor="bg-cyan-500/10" />
        <StatCard icon={FiCheckCircle} count={safe} label="Safe" color="text-green-400" bgColor="bg-green-500/10" />
        <StatCard icon={FiAlertTriangle} count={suspicious} label="Suspicious" color="text-yellow-400" bgColor="bg-yellow-500/10" />
        <StatCard icon={FiXOctagon} count={malicious} label="Malicious" color="text-red-400" bgColor="bg-red-500/10" />
        <StatCard icon={FiShield} count={quarantined} label="Quarantined" color="text-orange-400" bgColor="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <h3 className="text-dark-200 font-semibold mb-4">Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {riskPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <h3 className="text-dark-200 font-semibold mb-4">Daily Scans (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="scans" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <h3 className="text-dark-200 font-semibold mb-4">File Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fileTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {fileTypeData.map((_, i) => (
                    <Cell key={i} fill={FILE_COLORS[i % FILE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-dark-700">
            <h3 className="text-dark-200 font-semibold">Recent Scans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">File</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Risk</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Class</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-dark-500 text-center">No scans yet</td>
                  </tr>
                ) : (
                  recentScans.slice(0, 10).map((scan) => (
                    <tr
                      key={scan.id}
                      onClick={() => navigate(`/scan/${scan.id}`)}
                      className="border-b border-dark-700/50 hover:bg-dark-950 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 text-dark-100 truncate max-w-[180px]">{scan.filename}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          scan.risk_score <= 30 ? 'bg-green-500/20 text-green-400' :
                          scan.risk_score <= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {scan.risk_score}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-dark-300">{scan.classification}</td>
                      <td className="px-5 py-3 text-dark-400 text-xs">
                        {scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-dark-700">
            <h3 className="text-dark-200 font-semibold">Recent Threats</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">File</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Risk</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {recentThreats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-dark-500 text-center">No threats detected</td>
                  </tr>
                ) : (
                  recentThreats.slice(0, 10).map((threat) => (
                    <tr
                      key={threat.id}
                      onClick={() => navigate(`/scan/${threat.id}`)}
                      className="border-b border-dark-700/50 hover:bg-dark-950 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 text-dark-100 truncate max-w-[160px]">{threat.filename}</td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                          {threat.risk_score}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-dark-400 text-xs truncate max-w-[200px]">
                        {threat.detection_reasons?.[0] || 'Threat detected'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
