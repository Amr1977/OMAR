import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export default function AiSuggestions() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wardInfo, setWardInfo] = useState({
    wardAge: '',
    wardNationality: '',
    wardMaritalStatus: '',
  });

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(wardInfo).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const res: any = await api.browse.aiSuggestions(params.toString());
      setSuggestions(res.suggestions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">{t('browse.aiSuggestions')}</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] mb-6">
        <h2 className="font-semibold mb-4">معلومات المولية (لحساب التطابق)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-[#6B7280] mb-1">العمر</label>
            <input
              type="number"
              value={wardInfo.wardAge}
              onChange={(e) => setWardInfo({ ...wardInfo, wardAge: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-[#6B7280] mb-1">الجنسية</label>
            <input
              type="text"
              value={wardInfo.wardNationality}
              onChange={(e) => setWardInfo({ ...wardInfo, wardNationality: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchSuggestions}
              className="px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]"
            >
              احسب التطابق
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">{t('browse.noResults')}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((profile: any) => (
            <Link
              key={profile.id}
              to={`/browse/${profile.id}`}
              className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[#1B4332]">{profile.displayName}</h3>
                  <span className="px-2 py-1 bg-[#1B4332] text-white text-xs rounded-full">
                    {profile.matchScore}%
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] mb-2">
                  {profile.age} سنة • {profile.city}, {profile.countryOfResidence}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-[#D8F3DC] text-[#1B4332] text-xs rounded-full">
                    {t(`profile.madhab.${profile.madhab}`)}
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
