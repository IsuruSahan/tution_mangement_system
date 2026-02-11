import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Auth Context & Guards ---
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// --- Navigation ---
import NavigationBar from './components/NavigationBar';

// --- Pages ---
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import PaymentsPage from './pages/PaymentsPage';
import AttendancePage from './pages/AttendancePage';
import FinanceReportPage from './pages/FinanceReportPage';
import SettingsPage from './pages/SettingsPage';
import ScanCheckInPage from './pages/ScanCheckInPage';
import LoginPage from './pages/LoginPage'; 
import RegisterPage from './pages/RegisterPage';

// A small internal component to handle redirecting logged-in users 
// away from public pages like Login and Register.
const PublicRoute = ({ children }) => {
    const { token, loading } = useAuth();
    
    // If we are still checking the token, show nothing or a spinner
    if (loading) return null; 
    
    return token ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <NavigationBar />
          
          <Routes>
            {/* --- Public Routes (Redirect if already logged in) --- */}
            <Route path="/login" element={
                <PublicRoute><LoginPage /></PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute><RegisterPage /></PublicRoute>
            } />

            {/* --- Protected Routes (Require Login) --- */}
            <Route path="/" element={
              <PrivateRoute><DashboardPage /></PrivateRoute>
            } />
            
            <Route path="/students" element={
              <PrivateRoute><StudentsPage /></PrivateRoute>
            } />
            
            <Route path="/payments" element={
              <PrivateRoute><PaymentsPage /></PrivateRoute>
            } />
            
            <Route path="/attendance" element={
              <PrivateRoute><AttendancePage /></PrivateRoute>
            } />
            
            <Route path="/finance-report" element={
              <PrivateRoute><FinanceReportPage /></PrivateRoute>
            } />

            <Route path="/settings" element={
              <PrivateRoute><SettingsPage /></PrivateRoute>
            } /> 

            <Route path="/scan" element={
              <PrivateRoute><ScanCheckInPage /></PrivateRoute>
            } />
            
            {/* Fallback for undefined routes */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;