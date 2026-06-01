import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProfileSetup from './pages/profile/ProfileSetup';
import MyProfile from './pages/profile/MyProfile';
import Browse from './pages/browse/Browse';
import ProfileDetail from './pages/browse/ProfileDetail';
import AiSuggestions from './pages/browse/AiSuggestions';
import Requests from './pages/Requests';
import SentRequests from './pages/SentRequests';
import Messages from './pages/messages/Messages';
import Conversation from './pages/messages/Conversation';
import Notifications from './pages/Notifications';
import Settings from './pages/settings/Settings';
import Subscription from './pages/settings/Subscription';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProfiles from './pages/admin/AdminProfiles';
import AdminReports from './pages/admin/AdminReports';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="profile/my" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="browse" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><Browse /></ProtectedRoute>} />
        <Route path="browse/:id" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><ProfileDetail /></ProtectedRoute>} />
        <Route path="ai-suggestions" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><AiSuggestions /></ProtectedRoute>} />
        <Route path="requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="requests/sent" element={<ProtectedRoute><SentRequests /></ProtectedRoute>} />
        <Route path="messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="settings/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/profiles" element={<ProtectedRoute roles={['ADMIN']}><AdminProfiles /></ProtectedRoute>} />
        <Route path="admin/reports" element={<ProtectedRoute roles={['ADMIN']}><AdminReports /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
