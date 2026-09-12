import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TenderManagement from './pages/TenderManagement';
import BidderVerification from './pages/BidderVerification';
import ComplianceReport from './pages/ComplianceReport';
import AuditTrail from './pages/AuditTrail';
import Settings from './pages/Settings';
import VendorPortal from './pages/VendorPortal';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/vendor" element={<VendorPortal />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tenders" element={<TenderManagement />} />
        <Route path="verification" element={<ErrorBoundary><BidderVerification /></ErrorBoundary>} />
        <Route path="verification/:id" element={<ErrorBoundary><BidderVerification /></ErrorBoundary>} />
        <Route path="reports" element={<ComplianceReport />} />
        <Route path="audit" element={<AuditTrail />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <AppRoutes />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;