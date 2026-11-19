import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoSwitcherModal from './components/DemoSwitcherModal';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import ReportComplaintPage from './pages/ReportComplaintPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import BrandOpsDeskPage from './pages/BrandOpsDeskPage';
import BrandsListPage from './pages/BrandsListPage';
import BrandScorecardPage from './pages/BrandScorecardPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CriticalFranchiseMapPage from './pages/CriticalFranchiseMapPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/brands" element={<BrandsListPage />} />
              <Route path="/brands/:slug" element={<BrandScorecardPage />} />
              <Route path="/radar" element={<CriticalFranchiseMapPage />} />
              <Route path="/map" element={<Navigate to="/radar" replace />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer Only Routes */}
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <ReportComplaintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-complaints"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <MyComplaintsPage />
                  </ProtectedRoute>
                }
              />

              {/* Brand Owner Only Routes */}
              <Route
                path="/brand-desk"
                element={
                  <ProtectedRoute allowedRoles={['brandowner']}>
                    <BrandOpsDeskPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Only Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
          <DemoSwitcherModal />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
