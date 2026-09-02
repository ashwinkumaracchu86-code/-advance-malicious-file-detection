import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiShield, FiShieldOff, FiPlay, FiSquare, FiUpload, FiFile,
  FiCheckCircle, FiAlertTriangle, FiXOctagon, FiRefreshCw, FiInfo,
  FiSettings, FiFolder, FiLock, FiUnlock, FiBell, FiBellOff,
  FiTrash2, FiSearch, FiCpu, FiActivity, FiZap,
} from 'react-icons/fi';
import { antivirusAPI } from '../services/api';

export default function AntivirusPage() {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [autoQuarantineEnabled, setAutoQuarantineEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [folderPath, setFolderPath] = useState('');
  const [monitoredPaths, setMonitoredPaths] = useState([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const refreshInterval = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, statsRes, notifRes, histRes] = await Promise.all([
        antivirusAPI.getStatus(),
        antivirusAPI.getStats(),
        antivirusAPI.getNotifications(),
        antivirusAPI.getScanHistory(),
      ]);
      setStatus(statusRes.data);
      setStats(statsRes.data);
      setNotifications(notifRes.data.notifications || []);
      setScanHistory(histRes.data.history || []);
      setProtectionEnabled(statusRes.data.protection_enabled);
      setAutoScanEnabled(statusRes.data.auto_scan_enabled);
      setAutoQuarantineEnabled(statusRes.data.auto_quarantine_enabled);
      setMonitoredPaths(statusRes.data.monitored_paths || []);
    } catch (err) {
      console.error('Failed to fetch antivirus data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    refreshInterval.current = setInterval(fetchData, 5000);
    return () => clearInterval(refreshInterval.current);
  }, [fetchData]);

  const toggleProtection = async () => {
    try {
      if (protectionEnabled) {
        await antivirusAPI.disableProtection();
        setProtectionEnabled(false);
        toast.success('Real-time protection disabled');
      } else {
        await antivirusAPI.enableProtection();
        setProtectionEnabled(true);
        toast.success('Real-time protection enabled');
      }
    } catch (err) {
      toast.error('Failed to toggle protection');
    }
  };

  const toggleAutoScan = async () => {
    try {
      if (autoScanEnabled) {
        await antivirusAPI.disableAutoScan();
        setAutoScanEnabled(false);
        toast.success('Auto-scan disabled');
      } else {
        await antivirusAPI.enableAutoScan();
        setAutoScanEnabled(true);
        toast.success('Auto-scan enabled');
      }
    } catch (err) {
      toast.error('Failed to toggle auto-scan');
    }
  };

  const toggleAutoQuarantine = async () => {
    try {
      if (autoQuarantineEnabled) {
        await antivirusAPI.disableAutoQuarantine();
        setAutoQuarantineEnabled(false);
        toast.success('Auto-quarantine disabled');
      } else {
        await antivirusAPI.enableAutoQuarantine();
        setAutoQuarantineEnabled(true);
        toast.success('Auto-quarantine enabled');
      }
    } catch (err) {
      toast.error('Failed to toggle auto-quarantine');
    }
  };

  const handleScanFile = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setScanning(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('file', fileList[i]);
      }

      const result = await antivirusAPI.scanShared(formData, {
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      const data = result.data;
      if (data.classification === 'safe') {
        toast.success(`"${data.filename}" is safe! No threats detected.`);
      } else if (data.classification === 'suspicious') {
        toast.warning(`"${data.filename}" is suspicious (Score: ${data.risk_score}/100)`);
      } else if (data.classification === 'malicious') {
        toast.error(`"${data.filename}" is MALICIOUS! (Score: ${data.risk_score}/100)`);
      } else if (data.quarantined) {
        toast.success(`"${data.filename}" has been quarantined.`);
      }

      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Scan failed';
      toast.error(msg);
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScanFolder = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setScanning(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('files', fileList[i]);
      }

      const result = await antivirusAPI.scanFolder(formData);
      const data = result.data;
      const scanned = data.results || [];
      const threats = scanned.filter((r) => r.classification !== 'safe');

      if (threats.length === 0) {
        toast.success(`All ${scanned.length} files are safe!`);
      } else {
        toast.warning(`Detected ${threats.length} threat(s) in ${scanned.length} files.`);
      }

      fetchData();
    } catch (err) {
      toast.error('Folder scan failed');
    } finally {
      setScanning(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleAddMonitoredPath = async () => {
    if (!folderPath.trim()) {
      toast.error('Please enter a folder path');
      return;
    }
    try {
      await antivirusAPI.addMonitoredPath(folderPath);
      setFolderPath('');
      toast.success('Folder added to monitoring');
      fetchData();
    } catch (err) {
      toast.error('Failed to add folder');
    }
  };

  const handleRemoveMonitoredPath = async (path) => {
    try {
      await antivirusAPI.removeMonitoredPath(path);
      toast.success('Folder removed from monitoring');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove folder');
    }
  };

  const clearNotifications = async () => {
    try {
      await antivirusAPI.clearNotifications();
      setNotifications([]);
      toast.success('Notifications cleared');
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  const getRiskColor = (score) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBg = (score) => {
    if (score <= 30) return 'bg-green-500';
    if (score <= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getClassBadge = (cls) => {
    const map = {
      safe: 'bg-green-500/20 text-green-400 border-green-500/30',
      suspicious: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      malicious: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return map[cls?.toLowerCase()] || 'bg-dark-700 text-dark-300 border-dark-600';
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
          <FiShield className="text-cyan-400" /> Antivirus Protection
        </h1>
        <p className="text-dark-400 text-sm mt-1">Real-time file scanning, auto-quarantine, and threat protection</p>
      </div>

      {/* Protection Status Banner */}
      <div className={`rounded-xl p-5 border ${
        protectionEnabled
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              protectionEnabled ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {protectionEnabled ? (
                <FiShield className="w-8 h-8 text-green-400" />
              ) : (
                <FiShieldOff className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${
                protectionEnabled ? 'text-green-400' : 'text-red-400'
              }`}>
                {protectionEnabled ? 'Protection Active' : 'Protection Disabled'}
              </h2>
              <p className="text-dark-400 text-sm">
                {protectionEnabled
                  ? 'System is protected. Files are being scanned automatically.'
                  : 'System is vulnerable. Enable protection immediately.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleProtection}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              protectionEnabled
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {protectionEnabled ? (
              <>
                <FiShieldOff className="w-4 h-4" /> Disable
              </>
            ) : (
              <>
                <FiShield className="w-4 h-4" /> Enable
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <FiCpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-100">{stats?.total_scans || 0}</p>
              <p className="text-xs text-dark-400">Total Scans</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <FiCheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats?.safe || 0}</p>
              <p className="text-xs text-dark-400">Safe Files</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <FiAlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats?.suspicious || 0}</p>
              <p className="text-xs text-dark-400">Suspicious</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <FiXOctagon className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats?.malicious || 0}</p>
              <p className="text-xs text-dark-400">Malicious</p>
            </div>
          </div>
        </div>
      </div>

      {/* Protection Settings */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <FiSettings className="text-cyan-400" /> Protection Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between bg-dark-950 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-3">
              {autoScanEnabled ? (
                <FiZap className="w-5 h-5 text-cyan-400" />
              ) : (
                <FiZap className="w-5 h-5 text-dark-500" />
              )}
              <div>
                <p className="text-sm font-medium text-dark-100">Auto-Scan</p>
                <p className="text-xs text-dark-400">Scan files on share</p>
              </div>
            </div>
            <button
              onClick={toggleAutoScan}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoScanEnabled ? 'bg-cyan-600' : 'bg-dark-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                autoScanEnabled ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between bg-dark-950 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-3">
              {autoQuarantineEnabled ? (
                <FiLock className="w-5 h-5 text-cyan-400" />
              ) : (
                <FiUnlock className="w-5 h-5 text-dark-500" />
              )}
              <div>
                <p className="text-sm font-medium text-dark-100">Auto-Quarantine</p>
                <p className="text-xs text-dark-400">Quarantine threats</p>
              </div>
            </div>
            <button
              onClick={toggleAutoQuarantine}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoQuarantineEnabled ? 'bg-cyan-600' : 'bg-dark-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                autoQuarantineEnabled ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between bg-dark-950 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-3">
              <FiBell className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm font-medium text-dark-100">Notifications</p>
                <p className="text-xs text-dark-400">{notifications.filter((n) => !n.read).length} unread</p>
              </div>
            </div>
            <button
              onClick={clearNotifications}
              className="px-3 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: FiActivity },
          { id: 'scan', label: 'Scan Files', icon: FiSearch },
          { id: 'notifications', label: 'Notifications', icon: FiBell },
          { id: 'history', label: 'Scan History', icon: FiRefreshCw },
          { id: 'monitor', label: 'Folder Monitor', icon: FiFolder },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800 border border-transparent'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">How Antivirus Protection Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: FiSearch, title: 'Auto-Scan', desc: 'Every file shared or uploaded is automatically scanned using 7 analysis engines.' },
                { icon: FiShield, title: 'YARA Detection', desc: 'Pattern-based malware detection using 9 custom YARA rules.' },
                { icon: FiLock, title: 'Auto-Quarantine', desc: 'Threats are automatically moved to quarantine to prevent system damage.' },
                { icon: FiBell, title: 'Instant Alerts', desc: 'Get real-time notifications about scan results and detected threats.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-dark-950 rounded-lg border border-dark-700/50">
                  <item.icon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-dark-100">{item.title}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Protection Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-950 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center gap-2 mb-2">
                  <FiShield className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-dark-100">Engine Status</span>
                </div>
                <p className="text-lg font-bold text-green-400">Active</p>
                <p className="text-xs text-dark-400 mt-1">7 analysis modules running</p>
              </div>
              <div className="bg-dark-950 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center gap-2 mb-2">
                  <FiFolder className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-dark-100">Monitored Paths</span>
                </div>
                <p className="text-lg font-bold text-cyan-400">{monitoredPaths.length}</p>
                <p className="text-xs text-dark-400 mt-1">Folders under active monitoring</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scan' && (
        <div className="space-y-4">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <FiUpload className="text-cyan-400" /> Scan Shared Files
            </h3>
            <p className="text-xs text-dark-400 mb-4">
              Upload files to scan them automatically. Files will be checked against all detection engines.
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-dark-600 hover:border-cyan-500/50 rounded-xl p-8 text-center cursor-pointer transition-all"
            >
              <FiUpload className="mx-auto text-4xl text-dark-500 mb-3" />
              <p className="text-dark-200 font-medium">Click to select files to scan</p>
              <p className="text-dark-500 text-xs mt-1">Or drag and drop files here</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleScanFile}
              className="hidden"
            />

            {scanning && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-300">Scanning...</span>
                  <span className="text-dark-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-dark-950 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <FiFolder className="text-cyan-400" /> Scan Folder
            </h3>
            <p className="text-xs text-dark-400 mb-4">
              Select multiple files from a folder to scan them all at once.
            </p>
            <div
              onClick={() => folderInputRef.current?.click()}
              className="border-2 border-dashed border-dark-600 hover:border-cyan-500/50 rounded-xl p-8 text-center cursor-pointer transition-all"
            >
              <FiFolder className="mx-auto text-4xl text-dark-500 mb-3" />
              <p className="text-dark-200 font-medium">Click to select folder files</p>
              <p className="text-dark-500 text-xs mt-1">Select all files from a shared folder</p>
            </div>
            <input
              ref={folderInputRef}
              type="file"
              multiple
              onChange={handleScanFolder}
              className="hidden"
            />
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-dark-100">
                Notifications ({notifications.length})
              </h3>
            </div>
            <button
              onClick={clearNotifications}
              className="text-xs text-dark-400 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-dark-500 text-sm">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-5 py-3 border-b border-dark-700/50 hover:bg-dark-950 transition-colors ${
                    !notif.read ? 'bg-dark-950/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${
                      notif.type === 'threat' ? 'text-red-400' :
                      notif.type === 'success' ? 'text-green-400' :
                      notif.type === 'warning' ? 'text-yellow-400' :
                      notif.type === 'error' ? 'text-red-400' :
                      'text-cyan-400'
                    }`}>
                      {notif.type === 'threat' ? (
                        <FiAlertTriangle className="w-4 h-4" />
                      ) : notif.type === 'success' ? (
                        <FiCheckCircle className="w-4 h-4" />
                      ) : notif.type === 'warning' ? (
                        <FiAlertTriangle className="w-4 h-4" />
                      ) : notif.type === 'error' ? (
                        <FiXOctagon className="w-4 h-4" />
                      ) : (
                        <FiActivity className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? 'text-dark-100 font-medium' : 'text-dark-300'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[11px] text-dark-500 mt-0.5">{formatTime(notif.timestamp)}</p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700 flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-dark-100">Scan History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Filename</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Classification</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Risk Score</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Quarantined</th>
                  <th className="text-left px-5 py-3 text-dark-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-dark-500">No scan history</td>
                  </tr>
                ) : (
                  scanHistory.map((entry, idx) => (
                    <tr key={idx} className="border-b border-dark-700/50 hover:bg-dark-950 transition-colors">
                      <td className="px-5 py-3 text-dark-100">
                        <div className="flex items-center gap-2">
                          <FiFile className="w-3.5 h-3.5 text-dark-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{entry.filename}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium border ${getClassBadge(entry.classification)}`}>
                          {entry.classification?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-mono font-bold ${getRiskColor(entry.risk_score)}`}>
                          {entry.risk_score}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {entry.quarantined ? (
                          <FiLock className="w-4 h-4 text-red-400" />
                        ) : (
                          <FiUnlock className="w-4 h-4 text-dark-500" />
                        )}
                      </td>
                      <td className="px-5 py-3 text-dark-400 text-xs">{formatTime(entry.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="space-y-4">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <FiFolder className="text-cyan-400" /> Add Monitored Folder
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="Enter folder path (e.g., C:\Users\Downloads)"
                className="flex-1 px-4 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyan-500/50 text-sm font-mono"
              />
              <button
                onClick={handleAddMonitoredPath}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FiFolder className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {monitoredPaths.length > 0 && (
            <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-700 flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-dark-100">Monitored Folders</h3>
              </div>
              <div className="p-4 space-y-2">
                {monitoredPaths.map((path, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-dark-950 rounded-lg px-4 py-3 border border-dark-700">
                    <div className="flex items-center gap-3">
                      <FiFolder className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-dark-100 font-mono">{path}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMonitoredPath(path)}
                      className="text-dark-500 hover:text-red-400 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notifications.length > 0 && (
            <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-700 flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-dark-100">Live Detection Feed</h3>
              </div>
              <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                {notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      notif.type === 'threat'
                        ? 'bg-red-500/5 border-red-500/10'
                        : 'bg-dark-950 border-dark-700/50'
                    }`}
                  >
                    {notif.type === 'success' ? (
                      <FiCheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    ) : notif.type === 'threat' ? (
                      <FiAlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : notif.type === 'warning' ? (
                      <FiAlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                    ) : (
                      <FiActivity className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark-100 truncate">{notif.message}</p>
                      <p className="text-xs text-dark-400">{formatTime(notif.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
