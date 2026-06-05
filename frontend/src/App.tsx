import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { requestPushPermission } from './lib/firebase';
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
import SocialFeed from './pages/social/SocialFeed';
import PostDetail from './pages/social/PostDetail';
import HafsaStory from './pages/siyar/HafsaStory';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProfiles from './pages/admin/AdminProfiles';
import AdminReports from './pages/admin/AdminReports';
import AdminPosts from './pages/admin/AdminPosts';
import AdminMessages from './pages/admin/AdminMessages';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminDonations from './pages/admin/AdminDonations';
import Feedback from './pages/Feedback';
import Donate from './pages/Donate';
import BrideList from './pages/guardian/BrideList';
import BrideForm from './pages/guardian/BrideForm';

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
  const { fetchMe, isAuthenticated } = useAuthStore();
  const askedPush = useRef(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (isAuthenticated && !askedPush.current) {
      askedPush.current = true;
      requestPushPermission();
    }
    if (!isAuthenticated) {
      askedPush.current = false;
    }
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="siyar/hafsa-bint-umar" element={<HafsaStory />} />
        <Route path="profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="profile/my" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="browse" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><Browse /></ProtectedRoute>} />
        <Route path="browse/:id" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><ProfileDetail /></ProtectedRoute>} />
        <Route path="ai-suggestions" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><AiSuggestions /></ProtectedRoute>} />
        <Route path="requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="requests/sent" element={<ProtectedRoute><SentRequests /></ProtectedRoute>} />
        <Route path="messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
        <Route path="social" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
        <Route path="social/post/:id" element={<PostDetail />} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="settings/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/profiles" element={<ProtectedRoute roles={['ADMIN']}><AdminProfiles /></ProtectedRoute>} />
        <Route path="admin/reports" element={<ProtectedRoute roles={['ADMIN']}><AdminReports /></ProtectedRoute>} />
        <Route path="admin/posts" element={<ProtectedRoute roles={['ADMIN']}><AdminPosts /></ProtectedRoute>} />
        <Route path="admin/messages" element={<ProtectedRoute roles={['ADMIN']}><AdminMessages /></ProtectedRoute>} />
        <Route path="admin/feedback" element={<ProtectedRoute roles={['ADMIN']}><AdminFeedback /></ProtectedRoute>} />
        <Route path="admin/subscriptions" element={<ProtectedRoute roles={['ADMIN']}><AdminSubscriptions /></ProtectedRoute>} />
        <Route path="admin/donations" element={<ProtectedRoute roles={['ADMIN']}><AdminDonations /></ProtectedRoute>} />
        <Route path="donate" element={<ProtectedRoute><Donate /></ProtectedRoute>} />
        <Route path="guardian/brides" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><BrideList /></ProtectedRoute>} />
        <Route path="guardian/brides/new" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><BrideForm /></ProtectedRoute>} />
        <Route path="guardian/brides/:id/edit" element={<ProtectedRoute roles={['GUARDIAN', 'BOTH', 'ADMIN']}><BrideForm /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
