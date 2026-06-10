import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function GuardianDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.requests.guardianDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  const { stats, recentRequests, brides } = data || {};

  return (
    <div className="max-w-4xl mx-auto py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100 mb-6">لوحة تحكم ولي الأمر</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'سجلات العرائس', value: stats?.bridesCount || 0, color: 'text-[#1B4332]', icon: '👥' },
          { label: 'عرضوا مرشحين', value: stats?.activeExposures || 0, color: 'text-purple-600', icon: '👁' },
          { label: 'طلبات منتظرة', value: stats?.pendingRequests || 0, color: 'text-amber-600', icon: '📩' },
          { label: 'محادثات نشطة', value: stats?.activeConversations || 0, color: 'text-blue-600', icon: '💬' },
          { label: 'تم التوفيق', value: stats?.matchedBrides || 0, color: 'text-green-600', icon: '💍' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color} dark:opacity-90`}>{s.value}</div>
            <div className="text-xs text-[#6B7280] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link to="/guardian/brides/new" className="flex items-center gap-3 p-4 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] transition-colors">
          <span className="text-xl">➕</span>
          <span>إضافة سجل عروس</span>
        </Link>
        <Link to="/browse" className="flex items-center gap-3 p-4 bg-[#1B4332] dark:bg-[#1B4332]/80 text-white rounded-xl font-bold hover:bg-[#2D6A4F] transition-colors">
          <span className="text-xl">🔍</span>
          <span>تصفح العرسان</span>
        </Link>
        <Link to="/requests" className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-colors ${stats?.pendingRequests > 0 ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#1B4332] dark:text-gray-100 hover:bg-gray-50'}`}>
          <span className="text-xl">📩</span>
          <span>الطلبات الواردة {stats?.pendingRequests > 0 ? `(${stats.pendingRequests})` : ''}</span>
        </Link>
      </div>

      {recentRequests?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">آخر الطلبات</h2>
          <div className="space-y-3">
            {recentRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#1B4332] dark:text-gray-200">
                    {req.sender?.profile?.displayName || 'عريس'} — {req.sender?.profile?.age} سنة
                  </p>
                  {req.bride && (
                    <p className="text-xs text-[#6B7280]">عن موليتك — {req.bride.age} سنة · {req.bride.residenceGovernorate}</p>
                  )}
                </div>
                <Link to="/requests" className="px-3 py-1.5 bg-[#DAA520] text-[#1B4332] rounded-lg text-xs font-bold hover:bg-[#F5E6B8]">
                  استعراض
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-gray-100">سجلاتي</h2>
          <Link to="/guardian/brides" className="text-sm text-[#DAA520] hover:underline">عرض الكل</Link>
        </div>
        {!brides?.length ? (
          <div className="text-center py-6 text-[#6B7280]">
            <p className="mb-3">لا توجد سجلات بعد</p>
            <Link to="/guardian/brides/new" className="px-4 py-2 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold">إضافة أول سجل</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {brides.slice(0, 5).map((bride: any) => (
              <div key={bride.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#1B4332] dark:text-gray-200">عروس #{bride.id.slice(-5)} · {bride.age} سنة · {bride.residenceGovernorate || '-'}</p>
                  <p className="text-xs text-[#6B7280]">
                    {bride._count?.exposures || 0} إتاحات · {bride._count?.contactRequests || 0} طلبات
                    {bride.status === 'MATCHED' ? ' · 💍 تم التوفيق' : ''}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bride.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : bride.status === 'MATCHED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {bride.status === 'ACTIVE' ? 'نشط' : bride.status === 'MATCHED' ? 'توفيق' : bride.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}