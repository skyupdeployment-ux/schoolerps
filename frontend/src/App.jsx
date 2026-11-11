import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Examinations from './pages/Examinations';
import Library from './pages/Library';
import Transport from './pages/Transport';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Events from './pages/Events';
import FeePayment from './pages/FeePayment';
import BusTracking from './pages/BusTracking';
import IDCards from './pages/IDCards';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="classes" element={<Classes />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="examinations" element={<Examinations />} />
        <Route path="library" element={<Library />} />
        <Route path="transport" element={<Transport />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="events"       element={<Events />} />
        <Route path="fee-payment"  element={<FeePayment />} />
        <Route path="bus-tracking" element={<BusTracking />} />
        <Route path="id-cards"     element={<IDCards />} />
        <Route path="users"        element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}