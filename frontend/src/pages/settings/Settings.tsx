import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { changeLanguage } from '../../i18n';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">{t('settings.title')}</h1>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
          <h2 className="font-semibold text-[#1B4332] mb-4">{t('settings.language')}</h2>
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg bg-white"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="ur">اردو</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
          <h2 className="font-semibold text-[#1B4332] mb-4">{t('settings.subscription')}</h2>
          <p className="text-[#6B7280] mb-3">
            {t('settings.currentPlan')}: <span className="font-medium text-[#1B4332]">
              {user?.subscriptionPlan === 'PREMIUM' ? t('settings.premium') : t('settings.free')}
            </span>
          </p>
          <Link
            to="/settings/subscription"
            className="inline-block px-4 py-2 bg-[#1B4332] text-white rounded-lg text-sm hover:bg-[#2D6A4F]"
          >
            {t('settings.upgrade')}
          </Link>
        </div>
      </div>
    </div>
  );
}
