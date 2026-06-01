import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export default function Browse() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v as string);
    });
    api.browse.profiles(params.toString())
      .then((res: any) => setProfiles(res.profiles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332]">{t('browse.title')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm hover:bg-gray-50"
          >
            {t('browse.filters')}
          </button>
          <Link
            to="/ai-suggestions"
            className="px-4 py-2 bg-[#1B4332] text-white rounded-lg text-sm hover:bg-[#2D6A4F]"
          >
            {t('browse.aiSuggestions')}
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">السن من</label>
              <input type="number" onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">السن إلى</label>
              <input type="number" onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">الجنسية</label>
              <input type="text" onChange={(e) => setFilters({ ...filters, nationality: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">المدينة</label>
              <input type="text" onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">المذهب</label>
              <select onChange={(e) => setFilters({ ...filters, madhab: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white">
                <option value="">الكل</option>
                <option value="HANAFI">حنفي</option>
                <option value="MALIKI">مالكي</option>
                <option value="SHAFII">شافعي</option>
                <option value="HANBALI">حنبلي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">الالتزام بالصلاة</label>
              <select onChange={(e) => setFilters({ ...filters, prayerCommitment: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white">
                <option value="">الكل</option>
                <option value="ALWAYS">دائماً</option>
                <option value="MOSTLY">أغلب الأحيان</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => { setFilters({}); setShowFilters(false); }}
            className="mt-4 text-sm text-[#6B7280] hover:text-red-500"
          >
            مسح التصفية
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">{t('browse.noResults')}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile: any) => (
            <Link
              key={profile.id}
              to={`/browse/${profile.id}`}
              className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow"
            >
              {profile.photos?.[0] && (
                <img
                  src={profile.photos[0].url}
                  alt={profile.displayName}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-[#1B4332]">{profile.displayName}</h3>
                <p className="text-sm text-[#6B7280] mb-2">
                  {profile.age} سنة • {profile.city}, {profile.countryOfResidence}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-[#D8F3DC] text-[#1B4332] text-xs rounded-full">
                    {t(`profile.madhab.${profile.madhab}`)}
                  </span>
                  <span className="px-2 py-1 bg-[#FFF3CD] text-[#856404] text-xs rounded-full">
                    {t(`profile.marriageNumber.${profile.marriageNumber}`)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
