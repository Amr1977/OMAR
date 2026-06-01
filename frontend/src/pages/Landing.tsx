import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const dashboardLink = user.role === 'GROOM' ? '/profile/my' : '/browse';
    return (
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold text-[#1B4332] mb-4">
          {t('app.name')}
        </h1>
        <p className="text-lg text-[#6B7280] mb-8">{t('app.tagline')}</p>
        <Link
          to={dashboardLink}
          className="inline-block px-8 py-3 bg-[#1B4332] text-white rounded-lg text-lg font-medium hover:bg-[#2D6A4F]"
        >
          {user.role === 'GROOM' ? t('profile.my') : t('browse.title')}
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-[#1B4332] mb-6 font-display">
          {t('app.name')}
        </h1>
        <p className="text-xl text-[#6B7280] mb-4">{t('app.tagline')}</p>
        <p className="text-base text-[#6B7280] mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('app.description')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-[#1B4332] text-white rounded-lg text-lg font-medium hover:bg-[#2D6A4F] transition-colors"
          >
            {t('nav.register')}
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border border-[#1B4332] text-[#1B4332] rounded-lg text-lg font-medium hover:bg-[#D8F3DC] transition-colors"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-24 px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E7EB]">
            <div className="w-12 h-12 bg-[#D8F3DC] rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1B4332] mb-2">
              للراغبين في الزواج
            </h3>
            <p className="text-sm text-[#6B7280]">
              أنشئ ملفك الشخصي وتعرف على الأولياء المهتمين
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E7EB]">
            <div className="w-12 h-12 bg-[#D8F3DC] rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">👪</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1B4332] mb-2">
              للأولياء
            </h3>
            <p className="text-sm text-[#6B7280]">
              تصفح الملفات الشخصية واختر الأنسب لمن ترعى
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E7EB]">
            <div className="w-12 h-12 bg-[#D8F3DC] rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1B4332] mb-2">
              تواصل آمن
            </h3>
            <p className="text-sm text-[#6B7280]">
              تواصل مع الطرف الآخر عبر الرسائل النصية الآمنة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
