import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../stores/themeStore';
import { api, photoUrl } from '../lib/api';
import { onNewNotification } from '../lib/socket';
import UserAvatar from './UserAvatar';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setProfilePhoto(null); return; }
    api.profile.getMy().then((p: any) => {
      const url = p.photos?.[0]?.url || null;
      setProfilePhoto(url);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    api.notifications.list().then((res: any) => {
      setUnreadCount(res.unreadCount || 0);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    onNewNotification(() => {
      setUnreadCount((prev) => prev + 1);
    });
  }, []);

  useEffect(() => {
    setUnreadCount(0);
  }, [location.pathname === '/notifications']);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: t('nav.home') },
    ...(isAuthenticated
      ? [
          { path: '/social', label: 'المنشورات' },
          { path: '/profile/my', label: t('profile.my') },
        ]
      : []),
    ...(isAuthenticated && user?.role === 'GROOM'
      ? [
          { path: '/requests', label: t('nav.requests') },
          { path: '/messages', label: t('nav.messages') },
        ]
      : []),
    ...(isAuthenticated && (user?.role === 'GUARDIAN' || user?.role === 'BOTH')
      ? [
          { path: '/browse', label: t('nav.browse') },
          { path: '/guardian/brides', label: 'العرائس' },
          { path: '/requests/sent', label: t('nav.requests') },
          { path: '/messages', label: t('nav.messages') },
        ]
      : []),
    ...(isAuthenticated && user?.role === 'SOCIAL'
      ? [
          { path: '/social', label: 'المنشورات' },
          { path: '/profile/my', label: t('profile.my') },
        ]
      : []),
    ...(isAuthenticated && user?.role === 'ADMIN'
      ? [
          { path: '/admin', label: 'لوحة التحكم' },
          { path: '/admin/users', label: 'المستخدمين' },
          { path: '/admin/profiles', label: 'الملفات' },
          { path: '/admin/posts', label: 'المنشورات' },
          { path: '/admin/messages', label: 'المحادثات' },
          { path: '/admin/reports', label: 'التقارير' },
          { path: '/admin/feedback', label: 'الملاحظات' },
          { path: '/admin/subscriptions', label: 'الاشتراكات' },
          { path: '/admin/donations', label: 'التبرعات' },
        ]
      : []),
    ...(isAuthenticated
      ? [
          { path: '/settings/subscription', label: 'الاشتراك' },
          { path: '/donate', label: 'تبرع' },
          { path: '/feedback', label: 'تواصل معنا' },
        ]
      : []),
  ];

  const close = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Navbar */}
      <nav className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-[var(--color-primary)] font-display">
                {t('app.name')}
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-pale)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {isAuthenticated && (
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-pale)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] min-h-[18px]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile/my"
                    className="shrink-0"
                    title="الملف الشخصي"
                  >
                    <UserAvatar
                      photo={profilePhoto}
                      size="md"
                      role={user?.role}
                      subscriptionPlan={user?.subscriptionPlan}
                    />
                  </Link>
                  <Link
                    to="/settings"
                    className="hidden md:inline text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                  >
                    {t('nav.settings')}
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden md:inline text-sm font-medium text-red-500 hover:text-red-600"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-[var(--color-primary)] border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-pale)]"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-light)]"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile side drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={close} />
          {/* Drawer */}
          <div className={`fixed top-0 ${i18n.language === 'ar' ? 'left-0' : 'right-0'} h-full w-72 bg-[var(--color-surface)] shadow-xl z-50 flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] shrink-0">
              <Link to="/" onClick={close} className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('app.name')}
              </Link>
              <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile card (authenticated only) */}
            {isAuthenticated && (
              <div className="p-3 border-b border-[var(--color-border)] shrink-0">
                <Link
                  to="/profile/my"
                  onClick={close}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="shrink-0">
                    <UserAvatar
                      photo={profilePhoto}
                      size="lg"
                      role={user?.role}
                      subscriptionPlan={user?.subscriptionPlan}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {user?.email || 'الملف الشخصي'}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      عرض الملف الشخصي
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--color-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Nav links - scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={close}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive(link.path)
                      ? 'bg-[var(--color-primary-pale)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-700 hover:translate-x-1'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-all duration-150 ${
                    isActive(link.path) ? 'bg-[var(--color-primary)] scale-110' : 'bg-transparent'
                  }`} />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Bottom actions */}
            {isAuthenticated && (
              <div className="border-t border-[var(--color-border)] p-3 space-y-1 shrink-0 bg-[var(--color-surface)]">
                <Link
                  to="/settings"
                  onClick={close}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('nav.settings')}
                </Link>
                <button
                  onClick={() => { logout(); close(); }}
                  className="flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('nav.logout')}
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="border-t border-[var(--color-border)] p-4 space-y-2 shrink-0">
                <Link
                  to="/login"
                  onClick={close}
                  className="block w-full text-center px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-[var(--color-primary-pale)] transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={close}
                  className="block w-full text-center px-4 py-3 rounded-xl text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer with version */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span>© {new Date().getFullYear()} {t('app.name')}</span>
          <span className="font-mono" dir="ltr">v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}</span>
        </div>
      </footer>
    </div>
  );
}
