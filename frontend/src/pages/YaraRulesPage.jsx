import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FiCode, FiUpload, FiTrash2, FiRefreshCw, FiEye, FiFileText
} from 'react-icons/fi';
import { featuresAPI } from '../services/api';

export default function YaraRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleContent, setRuleContent] = useState('');
  const fileInputRef = useRef(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await featuresAPI.getYaraRules();
      setRules(res.data.rules || []);
    } catch (err) {
      console.error('Failed to fetch YARA rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await featuresAPI.uploadYaraRule(formData);
      toast.success(`Rule "${file.name}" uploaded`);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Delete rule "${filename}"?`)) return;
    try {
      await featuresAPI.deleteYaraRule(filename);
      toast.success('Rule deleted');
      fetchRules();
      if (selectedRule === filename) {
        setSelectedRule(null);
        setRuleContent('');
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleView = async (filename) => {
    try {
      const res = await featuresAPI.getYaraRuleContent(filename);
      setSelectedRule(filename);
      setRuleContent(res.data.content);
    } catch (err) {
      toast.error('Failed to load rule');
    }
  };

  const handleReload = async () => {
    try {
      const res = await featuresAPI.reloadYaraRules();
      toast.success(`Rules reloaded (${res.data.rules_count} rules)`);
      fetchRules();
    } catch (err) {
      toast.error('Failed to reload rules');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
            <FiCode className="text-cyan-400" /> YARA Rules
          </h1>
          <p className="text-dark-400 text-sm mt-1">Manage custom YARA detection rules</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-dark-900 border border-dark-700 text-dark-300 hover:bg-dark-800 hover:text-cyan-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" /> Reload
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FiUpload className="w-4 h-4" /> Upload Rule
          </button>
          <input ref={fileInputRef} type="file" accept=".yar,.yara,.rule" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700 flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-dark-100">Rule Files ({rules.length})</h3>
          </div>
          {rules.length === 0 ? (
            <div className="p-8 text-center text-dark-500 text-sm">No YARA rule files found</div>
          ) : (
            <div className="divide-y divide-dark-700/50 max-h-[500px] overflow-y-auto">
              {rules.map((rule) => (
                <div key={rule.filename} className={`px-5 py-3 hover:bg-dark-950 transition-colors ${selectedRule === rule.filename ? 'bg-dark-950' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiCode className="w-4 h-4 text-cyan-400" />
                      <div>
                        <p className="text-sm font-medium text-dark-100">{rule.filename}</p>
                        <p className="text-xs text-dark-400">{rule.size} bytes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleView(rule.filename)} className="p-1.5 rounded-lg hover:bg-dark-800 transition-colors" title="View">
                        <FiEye className="w-4 h-4 text-cyan-400" />
                      </button>
                      <button onClick={() => handleDelete(rule.filename)} className="p-1.5 rounded-lg hover:bg-dark-800 transition-colors" title="Delete">
                        <FiTrash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700 flex items-center gap-2">
            <FiEye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-dark-100">
              {selectedRule ? `Viewing: ${selectedRule}` : 'Rule Content'}
            </h3>
          </div>
          {ruleContent ? (
            <pre className="p-5 text-sm text-dark-200 font-mono overflow-x-auto max-h-[500px] overflow-y-auto bg-dark-950">
              {ruleContent}
            </pre>
          ) : (
            <div className="p-8 text-center text-dark-500 text-sm">Select a rule to view its content</div>
          )}
        </div>
      </div>
    </div>
  );
}
