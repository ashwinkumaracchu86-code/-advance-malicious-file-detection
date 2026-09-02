import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiCpu, FiMonitor, FiHardDrive, FiCheckCircle, FiAlertTriangle,
  FiPlay, FiLoader, FiInfo, FiShield, FiSearch, FiFile,
} from 'react-icons/fi';

const MOCK_DRIVES = [
  { id: 1, name: 'USB Drive (E:)', size: '32 GB', type: 'Removable', files: 1247, status: 'connected' },
  { id: 2, name: 'External HDD (F:)', size: '1 TB', type: 'Removable', files: 8342, status: 'connected' },
  { id: 3, name: 'SD Card (G:)', size: '64 GB', type: 'Removable', files: 3210, status: 'disconnected' },
];

const MOCK_SCAN_RESULTS = [
  { id: 1, filename: 'autorun.inf', risk: 'high', score: 85, reason: 'Auto-execution script detected' },
  { id: 2, filename: 'system_check.exe', risk: 'high', score: 92, reason: 'Suspicious executable with packed binary' },
  { id: 3, filename: 'documents.zip', risk: 'low', score: 12, reason: 'Archive containing benign files' },
  { id: 4, filename: 'hidden_script.vbs', risk: 'high', score: 78, reason: 'Hidden VBScript with obfuscated code' },
  { id: 5, filename: 'photo.jpg.exe', risk: 'critical', score: 98, reason: 'Double extension — likely malware dropper' },
  { id: 6, filename: 'readme.txt', risk: 'safe', score: 5, reason: 'Plain text file, no indicators' },
];

export default function USBScannerPage() {
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState(null);

  const handleSelectDrive = (drive) => {
    if (drive.status === 'disconnected') {
      toast.error('Drive is not connected');
      return;
    }
    setSelectedDrive(drive);
    setScanResults(null);
    toast.success(`Selected: ${drive.name}`);
  };

  const handleScan = () => {
    if (!selectedDrive) {
      toast.error('Please select a drive first');
      return;
    }
    setScanning(true);
    setScanProgress(0);
    setScanResults(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setScanResults(MOCK_SCAN_RESULTS);
          setScanning(false);
          toast.success('Scan complete — 2 threats detected');
        }, 500);
      }
      setScanProgress(Math.min(progress, 100));
    }, 400);
  };

  const getRiskBadge = (risk) => {
    const map = {
      safe: 'bg-green-500/20 text-green-400 border border-green-500/30',
      low: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      high: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return map[risk] || 'bg-dark-700 text-dark-300 border border-dark-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">USB Scanner</h1>
        <p className="text-dark-400 text-sm mt-1">Scan removable drives for threats</p>
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3">
        <FiInfo className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-cyan-400">Web-Based Demo</p>
          <p className="text-xs text-dark-400 mt-1">
            This USB scanner is a simulated demo for the web interface. Full USB device detection and scanning requires the
            desktop application with system-level hardware access. The data shown here is for demonstration purposes.
          </p>
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <FiCpu className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-100">How USB Detection Works</h2>
            <p className="text-xs text-dark-400">Real-time hardware monitoring for removable media</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: FiMonitor, title: 'Device Monitoring', desc: 'Watches for new USB device connections using OS-level hooks' },
            { icon: FiHardDrive, title: 'Drive Enumeration', desc: 'Lists all mounted removable volumes and their file systems' },
            { icon: FiShield, title: 'Auto-Scan', desc: 'Automatically scans new devices against YARA rules and heuristics' },
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

      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-700">
          <h3 className="text-sm font-semibold text-dark-100">Detected Removable Drives</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_DRIVES.map((drive) => (
            <div
              key={drive.id}
              onClick={() => handleSelectDrive(drive)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedDrive?.id === drive.id
                  ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
                  : drive.status === 'disconnected'
                    ? 'bg-dark-950 border-dark-700/50 opacity-50 cursor-not-allowed'
                    : 'bg-dark-950 border-dark-700/50 hover:border-dark-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FiHardDrive className={`w-5 h-5 ${selectedDrive?.id === drive.id ? 'text-cyan-400' : 'text-dark-400'}`} />
                  <span className="text-sm font-medium text-dark-100">{drive.name}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${drive.status === 'connected' ? 'bg-green-400' : 'bg-dark-500'}`} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-400">Capacity</span>
                  <span className="text-dark-200">{drive.size}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-400">Type</span>
                  <span className="text-dark-200">{drive.type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-400">Files</span>
                  <span className="text-dark-200">{drive.files.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-400">Status</span>
                  <span className={drive.status === 'connected' ? 'text-green-400' : 'text-dark-500'}>
                    {drive.status}
                  </span>
                </div>
              </div>
              {selectedDrive?.id === drive.id && (
                <div className="mt-3 pt-3 border-t border-cyan-500/20 flex items-center justify-center gap-1.5">
                  <FiCheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">Selected</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-dark-100">
              {selectedDrive ? `Scanning: ${selectedDrive.name}` : 'Ready to Scan'}
            </h3>
            <p className="text-xs text-dark-400 mt-0.5">
              {selectedDrive
                ? 'Click the scan button to begin analyzing files'
                : 'Select a removable drive above to begin'}
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={!selectedDrive || scanning}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Scanning... {Math.round(scanProgress)}%
              </>
            ) : (
              <>
                <FiSearch className="w-4 h-4" />
                Scan Drive
              </>
            )}
          </button>
        </div>

        {scanning && (
          <div className="mb-4">
            <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-xs text-dark-400 mt-2 text-center">
              Analyzing files... {Math.round(scanProgress)}% complete
            </p>
          </div>
        )}

        {scanResults && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Filename</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Risk</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Score</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {scanResults.map((result) => (
                  <tr key={result.id} className="border-b border-dark-700/50 hover:bg-dark-950 transition-colors">
                    <td className="px-4 py-3 text-dark-100">
                      <div className="flex items-center gap-2">
                        <FiFile className="w-3.5 h-3.5 text-dark-400 shrink-0" />
                        <span className="font-mono text-xs">{result.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${getRiskBadge(result.risk)}`}>
                        {result.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono font-bold ${
                        result.score > 70 ? 'text-red-400' : result.score > 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {result.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs max-w-[250px] truncate">{result.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex items-start gap-3">
        <FiMonitor className="w-5 h-5 text-dark-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-dark-200">Desktop Application Required</p>
          <p className="text-xs text-dark-400 mt-1">
            For full USB scanning capabilities including real-time device detection, automatic threat isolation, and
            write-protection, install the MFDS desktop application with kernel-level driver support.
          </p>
        </div>
      </div>
    </div>
  );
}
