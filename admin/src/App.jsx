import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterOrg from './pages/RegisterOrg';
import Dashboard from './pages/Dashboard';
import EmployeeMgmt from './pages/EmployeeMgmt';
import AttendanceLogs from './pages/AttendanceLogs';
import Settings from './pages/Settings';
import AdminMgmt from './pages/AdminMgmt';
import FieldWarRoom from './pages/FieldWarRoom';
import TerritoryManager from './pages/TerritoryManager';
import PlanApproval from './pages/PlanApproval';
import Reports from './pages/Reports';
import ExpenseApproval from './pages/ExpenseApproval';
import AlertsCenter from './pages/AlertsCenter';
import LeaveRequests from './pages/LeaveRequests';
import OrgStructure from './pages/OrgStructure';
import FraudDashboard from './pages/FraudDashboard';
import NudgeCenter from './pages/NudgeCenter';
import TeamLeaderboard from './pages/TeamLeaderboard';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-org" element={<RegisterOrg />} />

        {/* Protected Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employees"
          element={
            <ProtectedRoute>
              <EmployeeMgmt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admins"
          element={
            <ProtectedRoute>
              <AdminMgmt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/org"
          element={
            <ProtectedRoute>
              <OrgStructure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/logs"
          element={
            <ProtectedRoute>
              <AttendanceLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/war-room"
          element={
            <ProtectedRoute>
              <FieldWarRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/territories"
          element={
            <ProtectedRoute>
              <TerritoryManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/approvals"
          element={
            <ProtectedRoute>
              <PlanApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/expenses"
          element={
            <ProtectedRoute>
              <ExpenseApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/alerts"
          element={
            <ProtectedRoute>
              <AlertsCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/leave"
          element={
            <ProtectedRoute>
              <LeaveRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/fraud"
          element={
            <ProtectedRoute>
              <FraudDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/nudge"
          element={
            <ProtectedRoute>
              <NudgeCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/leaderboard"
          element={
            <ProtectedRoute>
              <TeamLeaderboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
