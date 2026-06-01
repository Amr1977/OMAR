import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { changeLanguage } from '../i18n';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: t('nav.home') },
    ...(isAuthenticated && user?.role === 'GROOM'
      ? [
          { path: '/profile/my', label: t('nav.profile') },
          { path: '/requests', label: t('nav.requests') },
          { path: '/messages', label: t('nav.messages') },
        ]
      : []),
    ...(isAuthenticated && (user?.role === 'GUARDIAN' || user?.role === 'BOTH')
      ? [
          { path: '/browse', label: t('nav.browse') },
          { path: '/requests/sent', label: t('nav.requests') },
          { path: '/messages', label: t('nav.messages') },
        ]
      : []),
    ...(isAuthenticated && user?.role === 'ADMIN'
      ? [
          { path: '/admin', label: t('nav.admin') },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-[#1B4332] font-display">
                {t('app.name')}
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                        : 'text-[#6B7280] hover:text-[#1B4332]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="text-sm border border-[#E5E7EB] rounded px-2 py-1 bg-white"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="ur">اردو</option>
                <option value="fr">Français</option>
              </select>

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="text-sm font-medium text-[#1B4332] hover:text-[#2D6A4F]"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    className="text-sm font-medium text-[#6B7280] hover:text-[#1B4332]"
                  >
                    {t('nav.settings')}
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-red-500 hover:text-red-600"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-[#1B4332] border border-[#1B4332] rounded-lg hover:bg-[#D8F3DC]"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#2D6A4F]"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
