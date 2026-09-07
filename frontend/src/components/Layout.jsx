import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { GalaxyBackground } from './GalaxyBackground';
import './GalaxyBackground/galaxy.css';

const pageTitles = {
  '/dashboard': 'Security Dashboard',
  '/antivirus': 'Antivirus Protection',
  '/scanner': 'File Scanner',
  '/history': 'Scan History',
  '/quarantine': 'Quarantine',
  '/usb-scanner': 'USB Scanner',
  '/folder-monitor': 'Folder Monitor',
  '/scheduled-scans': 'Scheduled Scans',
  '/yara-rules': 'YARA Rules',
  '/reports': 'Reports',
  '/export': 'Export Data',
  '/system-health': 'System Health',
  '/security-logs': 'Security Logs',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const pathKey = Object.keys(pageTitles).find((key) =>
    location.pathname.startsWith(key)
  );
  const title = pageTitles[pathKey] || 'Advanced Malicious File Detection System';

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <GalaxyBackground />
      <div className="relative z-10">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <Navbar title={title} />
          <main className="p-6 pt-20">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
