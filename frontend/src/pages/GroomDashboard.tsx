import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const profileStatusInfo: Record<string, { label: string; color: string; next: string; nextLink: string }> = {
  DRAFT: { label: 'مسودة', color: 'bg-gray-100 text-gray-600', next: 'أكمل ملفك الشخصي', nextLink: '/profile/setup' },
  PENDING_AI_REVIEW: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700', next: 'ملفك قيد المراجعة — انتظر قليلاً', nextLink: '' },
  APPROVED: { label: 'معتمد ✓', color: 'bg-green-100 text-green-700', next: 'تصفح السجلات المتاحة', nextLink: '/brides/visible' },
  REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-600', next: 'راجع ملفك وأعد التقديم', nextLink: '/profile/my' },
};

export default function GroomDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.requests.groomDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  const { profile, stats, recentExposures } = data || {};
  const statusInfo = profileStatusInfo[profile?.status] || profileStatusInfo['DRAFT'];

  return (
    <div className="max-w-4xl mx-auto py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100 mb-6">لوحة تحكم العريس</h1>

      <div className={`rounded-xl border p-5 mb-6 ${profile?.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-[#1B4332] dark:text-gray-100">حالة ملفك الشخصي</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        {profile ? (
          <p className="text-sm text-[#6B7280]">
            {profile.displayName} · الملف شوهد {profile.viewCount} مرة
            {profile.aiReviewScore ? ` · نقاط الجودة: ${Math.round(profile.aiReviewScore)}%` : ''}
          </p>
        ) : (
          <p className="text-sm text-[#6B7280]">لم تنشئ ملفك الشخصي بعد</p>
        )}
        {statusInfo.nextLink && (
          <Link to={statusInfo.nextLink} className="mt-3 inline-block px-4 py-2 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8]">
            {statusInfo.next}
          </Link>
        )}
        {!statusInfo.nextLink && <p className="mt-2 text-xs text-[#6B7280]">{statusInfo.next}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'سجلات متاحة لي', value: stats?.exposedBridesCount || 0, icon: '👁', link: '/brides/visible' },
          { label: 'طلباتي المرسلة', value: stats?.sentRequestsCount || 0, icon: '📤', link: '/groom-inbox' },
          { label: 'تقدمات إلي', value: stats?.pendingProposals || 0, icon: '📩', link: '/groom-inbox' },
          { label: 'محادثات نشطة', value: stats?.activeConversations || 0, icon: '💬', link: '/messages' },
        ].map(s => (
          <Link key={s.label} to={s.link} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center hover:border-[#DAA520] transition-colors">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">{s.value}</div>
            <div className="text-xs text-[#6B7280] mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {recentExposures?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1B4332] dark:text-gray-100">آخر السجلات المتاحة لك</h2>
            <Link to="/brides/visible" className="text-sm text-[#DAA520] hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-3">
            {recentExposures.map((exp: any) => (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#1B4332] dark:text-gray-200">
                    عروس #{exp.brideId?.slice(-5)} · {exp.bride?.age} سنة · {exp.bride?.residenceGovernorate || '-'}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {exp.bride?.maritalStatus} · {exp.bride?.prayerCommitment}
                    · متاح منذ {new Date(exp.exposedAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <Link to="/brides/visible" className="px-3 py-1.5 bg-[#DAA520] text-[#1B4332] rounded-lg text-xs font-bold hover:bg-[#F5E6B8]">
                  استعراض
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}