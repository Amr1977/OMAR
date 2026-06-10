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
import GroomBrowseBrides from './pages/browse/GroomBrowseBrides';
import Requests from './pages/Requests';
import SentRequests from './pages/SentRequests';
import GroomInbox from './pages/GroomInbox';
import GuardianDashboard from './pages/GuardianDashboard';
import GroomDashboard from './pages/GroomDashboard';
import Messages from './pages/messages/Messages';
import Conversation from './pages/messages/Conversation';
import Notifications from './pages/Notifications';
import Settings from './pages/settings/Settings';
import Subscription from './pages/settings/Subscription';
import SocialFeed from './pages/social/SocialFeed';
import PostDetail from './pages/social/PostDetail';
import UserPublicProfile from './pages/social/UserPublicProfile';
import HashtagFeed from './pages/social/HashtagFeed';
import PeopleSearch from './pages/social/PeopleSearch';
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
import ServiceList from './pages/services/ServiceList';
import ServiceDetail from './pages/services/ServiceDetail';
import ServiceForm from './pages/services/ServiceForm';
import MyServices from './pages/services/MyServices';
import MyBookings from './pages/services/MyBookings';
import Search from './pages/Search';
import ConnectionRequests from './pages/connections/ConnectionRequests';
import ServiceRequests from './pages/serviceRequests/ServiceRequests';
import ServiceRequestForm from './pages/serviceRequests/ServiceRequestForm';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user) {
    const userRoles = user.roles || ['SOCIAL'];
    const hasRole = roles.some(r => userRoles.includes(r));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
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
        <Route path="marriage/hafsa" element={<HafsaStory />} />
        <Route path="profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="profile/my" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="browse" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><Browse /></ProtectedRoute>} />
        <Route path="browse/:id" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><ProfileDetail /></ProtectedRoute>} />
        <Route path="ai-suggestions" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><AiSuggestions /></ProtectedRoute>} />
        <Route path="requests" element={<ProtectedRoute roles={['GROOM', 'ADMIN']}><Requests /></ProtectedRoute>} />
        <Route path="requests/sent" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><SentRequests /></ProtectedRoute>} />
        <Route path="groom-inbox" element={<ProtectedRoute roles={['GROOM', 'ADMIN']}><GroomInbox /></ProtectedRoute>} />
        <Route path="guardian-dashboard" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><GuardianDashboard /></ProtectedRoute>} />
        <Route path="groom-dashboard" element={<ProtectedRoute roles={['GROOM', 'ADMIN']}><GroomDashboard /></ProtectedRoute>} />
        <Route path="brides/visible" element={<ProtectedRoute roles={['GROOM', 'ADMIN']}><GroomBrowseBrides /></ProtectedRoute>} />
        <Route path="messages" element={<ProtectedRoute roles={['GROOM', 'GUARDIAN', 'ADMIN']}><Messages /></ProtectedRoute>} />
        <Route path="messages/:id" element={<ProtectedRoute roles={['GROOM', 'GUARDIAN', 'ADMIN']}><Conversation /></ProtectedRoute>} />
        <Route path="social" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
        <Route path="social/user/:userId" element={<ProtectedRoute><UserPublicProfile /></ProtectedRoute>} />
        <Route path="social/hashtag/:tag" element={<ProtectedRoute><HashtagFeed /></ProtectedRoute>} />
        <Route path="social/people" element={<ProtectedRoute><PeopleSearch /></ProtectedRoute>} />
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
        <Route path="guardian/brides" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><BrideList /></ProtectedRoute>} />
        <Route path="guardian/brides/new" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><BrideForm /></ProtectedRoute>} />
        <Route path="guardian/brides/:id/edit" element={<ProtectedRoute roles={['GUARDIAN', 'ADMIN']}><BrideForm /></ProtectedRoute>} />
        <Route path="services" element={<ProtectedRoute><ServiceList /></ProtectedRoute>} />
        <Route path="services/new" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="services/:id/edit" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
        <Route path="my/services" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
        <Route path="my/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="connections" element={<ProtectedRoute><ConnectionRequests /></ProtectedRoute>} />
        <Route path="service-requests" element={<ProtectedRoute><ServiceRequests /></ProtectedRoute>} />
        <Route path="service-requests/new" element={<ProtectedRoute><ServiceRequestForm /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
