import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { photoUrl } from '../../lib/api';

export default function Browse() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [proposingToProfile, setProposingToProfile] = useState<any>(null);
  const [myBrides, setMyBrides] = useState<any[]>([]);
  const [selectedBrideForProposal, setSelectedBrideForProposal] = useState('');
  const [proposalNote, setProposalNote] = useState('');
  const [proposalSending, setProposalSending] = useState(false);

  useEffect(() => {
    api.brides.list().then(setMyBrides).catch(() => {});
  }, []);

  const handleGuardianPropose = async () => {
    if (!selectedBrideForProposal || !proposingToProfile) return;
    setProposalSending(true);
    try {
      await api.requests.guardianPropose({
        groomProfileId: proposingToProfile.id,
        brideId: selectedBrideForProposal,
        guardianNote: proposalNote.trim() || undefined,
      });
      setProposingToProfile(null);
      setSelectedBrideForProposal('');
      setProposalNote('');
      alert('تم إرسال التقدم للعريس بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل الإرسال');
    } finally {
      setProposalSending(false);
    }
  };

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
            <div
              key={profile.id}
              className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link to={`/browse/${profile.id}`}>
                {profile.photos?.[0] && (
                  <img
                    src={photoUrl(profile.photos[0].url)}
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
              <div className="px-4 pb-4">
                <button
                  onClick={() => setProposingToProfile(profile)}
                  className="w-full py-2 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8] transition-colors"
                >
                  تقدم بموليتي لهذا العريس
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {proposingToProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setProposingToProfile(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()} dir="rtl">
            <h2 className="text-xl font-bold text-[#1B4332] dark:text-gray-100 mb-2">تقدم للعريس</h2>
            <p className="text-sm text-[#6B7280] mb-5">
              أنت تتقدم للعريس: <strong className="text-[#1B4332] dark:text-gray-200">{proposingToProfile.displayName}</strong>
            </p>

            {myBrides.filter((b: any) => b.status === 'ACTIVE' && b.iddahComplete).length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[#6B7280] text-sm mb-3">لا توجد سجلات نشطة قابلة للتقدم</p>
                <a href="/guardian/brides/new" className="text-[#DAA520] text-sm hover:underline">إضافة سجل جديد</a>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">اختر موليتك</label>
                <select
                  value={selectedBrideForProposal}
                  onChange={e => setSelectedBrideForProposal(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl mb-4 bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100"
                >
                  <option value="">اختر...</option>
                  {myBrides
                    .filter((b: any) => b.status === 'ACTIVE' && b.iddahComplete)
                    .map((b: any) => (
                      <option key={b.id} value={b.id}>
                        عروس #{b.id.slice(-5)} · {b.age} سنة · {b.residenceGovernorate || '-'}
                      </option>
                    ))}
                </select>

                <label className="block text-sm font-medium text-[#6B7280] mb-2">كلمة لولي أمر العريس (اختياري)</label>
                <textarea
                  value={proposalNote}
                  onChange={e => setProposalNote(e.target.value)}
                  placeholder="تعريف موجز بالموليه أو أي ملاحظة..."
                  rows={3}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl mb-4 bg-white dark:bg-gray-700 text-sm resize-none focus:outline-none focus:border-[#DAA520]"
                />

                <div className="flex gap-3">
                  <button
                    onClick={handleGuardianPropose}
                    disabled={proposalSending || !selectedBrideForProposal}
                    className="flex-1 py-3 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl text-sm font-bold hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
                  >
                    {proposalSending ? 'جاري الإرسال...' : 'إرسال التقدم'}
                  </button>
                  <button onClick={() => setProposingToProfile(null)} className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#6B7280] hover:bg-gray-50 dark:hover:bg-gray-700">
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
