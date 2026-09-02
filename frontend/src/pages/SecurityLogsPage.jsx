import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FiActivity, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiClock, FiCheckCircle, FiXCircle, FiUpload, FiShield,
  FiTrash2, FiFileText, FiLogIn, FiLogOut, FiFilter,
} from 'react-icons/fi';
import { logsAPI } from '../services/api';

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Login', icon: FiLogIn },
  { value: 'logout', label: 'Logout', icon: FiLogOut },
  { value: 'upload', label: 'Upload', icon: FiUpload },
  { value: 'scan', label: 'Scan', icon: FiSearch },
  { value: 'quarantine', label: 'Quarantine', icon: FiShield },
  { value: 'delete', label: 'Delete', icon: FiTrash2 },
  { value: 'report', label: 'Report', icon: FiFileText },
];

const RESULT_STYLES = {
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  failure: 'bg-red-500/10 text-red-400 border border-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
};

const ACTION_ICONS = {
  login: FiLogIn,
  logout: FiLogOut,
  upload: FiUpload,
  scan: FiSearch,
  quarantine: FiShield,
  delete: FiTrash2,
  report: FiFileText,
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function ResultBadge({ result }) {
  const normalized = result?.toLowerCase() || '';
  let style = 'bg-dark-700 text-dark-300 border border-dark-600';
  if (normalized === 'success' || normalized === 'passed' || normalized === 'clean') {
    style = RESULT_STYLES.success;
  } else if (normalized === 'failure' || normalized === 'failed' || normalized === 'malicious') {
    style = RESULT_STYLES.failure;
  } else if (normalized === 'warning' || normalized === 'suspicious') {
    style = RESULT_STYLES.warning;
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${style}`}>
      {normalized === 'success' || normalized === 'passed' || normalized === 'clean' ? (
        <FiCheckCircle className="w-3 h-3" />
      ) : normalized === 'failure' || normalized === 'failed' || normalized === 'malicious' ? (
        <FiXCircle className="w-3 h-3" />
      ) : null}
      {result || '—'}
    </span>
  );
}

function ActionBadge({ action }) {
  const Icon = ACTION_ICONS[action?.toLowerCase()] || FiActivity;
  const styleMap = {
    login: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    logout: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    upload: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    scan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    quarantine: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    delete: 'bg-red-500/10 text-red-400 border border-red-500/20',
    report: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  };
  const style = styleMap[action?.toLowerCase()] || 'bg-dark-700 text-dark-300 border border-dark-600';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${style}`}>
      <Icon className="w-3 h-3" />
      {action || '—'}
    </span>
  );
}

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);
  const pageSize = 15;

  const fetchLogs = useCallback(async () => {
    try {
      const params = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      const res = await logsAPI.list(params);
      const data = res.data;
      setLogs(data.items || data.results || data.logs || []);
      setTotalPages(data.total_pages || Math.ceil((data.total || 0) / pageSize) || 1);
      setTotalCount(data.total || data.count || 0);
    } catch (err) {
      console.error('Failed to fetch security logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs();
      }, 10000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchLogs]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleActionFilter = (e) => {
    setActionFilter(e.target.value);
    setPage(1);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => {
      if (!prev) toast.success('Auto-refresh enabled (10s)');
      else toast('Auto-refresh disabled', { icon: '⏸' });
      return !prev;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Security Logs</h1>
          <p className="text-dark-400 text-sm mt-1">Audit trail of all system activities and security events</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg">
            <FiActivity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-dark-300">{totalCount} entries</span>
          </div>
          <button
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              autoRefresh
                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                : 'bg-dark-800 text-dark-300 border-dark-700 hover:bg-dark-700 hover:text-dark-100'
            }`}
          >
            <FiRefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search logs by user, action, or details..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
            <select
              value={actionFilter}
              onChange={handleActionFilter}
              className="pl-10 pr-8 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-dark-100 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer min-w-[180px]"
            >
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-dark-400 text-sm">Loading security logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-dark-500">
            <FiActivity className="text-4xl mb-3" />
            <p className="text-lg font-medium">No logs found</p>
            <p className="text-sm mt-1">
              {search || actionFilter ? 'Try adjusting your search or filter' : 'Security events will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5" />
                      Timestamp
                    </div>
                  </th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">User</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Action</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Details</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.id || idx}
                    className="border-b border-dark-700/50 hover:bg-dark-950 transition-colors"
                  >
                    <td className="px-5 py-3 text-dark-400 text-xs font-mono whitespace-nowrap">
                      {formatDate(log.timestamp || log.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-cyan-400">
                            {(log.user || log.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-dark-100 text-sm">{log.user || log.username || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <ActionBadge action={log.action || log.event || log.type} />
                    </td>
                    <td className="px-5 py-3 text-dark-300 text-sm max-w-[250px] truncate">
                      {log.details || log.description || log.message || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <ResultBadge result={log.result || log.status || log.outcome} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="px-5 py-3 border-t border-dark-700 flex items-center justify-between">
            <p className="text-xs text-dark-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed text-dark-200 border border-dark-700 rounded-lg text-xs font-medium transition-colors"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-dark-800 text-dark-300 border border-dark-700 hover:bg-dark-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed text-dark-200 border border-dark-700 rounded-lg text-xs font-medium transition-colors"
              >
                Next
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
