import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoSwitcherModal from './components/DemoSwitcherModal';

import HomePage from './pages/HomePage';
import ReportComplaintPage from './pages/ReportComplaintPage';
import BrandsListPage from './pages/BrandsListPage';
import BrandScorecardPage from './pages/BrandScorecardPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
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
              <Route path="/" element={<HomePage />} />
              <Route path="/report" element={<ReportComplaintPage />} />
              <Route path="/brands" element={<BrandsListPage />} />
              <Route path="/brands/:slug" element={<BrandScorecardPage />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
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
