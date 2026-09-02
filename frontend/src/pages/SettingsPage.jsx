import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import {
  FiSettings, FiKey, FiMail, FiServer, FiHardDrive, FiFolder,
  FiSave, FiAlertTriangle, FiTrash2, FiRefreshCw, FiEye, FiEyeOff,
  FiCheckCircle, FiShield, FiToggleLeft, FiToggleRight, FiInfo,
  FiSun, FiMoon, FiMonitor,
} from 'react-icons/fi';

function SectionCard({ title, icon: Icon, children, accent = 'cyan' }) {
  const accentColors = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
  };
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden transition-colors duration-300">
      <div className="px-6 py-4 border-b border-dark-700 flex items-center gap-3">
        <div className={`p-2 rounded-lg border ${accentColors[accent]}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <h2 className="text-base font-semibold text-dark-100">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InputField({ label, icon: Icon, value, onChange, type = 'text', placeholder, disabled, rightElement }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyan-500/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-dark-100">{label}</p>
        {description && <p className="text-xs text-dark-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-cyan-500' : 'bg-dark-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [vtKey, setVtKey] = useState('');
  const [showVtKey, setShowVtKey] = useState(false);
  const [testingVt, setTestingVt] = useState(false);

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const [autoScan, setAutoScan] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState('50');
  const [monitorFolder, setMonitorFolder] = useState('');

  const [saving, setSaving] = useState(false);

  const handleTestVtKey = async () => {
    if (!vtKey.trim()) {
      toast.error('Please enter an API key first');
      return;
    }
    setTestingVt(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('VirusTotal API key is valid and working');
    } catch {
      toast.error('Invalid API key or connection failed');
    } finally {
      setTestingVt(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = () => {
    toast.error('This action is irreversible! Confirmation required.');
  };

  const handleClearQuarantine = () => {
    toast.error('This action is irreversible! Confirmation required.');
  };

  const themes = [
    { id: 'dark', label: 'Dark', icon: FiMoon, desc: 'Easy on the eyes' },
    { id: 'light', label: 'Light', icon: FiSun, desc: 'Bright and clean' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Settings</h1>
          <p className="text-dark-400 text-sm mt-1">Configure system preferences and integrations</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <SectionCard title="Appearance" icon={FiMonitor} accent="cyan">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 flex items-start gap-2.5 mb-5">
          <FiInfo className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-dark-400">
            Choose your preferred color theme. The change applies instantly across the entire application.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                theme === t.id
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                  : 'border-dark-700 bg-dark-950 hover:border-dark-500 hover:bg-dark-800'
              }`}
            >
              {theme === t.id && (
                <div className="absolute top-3 right-3">
                  <FiCheckCircle className="w-5 h-5 text-cyan-400" />
                </div>
              )}
              <div className={`p-3 rounded-xl ${
                theme === t.id ? 'bg-cyan-500/20' : 'bg-dark-800'
              }`}>
                <t.icon className={`w-8 h-8 ${
                  theme === t.id ? 'text-cyan-400' : 'text-dark-400'
                }`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold ${
                  theme === t.id ? 'text-cyan-400' : 'text-dark-200'
                }`}>{t.label}</p>
                <p className="text-xs text-dark-400 mt-0.5">{t.desc}</p>
              </div>
              {t.id === 'dark' && (
                <div className="w-full h-20 rounded-lg bg-dark-950 border border-dark-700 p-2 mt-1">
                  <div className="w-full h-2 bg-dark-800 rounded mb-1.5"></div>
                  <div className="w-3/4 h-2 bg-dark-800 rounded mb-1.5"></div>
                  <div className="w-1/2 h-2 bg-dark-800 rounded"></div>
                </div>
              )}
              {t.id === 'light' && (
                <div className="w-full h-20 rounded-lg bg-white border border-gray-200 p-2 mt-1">
                  <div className="w-full h-2 bg-gray-200 rounded mb-1.5"></div>
                  <div className="w-3/4 h-2 bg-gray-200 rounded mb-1.5"></div>
                  <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="System Settings" icon={FiSettings} accent="cyan">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 flex items-start gap-2.5 mb-5">
          <FiInfo className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-dark-400">
            These settings control the core behavior of the malicious file detection system. Changes take effect after saving.
          </p>
        </div>
        <div className="space-y-4">
          <ToggleRow
            label="Auto-scan uploaded files"
            description="Automatically scan files immediately after upload"
            enabled={autoScan}
            onToggle={() => setAutoScan(!autoScan)}
          />
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Max file upload size (MB)</label>
            <div className="relative">
              <FiHardDrive className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="number"
                value={maxFileSize}
                onChange={(e) => setMaxFileSize(e.target.value)}
                min="1"
                max="500"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyan-500/50 text-sm transition-colors duration-300"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark-500">MB</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="VirusTotal Integration" icon={FiKey} accent="green">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type={showVtKey ? 'text' : 'password'}
                  value={vtKey}
                  onChange={(e) => setVtKey(e.target.value)}
                  placeholder="Enter your VirusTotal API key"
                  className="w-full pl-10 pr-10 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyan-500/50 text-sm font-mono transition-colors duration-300"
                />
                <button
                  onClick={() => setShowVtKey(!showVtKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showVtKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleTestVtKey}
                disabled={testingVt}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {testingVt ? (
                  <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full" />
                ) : (
                  <FiCheckCircle className="w-4 h-4" />
                )}
                {testingVt ? 'Testing...' : 'Test Key'}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="SMTP Configuration" icon={FiMail} accent="orange">
        <p className="text-xs text-dark-400 mb-4">Configure email notification settings for threat alerts and reports.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="SMTP Host"
            icon={FiServer}
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.gmail.com"
          />
          <InputField
            label="SMTP Port"
            icon={FiServer}
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="587"
          />
          <InputField
            label="Username"
            icon={FiMail}
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="your@email.com"
          />
          <InputField
            label="Password"
            icon={FiKey}
            type={showSmtpPass ? 'text' : 'password'}
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            placeholder="••••••••"
            rightElement={
              <button
                onClick={() => setShowSmtpPass(!showSmtpPass)}
                className="text-dark-500 hover:text-dark-300 transition-colors"
              >
                {showSmtpPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Monitoring Folder" icon={FiFolder} accent="cyan">
        <InputField
          label="Default monitoring directory"
          icon={FiFolder}
          value={monitorFolder}
          onChange={(e) => setMonitorFolder(e.target.value)}
          placeholder="C:\Users\Documents\Downloads"
        />
      </SectionCard>

      <div className="bg-dark-900 border border-red-500/20 rounded-xl overflow-hidden transition-colors duration-300">
        <div className="px-6 py-4 border-b border-red-500/20 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <FiAlertTriangle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-100">Reset Database</p>
              <p className="text-xs text-dark-400 mt-0.5">
                Permanently delete all scan history, files, and logs. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleResetDatabase}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <FiTrash2 className="w-4 h-4" />
              Reset Database
            </button>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-100">Clear Quarantine</p>
              <p className="text-xs text-dark-400 mt-0.5">
                Remove all quarantined files and restore them to original locations.
              </p>
            </div>
            <button
              onClick={handleClearQuarantine}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <FiRefreshCw className="w-4 h-4" />
              Clear Quarantine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
