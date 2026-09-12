import fs from 'fs';
import path from 'path';

const root = 'c:\\Users\\ASUS\\Documents\\antigravity\\calm-nobel\\gem-bid-verify\\frontend';

const files = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <title>GeM Bid Compliance Verification</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,

  'src/styles/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Noto Sans', sans-serif;
  @apply bg-slate-50 text-slate-800;
}

/* Custom Chart Animations */
@keyframes fillGauge {
  0% { stroke-dasharray: 0 100; }
}

.gauge-arc {
  animation: fillGauge 1s ease-out forwards;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  @apply bg-slate-100;
}
::-webkit-scrollbar-thumb {
  @apply bg-slate-300 rounded;
}
::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-400;
}`,

  'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,

  'src/App.jsx': `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TenderManagement from './pages/TenderManagement';
import BidderVerification from './pages/BidderVerification';
import ComplianceReport from './pages/ComplianceReport';
import AuditTrail from './pages/AuditTrail';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tenders" element={<TenderManagement />} />
        <Route path="verification" element={<BidderVerification />} />
        <Route path="verification/:id" element={<BidderVerification />} />
        <Route path="reports" element={<ComplianceReport />} />
        <Route path="audit" element={<AuditTrail />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;`,

  'src/utils/helpers.js': `export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const getScoreColor = (score) => {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
};

export const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'verified':
    case 'completed':
    case 'active':
      return 'bg-success/10 text-success border-success/20';
    case 'pending':
    case 'in progress':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'failed':
    case 'rejected':
      return 'bg-danger/10 text-danger border-danger/20';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};`,

  'src/utils/dummyData.js': `export const stats = {
  totalTenders: 1245,
  pendingVerifications: 432,
  complianceRate: 87,
  activeBidders: 8904
};

export const tenders = [
  { id: 'GEM/2026/B/1', title: 'Procurement of Server Racks', dept: 'Ministry of IT', value: '₹45,00,000', status: 'Active', closingDate: '2026-10-15T18:00:00Z', bids: 12 },
  { id: 'GEM/2026/B/2', title: 'Office Furniture Supply', dept: 'CPWD', value: '₹12,50,000', status: 'Active', closingDate: '2026-09-30T15:00:00Z', bids: 5 },
  { id: 'GEM/2026/B/3', title: 'CCTV Camera Installation', dept: 'Railways', value: '₹85,00,000', status: 'Pending', closingDate: '2026-09-25T12:00:00Z', bids: 0 },
  { id: 'GEM/2026/B/4', title: 'Laptops for Schools', dept: 'Education', value: '₹2,50,00,000', status: 'Active', closingDate: '2026-11-01T10:00:00Z', bids: 25 },
  { id: 'GEM/2026/B/5', title: 'Medical Equipment', dept: 'Health', value: '₹5,00,00,000', status: 'Completed', closingDate: '2026-08-15T18:00:00Z', bids: 8 }
];

export const bidders = [
  { id: 'BID101', name: 'TechSolutions India Pvt Ltd', udyam: 'UDYAM-MH-12-0001234', status: 'Verified', score: 95 },
  { id: 'BID102', name: 'Global Traders', udyam: 'UDYAM-DL-05-0005678', status: 'Pending', score: 65 },
  { id: 'BID103', name: 'Apex Manufacturing', udyam: 'UDYAM-GJ-01-0009012', status: 'Failed', score: 40 },
  { id: 'BID104', name: 'Rapid Logistics', udyam: 'UDYAM-TN-02-0003456', status: 'Verified', score: 88 },
  { id: 'BID105', name: 'Secure IT Networks', udyam: 'UDYAM-KA-09-0007890', status: 'Verified', score: 92 }
];

export const recentActivity = [
  { id: 1, action: 'Bidder Verified', entity: 'TechSolutions India Pvt Ltd', user: 'Admin System', time: '2026-09-10T10:30:00Z', status: 'Success' },
  { id: 2, action: 'Document Rejected', entity: 'Global Traders (GST)', user: 'AI Engine', time: '2026-09-10T09:15:00Z', status: 'Failed' },
  { id: 3, action: 'Tender Published', entity: 'GEM/2026/B/4', user: 'Dept. Education', time: '2026-09-09T16:45:00Z', status: 'Success' },
  { id: 4, action: 'Anomaly Detected', entity: 'Apex Manufacturing', user: 'AI Engine', time: '2026-09-09T14:20:00Z', status: 'Warning' },
  { id: 5, action: 'Verification Started', entity: 'Rapid Logistics', user: 'System', time: '2026-09-08T11:00:00Z', status: 'Info' }
];

export const complianceDistribution = [
  { label: 'High Compliance (80-100)', value: 65, color: '#10b981' },
  { label: 'Medium Compliance (50-79)', value: 25, color: '#f59e0b' },
  { label: 'Low Compliance (0-49)', value: 10, color: '#ef4444' }
];

export const verificationDetails = {
  udyam: { status: 'Verified', score: 100, message: 'Valid MSME Certificate. Classification matches.' },
  gst: { status: 'Verified', score: 100, message: 'Active GSTIN. Returns filed consistently.' },
  pan: { status: 'Verified', score: 100, message: 'PAN matches company registration.' },
  epfo: { status: 'Pending', score: 60, message: 'Recent month contribution data pending.' },
  financial: { status: 'Failed', score: 30, message: 'Turnover does not meet tender criteria.' }
};`,

  'src/services/api.js': `import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Mock API
  headers: {
    'Content-Type': 'application/json'
  }
});

// Mock implementations since we don't have a real backend
export const login = async (credentials) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { token: 'mock-jwt-token', user: { name: 'Admin', role: 'Nodal Officer' } } });
    }, 1000);
  });
};

export default api;`,

  'src/context/AuthContext.jsx': `import React, { createContext, useState, useContext } from 'react';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default true for demo
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await apiLogin(credentials);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};`,

  'src/components/layout/Sidebar.jsx': `import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, CheckBadgeIcon, ChartBarIcon, ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Tenders', path: '/tenders', icon: DocumentTextIcon },
    { name: 'Verification', path: '/verification', icon: CheckBadgeIcon },
    { name: 'Reports', path: '/reports', icon: ChartBarIcon },
    { name: 'Audit Trail', path: '/audit', icon: ClockIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="w-64 bg-navy text-white flex flex-col h-full border-r border-navy-light shadow-xl z-10 hidden md:flex">
      <div className="h-16 flex items-center justify-center border-b border-navy-light/50 px-4">
        <div className="flex items-center gap-2">
          {/* Ashoka Chakra simplistic representation */}
          <div className="w-8 h-8 rounded-full border-2 border-saffron flex items-center justify-center relative">
            <div className="w-1 h-full bg-saffron/50 absolute rotate-0"></div>
            <div className="w-1 h-full bg-saffron/50 absolute rotate-45"></div>
            <div className="w-1 h-full bg-saffron/50 absolute rotate-90"></div>
            <div className="w-1 h-full bg-saffron/50 absolute rotate-[135deg]"></div>
            <div className="w-2 h-2 rounded-full bg-saffron z-10"></div>
          </div>
          <span className="font-bold text-xl tracking-wide">GeM Verify <span className="text-xs align-top text-saffron">AI</span></span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                \`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors \${
                  isActive
                    ? 'bg-navy-light text-white'
                    : 'text-slate-300 hover:bg-navy-light/50 hover:text-white'
                }\`
              }
            >
              <item.icon className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-slate-400 group-hover:text-white" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-navy-light/50 bg-navy-dark text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-2">
          <CheckBadgeIcon className="w-4 h-4 text-success" />
          <span>System Status: Online</span>
        </div>
        <p>Govt. of India Enterprise</p>
      </div>
    </div>
  );
}`,

  'src/components/layout/Header.jsx': `import React from 'react';
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-20 sticky top-0">
      <div className="flex flex-1">
        <div className="w-full max-w-lg lg:max-w-xs relative">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              className="block w-full rounded-md border-0 bg-slate-50 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-navy sm:text-sm sm:leading-6"
              placeholder="Search tenders, bidders, reports..."
              type="search"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-slate-500 flex items-center gap-1 text-sm font-medium">
          <LanguageIcon className="h-5 w-5" />
          <span className="hidden sm:block">A/अ</span>
        </button>
        
        <button className="relative text-slate-400 hover:text-slate-500">
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center border border-white">3</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3 relative group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">Nodal Officer</p>
            <p className="text-xs text-slate-500">Ministry of IT</p>
          </div>
          <UserCircleIcon className="h-8 w-8 text-navy" />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden group-hover:block">
            <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Profile</a>
            <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Settings</a>
            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-slate-100">Sign out</button>
          </div>
        </div>
      </div>
    </header>
  );
}`,

  'src/components/layout/Layout.jsx': `import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}`,

  'src/components/common/StatsCard.jsx': `import React from 'react';

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <p className={\`mt-2 text-sm flex items-center gap-1 \${trendUp ? 'text-success' : 'text-danger'}\`}>
            <span>{trendUp ? '↑' : '↓'}</span>
            <span>{trend}</span>
            <span className="text-slate-500 ml-1">vs last month</span>
          </p>
        )}
      </div>
      <div className="p-3 bg-slate-50 rounded-md">
        <Icon className="w-6 h-6 text-navy" />
      </div>
    </div>
  );
}`,

  'src/components/common/StatusBadge.jsx': `import React from 'react';
import { getStatusColor } from '../../utils/helpers';

export default function StatusBadge({ status, className = '' }) {
  const colorClass = getStatusColor(status);
  
  return (
    <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border \${colorClass} \${className}\`}>
      {status}
    </span>
  );
}`,

  'src/components/common/Button.jsx': `import React from 'react';

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-navy text-white hover:bg-navy-light focus:ring-navy",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-navy",
    accent: "bg-saffron text-white hover:bg-saffron-dark focus:ring-saffron",
    danger: "bg-danger text-white hover:bg-red-600 focus:ring-danger"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={\`\${baseStyle} \${variants[variant]} \${sizes[size]} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}`,

  'src/components/common/Modal.jsx': `import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-slate-900">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'src/components/dashboard/ComplianceChart.jsx': `import React from 'react';
import { complianceDistribution } from '../../utils/dummyData';

export default function ComplianceChart() {
  // Simple CSS-based segmented donut chart
  const total = complianceDistribution.reduce((acc, curr) => acc + curr.value, 0);
  let currentAngle = 0;

  const segments = complianceDistribution.map(segment => {
    const percentage = (segment.value / total) * 100;
    const strokeDasharray = \`\${percentage} \${100 - percentage}\`;
    const strokeDashoffset = -currentAngle;
    currentAngle += percentage;

    return {
      ...segment,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Compliance Distribution</h3>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {segments.map((segment, index) => (
              <circle
                key={index}
                cx="18" cy="18" r="15.91549430918954"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="4"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer"
              />
            ))}
            <circle cx="18" cy="18" r="12" fill="white" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-navy">87%</span>
            <span className="text-xs text-slate-500 text-center">Avg Score</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        {complianceDistribution.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-600">{item.label}</span>
            </div>
            <span className="font-semibold">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  'src/components/dashboard/RecentActivity.jsx': `import React from 'react';
import { recentActivity } from '../../utils/dummyData';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-medium text-slate-900">Recent Activity Logs</h3>
        <button className="text-sm text-navy hover:text-navy-light font-medium">View All</button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Entity</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {recentActivity.map((log, idx) => (
              <tr key={log.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{log.entity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(log.time)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={log.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,

  'src/components/dashboard/RiskHeatMap.jsx': `import React from 'react';

export default function RiskHeatMap() {
  // Simple CSS grid representing risk areas
  const areas = [
    { name: 'Financial', risk: 'high', score: 85 },
    { name: 'Technical', risk: 'low', score: 20 },
    { name: 'Compliance', risk: 'medium', score: 55 },
    { name: 'Past Perf.', risk: 'low', score: 15 },
    { name: 'Legal', risk: 'high', score: 92 },
    { name: 'Cyber', risk: 'medium', score: 48 },
  ];

  const getRiskColor = (risk) => {
    if (risk === 'high') return 'bg-danger/20 border-danger text-danger-dark';
    if (risk === 'medium') return 'bg-warning/20 border-warning text-warning-dark';
    return 'bg-success/20 border-success text-success-dark';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-slate-900">Risk Assessment Map</h3>
        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">AI Generated</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {areas.map((area, idx) => (
          <div key={idx} className={\`p-3 rounded-md border \${getRiskColor(area.risk)} flex flex-col justify-between h-24\`}>
            <span className="text-sm font-medium">{area.name}</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{area.score}</span>
              <span className="text-xs opacity-75 capitalize">{area.risk} Risk</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  'src/components/verification/VerificationCard.jsx': `import React from 'react';
import { getScoreColor } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';

export default function VerificationCard({ title, icon: Icon, data }) {
  const { status, score, message } = data;
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={\`p-2 rounded-lg \${status === 'Verified' ? 'bg-success/10 text-success' : status === 'Failed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}\`}>
            <Icon className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-slate-800">{title}</h4>
        </div>
        <StatusBadge status={status} />
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500">Confidence Score</span>
          <span className={\`font-bold \${getScoreColor(score)}\`}>{score}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className={\`h-2 rounded-full \${status === 'Verified' ? 'bg-success' : status === 'Failed' ? 'bg-danger' : 'bg-warning'}\`}
            style={{ width: \`\${score}%\` }}
          ></div>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 text-sm">
        {message}
      </p>
    </div>
  );
}`,

  'src/components/verification/ComplianceGauge.jsx': `import React from 'react';
import { getScoreColor } from '../../utils/helpers';

export default function ComplianceGauge({ score }) {
  const strokeDasharray = \`\${score} \${100 - score}\`;
  
  const getColor = (s) => {
    if (s >= 80) return '#10b981'; // success
    if (s >= 50) return '#f59e0b'; // warning
    return '#ef4444'; // danger
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger via-warning to-success"></div>
      
      <h3 className="text-lg font-medium text-slate-800 mb-4">Overall AI Compliance Score</h3>
      
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <circle
            cx="18" cy="18" r="15.91549430918954"
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15.91549430918954"
            fill="transparent"
            stroke={getColor(score)}
            strokeWidth="3"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            className="gauge-arc"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={\`text-4xl font-bold \${getScoreColor(score)}\`}>{score}</span>
          <span className="text-sm text-slate-500">out of 100</span>
        </div>
      </div>
      
      <p className="mt-4 text-center text-sm text-slate-600 max-w-xs">
        Score is generated by analyzing documents against tender requirements using AI models.
      </p>
    </div>
  );
}`,

  'src/components/verification/DocumentUpload.jsx': `import React, { useState } from 'react';
import { ArrowUpTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';

export default function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Dummy logic to add file
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({ name: f.name, size: (f.size / 1024).toFixed(2) + ' KB' }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-lg font-medium text-slate-800 mb-4">Upload Documents for AI Analysis</h3>
      
      <div 
        className={\`border-2 border-dashed rounded-lg p-8 text-center transition-colors \${dragActive ? 'border-navy bg-navy/5' : 'border-slate-300 hover:border-slate-400'}\`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <p className="text-sm text-slate-600 mb-1">Drag and drop your PDF or Image files here</p>
        <p className="text-xs text-slate-500 mb-4">Max file size: 10MB</p>
        <Button variant="secondary" size="sm">Browse Files</Button>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Uploaded Files</h4>
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="h-5 w-5 text-navy" />
                  <span className="text-sm font-medium text-slate-700">{f.name}</span>
                </div>
                <span className="text-xs text-slate-500">{f.size}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
             <Button variant="primary" className="gap-2">
               Analyze Documents 
               <span className="bg-white/20 px-1.5 rounded text-xs">AI</span>
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}`,

  'src/components/verification/AIRecommendation.jsx': `import React from 'react';
import { SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export default function AIRecommendation({ status = 'Warning' }) {
  const isPositive = status === 'Verified';

  return (
    <div className={\`rounded-lg p-5 border \${isPositive ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}\`}>
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className={\`h-5 w-5 \${isPositive ? 'text-success' : 'text-warning'}\`} />
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          AI Recommendation Engine
          <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Powered by AI</span>
        </h3>
      </div>
      
      <p className="text-sm text-slate-700 mb-4 leading-relaxed">
        {isPositive 
          ? "Based on cross-verification across GST, EPFO, and MSME databases, this bidder shows consistent financial health and compliance. The anomaly detection model found no significant risks."
          : "The system detected inconsistencies in the latest financial turnover documents compared to GST filings. The provided MSME certificate also appears to have an irregular format score (65% confidence)."
        }
      </p>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          {isPositive ? <CheckCircleIcon className="h-4 w-4 text-success mt-0.5" /> : <ExclamationTriangleIcon className="h-4 w-4 text-warning mt-0.5" />}
          <span className="text-sm text-slate-600">
            {isPositive ? 'Approve bidder for tender participation.' : 'Request manual review of Financial Turnover (FY 2025-26) document.'}
          </span>
        </div>
        <div className="flex items-start gap-2">
          {isPositive ? <CheckCircleIcon className="h-4 w-4 text-success mt-0.5" /> : <ExclamationTriangleIcon className="h-4 w-4 text-warning mt-0.5" />}
          <span className="text-sm text-slate-600">
            {isPositive ? 'Compliance score is above the 80% threshold.' : 'Verify MSME Udyam registration physically or via portal.'}
          </span>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/Login.jsx': `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login({ email, password });
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-navy z-0"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
            <div className="w-12 h-12 rounded-full border-2 border-navy flex items-center justify-center relative">
              <div className="w-1 h-full bg-navy/20 absolute rotate-0"></div>
              <div className="w-1 h-full bg-navy/20 absolute rotate-45"></div>
              <div className="w-1 h-full bg-navy/20 absolute rotate-90"></div>
              <div className="w-1 h-full bg-navy/20 absolute rotate-[135deg]"></div>
              <div className="w-2 h-2 rounded-full bg-navy z-10"></div>
            </div>
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
          Government e-Marketplace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          AI-Powered Bid Compliance Verification Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-200 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
                Official Email ID / User ID
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-navy sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-navy sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm leading-6">
                <a href="#" className="font-semibold text-navy hover:text-navy-light">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full justify-center" disabled={loading}>
                {loading ? 'Authenticating...' : 'Secure Login'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            <p>Protected by Government Identity Access Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/Dashboard.jsx': `import React from 'react';
import { DocumentTextIcon, CheckBadgeIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import StatsCard from '../components/common/StatsCard';
import ComplianceChart from '../components/dashboard/ComplianceChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import RiskHeatMap from '../components/dashboard/RiskHeatMap';
import { stats } from '../utils/dummyData';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of tender verification metrics and system status.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Last updated: Just now</span>
          <button className="text-navy hover:bg-slate-100 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Tenders" value={stats.totalTenders} icon={DocumentTextIcon} trend="12%" trendUp={true} />
        <StatsCard title="Pending Verifications" value={stats.pendingVerifications} icon={ClockIconPlaceholder} trend="5%" trendUp={false} />
        <StatsCard title="Avg Compliance Rate" value={\`\${stats.complianceRate}%\`} icon={ChartBarIcon} trend="2%" trendUp={true} />
        <StatsCard title="Active Bidders" value={stats.activeBidders} icon={UsersIcon} trend="8%" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96">
          <RecentActivity />
        </div>
        <div className="h-96">
          <ComplianceChart />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <RiskHeatMap />
      </div>
    </div>
  );
}

// Dummy clock icon for the stats card
function ClockIconPlaceholder(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}`,

  'src/pages/TenderManagement.jsx': `import React, { useState } from 'react';
import { tenders } from '../utils/dummyData';
import { formatDate } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import { FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TenderManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTenders = tenders.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tender Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and monitor active tenders and their associated bids.</p>
        </div>
        <Button className="gap-2 shrink-0">
          <PlusIcon className="w-5 h-5" />
          Create New Tender
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:max-w-md relative">
          <input
            type="text"
            placeholder="Search by Tender ID or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-navy focus:ring-navy sm:text-sm py-2 pl-3 pr-10 border"
          />
        </div>
        <Button variant="secondary" className="gap-2 w-full sm:w-auto">
          <FunnelIcon className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tender Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Est. Value</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Closing Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredTenders.map((tender, idx) => (
                <tr key={tender.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-100 transition-colors'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-navy">{tender.id}</span>
                      <span className="text-sm text-slate-600 truncate max-w-xs">{tender.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{tender.dept}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{tender.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(tender.closingDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={tender.status} />
                    <div className="text-xs text-slate-500 mt-1">{tender.bids} Bids Received</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" className="text-navy hover:text-navy-light mr-3">View</a>
                    <a href="#" className="text-saffron hover:text-saffron-dark">Verify Bids</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTenders.length === 0 && (
            <div className="p-8 text-center text-slate-500">No tenders found matching your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/BidderVerification.jsx': `import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { verificationDetails } from '../utils/dummyData';
import VerificationCard from '../components/verification/VerificationCard';
import ComplianceGauge from '../components/verification/ComplianceGauge';
import DocumentUpload from '../components/verification/DocumentUpload';
import AIRecommendation from '../components/verification/AIRecommendation';
import Button from '../components/common/Button';
import { 
  BuildingOfficeIcon, 
  BanknotesIcon, 
  IdentificationIcon, 
  UserGroupIcon, 
  DocumentChartBarIcon 
} from '@heroicons/react/24/outline';

export default function BidderVerification() {
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(2); // 1: Select, 2: Upload, 3: Verify, 4: Report
  
  // Hardcoded for demo
  const overallScore = 78;
  const bidderName = id ? \`Bidder \${id}\` : 'TechSolutions India Pvt Ltd';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bidder Verification</h1>
          <p className="mt-1 text-sm text-slate-500">AI-assisted compliance check for {bidderName}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary">Reject</Button>
           <Button variant="primary">Approve Bidder</Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="w-full py-4">
        <div className="flex items-center">
          {[
            { num: 1, label: 'Select Bidder' },
            { num: 2, label: 'Document Analysis' },
            { num: 3, label: 'Verification Results' },
            { num: 4, label: 'Final Decision' }
          ].map((step, idx, arr) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center relative">
                <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm \${currentStep >= step.num ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}\`}>
                  {step.num}
                </div>
                <span className={\`absolute top-10 text-xs w-24 text-center \${currentStep >= step.num ? 'font-medium text-slate-900' : 'text-slate-500'}\`}>
                  {step.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className={\`flex-1 h-1 mx-2 \${currentStep > step.num ? 'bg-navy' : 'bg-slate-200'}\`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <AIRecommendation status={overallScore >= 80 ? 'Verified' : 'Warning'} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VerificationCard title="MSME / Udyam" icon={BuildingOfficeIcon} data={verificationDetails.udyam} />
            <VerificationCard title="GST Verification" icon={BanknotesIcon} data={verificationDetails.gst} />
            <VerificationCard title="PAN & KYC" icon={IdentificationIcon} data={verificationDetails.pan} />
            <VerificationCard title="EPFO Compliance" icon={UserGroupIcon} data={verificationDetails.epfo} />
            <div className="md:col-span-2">
              <VerificationCard title="Financial Turnover" icon={DocumentChartBarIcon} data={verificationDetails.financial} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ComplianceGauge score={overallScore} />
          <DocumentUpload />
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/ComplianceReport.jsx': `import React from 'react';
import Button from '../components/common/Button';
import { PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ComplianceReport() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Generate and download detailed verification reports.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="gap-2">
            <PrinterIcon className="w-4 h-4" /> Print
          </Button>
          <Button variant="primary" className="gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8 border-b pb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800">Government of India</h2>
          <h3 className="text-lg font-semibold text-slate-600 mt-1">GeM AI Verification Report</h3>
          <p className="text-sm text-slate-500 mt-2">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="font-semibold text-slate-700 border-b pb-2 mb-3">Bidder Details</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><span className="font-medium text-slate-800">Name:</span> TechSolutions India Pvt Ltd</li>
              <li><span className="font-medium text-slate-800">ID:</span> BID101</li>
              <li><span className="font-medium text-slate-800">Category:</span> IT Hardware</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 border-b pb-2 mb-3">Tender Details</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><span className="font-medium text-slate-800">Tender ID:</span> GEM/2026/B/1</li>
              <li><span className="font-medium text-slate-800">Department:</span> Ministry of IT</li>
              <li><span className="font-medium text-slate-800">Value:</span> ₹45,00,000</li>
            </ul>
          </div>
        </div>

        <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">Detailed Assessment</h4>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-2">Parameter</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">AI Confidence</th>
              <th className="px-4 py-2">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-3 font-medium">MSME Udyam</td>
              <td className="px-4 py-3 text-success font-medium">Verified</td>
              <td className="px-4 py-3">100%</td>
              <td className="px-4 py-3 text-slate-500">Valid certificate match found.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">GST Records</td>
              <td className="px-4 py-3 text-success font-medium">Verified</td>
              <td className="px-4 py-3">98%</td>
              <td className="px-4 py-3 text-slate-500">Regular filings verified.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Financial Turnover</td>
              <td className="px-4 py-3 text-danger font-medium">Failed</td>
              <td className="px-4 py-3">30%</td>
              <td className="px-4 py-3 text-slate-500">Does not meet 3yr avg criteria.</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 flex justify-between items-end">
          <div className="text-sm text-slate-500">
            <p>System Generated Report</p>
            <p className="mt-1 font-mono text-xs">Hash: a7x9...42f1</p>
          </div>
          <div className="text-center border-t border-slate-300 pt-4 w-48">
            <p className="text-sm font-semibold">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/AuditTrail.jsx': `import React from 'react';
import RecentActivity from '../components/dashboard/RecentActivity';
import Button from '../components/common/Button';

export default function AuditTrail() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
          <p className="mt-1 text-sm text-slate-500">Immutable record of all verification activities and AI decisions.</p>
        </div>
        <Button variant="secondary">Export Logs</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex gap-4">
        <input type="date" className="rounded-md border-slate-300 text-sm" />
        <select className="rounded-md border-slate-300 text-sm">
          <option>All Events</option>
          <option>AI Approvals</option>
          <option>Manual Overrides</option>
          <option>Anomalies</option>
        </select>
        <input type="text" placeholder="Search entity..." className="rounded-md border-slate-300 text-sm flex-1" />
        <Button>Search</Button>
      </div>

      <div className="h-[600px]">
        <RecentActivity />
      </div>
    </div>
  );
}`
};

// Write files
Object.keys(files).forEach(filepath => {
  const fullPath = path.join(root, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, files[filepath], 'utf8');
});

console.log('All files created successfully.');
