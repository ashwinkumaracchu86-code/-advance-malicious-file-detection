import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiGrid, FiUpload, FiClock, FiShield, FiCpu, FiFolder, FiFileText,
  FiActivity, FiSettings, FiChevronLeft, FiChevronRight, FiLogOut,
  FiUser, FiX, FiShield as FiShieldIcon, FiShieldOff,
} from 'react-icons/fi';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: FiGrid },
  { path: '/antivirus', label: 'Antivirus', icon: FiShieldOff },
  { path: '/scanner', label: 'File Scanner', icon: FiUpload },
  { path: '/history', label: 'Scan History', icon: FiClock },
  { path: '/quarantine', label: 'Quarantine', icon: FiShield },
  { path: '/usb-scanner', label: 'USB Scanner', icon: FiCpu },
  { path: '/folder-monitor', label: 'Folder Monitor', icon: FiFolder },
  { path: '/reports', label: 'Reports', icon: FiFileText },
  { path: '/security-logs', label: 'Security Logs', icon: FiActivity },
  { path: '/settings', label: 'Settings', icon: FiSettings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const getInitials = () => {
    const name = user?.username || user?.name || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-dark-900 border-r border-dark-700 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        <div className={`flex items-center h-16 px-4 border-b border-dark-700 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                <FiShieldIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="font-semibold text-dark-100 text-sm tracking-tight">MFDS</span>
                <span className="block text-[10px] text-dark-500 -mt-0.5">Security Scanner</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
              <FiShieldIcon className="w-4 h-4 text-cyan-400" />
            </div>
          )}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-md text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'} space-y-1`}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <NavLink
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.08)]'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800 border border-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className={`border-t border-dark-700 p-3 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-dark-800 border border-dark-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">{getInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-100 truncate">
                  {user?.username || user?.name || 'User'}
                </p>
                <p className="text-[11px] text-dark-500 truncate">
                  {user?.is_admin ? 'Administrator' : 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Logout"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{getInitials()}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Logout"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
