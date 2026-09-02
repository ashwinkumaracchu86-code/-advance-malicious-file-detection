import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUploadCloud, FiFile, FiX, FiCopy, FiCheck, FiExternalLink,
  FiAlertTriangle, FiShield, FiHash, FiCpu, FiLock, FiSearch
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { filesAPI, scansAPI } from '../services/api';

export default function ScannerPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAndScan = async () => {
    if (files.length === 0) {
      toast.error('Please select files to scan');
      return;
    }
    setUploading(true);
    setProgress(0);
    setResult(null);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const uploadRes = await filesAPI.upload(formData, {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      const uploadData = uploadRes.data;
      toast.success('File(s) uploaded & scanned');
      setUploading(false);
      setScanning(false);

      if (uploadData.results && uploadData.results.length > 0) {
        const firstResult = uploadData.results[0];
        const fileRecord = firstResult.file;
        const scanResult = firstResult.scan;

        if (scanResult && scanResult.id) {
          try {
            const detailRes = await scansAPI.get(scanResult.id);
            const detail = detailRes.data;
            let parsed = { ...detail };
            if (detail.file) {
              parsed = { ...parsed, ...detail.file };
            }
            if (typeof parsed.yara_matches === 'string') {
              try { parsed.yara_matches = JSON.parse(parsed.yara_matches); } catch { parsed.yara_matches = []; }
            }
            if (typeof parsed.suspicious_strings === 'string') {
              try { parsed.suspicious_strings = JSON.parse(parsed.suspicious_strings); } catch { parsed.suspicious_strings = []; }
            }
            if (typeof parsed.detection_reasons === 'string') {
              try { parsed.detection_reasons = JSON.parse(parsed.detection_reasons); } catch { parsed.detection_reasons = []; }
            }
            setResult({ scan: parsed });
          } catch {
            setResult({ scan: scanResult });
          }
        } else if (fileRecord) {
          setResult({ scan: { ...scanResult, ...fileRecord } });
        } else {
          setResult({ scan: scanResult || {} });
        }
      } else if (uploadData.error) {
        toast.error(uploadData.error);
      } else {
        toast.error('No results returned from upload');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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

  const scanData = result?.scan || result;
  const hashes = scanData?.hashes || {};
  const yaraMatches = scanData?.yara_matches || scanData?.yara_rules || [];
  const suspiciousStrings = scanData?.suspicious_strings || [];
  const reasons = scanData?.detection_reasons || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">File Scanner</h1>
        <p className="text-dark-400 text-sm mt-1">Upload files to analyze for malware and threats</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-cyan-400 bg-cyan-500/5'
            : 'border-dark-600 hover:border-dark-500 bg-dark-900'
        }`}
      >
        <FiUploadCloud className="mx-auto text-5xl text-dark-500 mb-4" />
        <p className="text-dark-200 text-lg font-medium">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-dark-500 text-sm mt-2">
          Supports any file type • Max 50MB per file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-dark-200 font-semibold">Selected Files ({files.length})</h3>
            <button
              onClick={() => { setFiles([]); setResult(null); }}
              className="text-dark-400 hover:text-dark-200 text-sm"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-dark-950 rounded-lg px-4 py-3 border border-dark-700">
                <div className="flex items-center gap-3 min-w-0">
                  <FiFile className="text-dark-500 flex-shrink-0" />
                  <span className="text-dark-100 text-sm truncate">{f.name}</span>
                  <span className="text-dark-500 text-xs flex-shrink-0">{formatSize(f.size)}</span>
                </div>
                <button onClick={() => removeFile(i)} className="text-dark-500 hover:text-red-400 ml-3 flex-shrink-0">
                  <FiX />
                </button>
              </div>
            ))}
          </div>

          {(uploading || scanning) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">{uploading ? 'Uploading...' : 'Scanning...'}</span>
                <span className="text-dark-400">{uploading ? `${progress}%` : 'Analyzing...'}</span>
              </div>
              <div className="w-full bg-dark-950 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    scanning ? 'bg-cyan-500 animate-pulse w-full' : `bg-cyan-500`
                  }`}
                  style={uploading ? { width: `${progress}%` } : undefined}
                />
              </div>
            </div>
          )}

          {!uploading && !scanning && (
            <button
              onClick={uploadAndScan}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiSearch />
              Upload & Scan
            </button>
          )}
        </div>
      )}

      {scanData && (
        <div className="space-y-6">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" stroke="#1e293b" strokeWidth="10" fill="none" />
                    <circle
                      cx="60" cy="60" r="52"
                      stroke={scanData.risk_score <= 30 ? '#22c55e' : scanData.risk_score <= 70 ? '#eab308' : '#ef4444'}
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${(scanData.risk_score / 100) * 327} 327`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getRiskColor(scanData.risk_score)}`}>
                      {scanData.risk_score}
                    </span>
                    <span className="text-dark-500 text-xs">/100</span>
                  </div>
                </div>
                <p className="text-dark-400 text-xs mt-2">Risk Score</p>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-dark-100">{scanData.filename}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getClassBadge(scanData.classification)}`}>
                    {scanData.classification?.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-dark-950 rounded-lg p-3 border border-dark-700">
                    <span className="text-dark-500 text-xs block">Size</span>
                    <span className="text-dark-100">{formatSize(scanData.file_size || scanData.size)}</span>
                  </div>
                  <div className="bg-dark-950 rounded-lg p-3 border border-dark-700">
                    <span className="text-dark-500 text-xs block">Type</span>
                    <span className="text-dark-100">{scanData.file_type || scanData.mime_type || '—'}</span>
                  </div>
                  <div className="bg-dark-950 rounded-lg p-3 border border-dark-700">
                    <span className="text-dark-500 text-xs block">Entropy</span>
                    <span className="text-dark-100">{scanData.entropy?.toFixed(2) || '—'}</span>
                  </div>
                  <div className="bg-dark-950 rounded-lg p-3 border border-dark-700">
                    <span className="text-dark-500 text-xs block">Scan Date</span>
                    <span className="text-dark-100 text-xs">
                      {scanData.created_at ? new Date(scanData.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-dark-200 font-semibold mb-4 flex items-center gap-2">
              <FiHash className="text-cyan-400" /> File Hashes
            </h3>
            <div className="space-y-2">
              {[
                { label: 'MD5', value: hashes.md5 },
                { label: 'SHA-1', value: hashes.sha1 },
                { label: 'SHA-256', value: hashes.sha256 },
              ].map((h) => h.value && (
                <div key={h.label} className="flex items-center justify-between bg-dark-950 rounded-lg px-4 py-2.5 border border-dark-700">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-dark-500 text-xs font-medium w-16 flex-shrink-0">{h.label}</span>
                    <code className="text-dark-200 text-xs font-mono truncate">{h.value}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(h.value)}
                    className="text-dark-500 hover:text-cyan-400 ml-2 flex-shrink-0"
                    title="Copy"
                  >
                    <FiCopy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {reasons.length > 0 && (
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
              <h3 className="text-dark-200 font-semibold mb-3 flex items-center gap-2">
                <FiAlertTriangle className="text-red-400" /> Detection Reasons
              </h3>
              <ul className="space-y-2">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark-300 bg-dark-950 rounded-lg px-4 py-2.5 border border-dark-700">
                    <FiAlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {yaraMatches.length > 0 && (
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
              <h3 className="text-dark-200 font-semibold mb-3 flex items-center gap-2">
                <FiShield className="text-yellow-400" /> YARA Matches
              </h3>
              <div className="space-y-2">
                {yaraMatches.map((m, i) => (
                  <div key={i} className="bg-dark-950 rounded-lg px-4 py-3 border border-dark-700">
                    <div className="flex items-center gap-2 mb-1">
                      <FiLock className="text-yellow-400" size={14} />
                      <span className="text-dark-100 text-sm font-medium">
                        {typeof m === 'string' ? m : m.rule_name || m.name || m}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-dark-400 text-xs ml-6">{m.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {suspiciousStrings.length > 0 && (
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
              <h3 className="text-dark-200 font-semibold mb-3 flex items-center gap-2">
                <FiCpu className="text-orange-400" /> Suspicious Strings
              </h3>
              <div className="space-y-1.5">
                {suspiciousStrings.map((s, i) => (
                  <div key={i} className="bg-dark-950 rounded-lg px-4 py-2 border border-dark-700 font-mono text-xs text-dark-300 flex items-center gap-2">
                    <span className="text-dark-600 w-8 flex-shrink-0">#{i + 1}</span>
                    <span className="truncate">{typeof s === 'string' ? s : s.value || JSON.stringify(s)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Link
              to={`/scan/${scanData.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-100 rounded-lg transition-colors"
            >
              <FiExternalLink />
              View Full Report
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
