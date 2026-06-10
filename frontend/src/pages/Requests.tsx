import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, photoUrl } from '../lib/api';
import UserAvatar from '../components/UserAvatar';

export default function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res: any = await api.requests.received();
      setRequests(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.requests.accept(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    try {
      await api.requests.reject(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">قيد الانتظار</span>;
      case 'ACCEPTED': return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">مقبول</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">مرفوض</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  return (
    <div className="max-w-3xl mx-auto py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100 mb-6">طلبات التواصل الواردة</h1>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-[#6B7280] dark:text-gray-400">لا توجد طلبات تواصل بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => {
            const groom = req.sender;
            const groomProfile = groom?.profile;
            const bride = req.bride;

            return (
              <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar photo={groomProfile?.photos?.[0]?.url} size="lg" />
                    <div>
                      <p className="font-bold text-[#1B4332] dark:text-gray-100">
                        {groomProfile?.displayName || `عريس #${groom?.id?.slice(-5)}`}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {groomProfile?.age} سنة
                        {groomProfile?.residenceGovernorate ? ` · ${groomProfile.residenceGovernorate}` : ''}
                        {groom?.isVerified ? ' · ✓ موثق' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(req.status)}
                    <span className="text-xs text-[#6B7280]">{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>

                {groomProfile && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 mb-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {groomProfile.occupation && <span>العمل: <strong className="text-[#1B4332] dark:text-gray-200">{groomProfile.occupation}</strong></span>}
                    {groomProfile.education && <span>المؤهل: <strong className="text-[#1B4332] dark:text-gray-200">{groomProfile.education}</strong></span>}
                    {groomProfile.maritalStatus && <span>الحالة: <strong className="text-[#1B4332] dark:text-gray-200">{groomProfile.maritalStatus}</strong></span>}
                    {groomProfile.prayerCommitment && <span>الصلاة: <strong className="text-[#1B4332] dark:text-gray-200">{groomProfile.prayerCommitment}</strong></span>}
                    {groomProfile.madhab && <span>المذهب: <strong className="text-[#1B4332] dark:text-gray-200">{groomProfile.madhab}</strong></span>}
                    {groomProfile.nationality && <span>الجنسية: <strong className="text-[#1B4332] dark:text-gray-200">{groomProfile.nationality}</strong></span>}
                  </div>
                )}

                {bride && (
                  <div className="border border-[#DAA520]/30 bg-[#DAA520]/5 dark:bg-[#DAA520]/10 rounded-xl p-3 mb-4">
                    <p className="text-xs font-medium text-[#DAA520] mb-1">يطلب التعريف بموليتك:</p>
                    <div className="flex gap-4 text-xs text-[#1B4332] dark:text-gray-200">
                      <span>السن: <strong>{bride.age}</strong></span>
                      <span>المحافظة: <strong>{bride.residenceGovernorate || '-'}</strong></span>
                      <span>الحالة: <strong>{bride.maritalStatus || '-'}</strong></span>
                    </div>
                  </div>
                )}

                {req.message && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                    <p className="text-xs text-[#6B7280] mb-1">رسالة العريس:</p>
                    <p className="text-sm text-[#1B4332] dark:text-gray-200">{req.message}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex-1 py-2.5 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl text-sm font-bold hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors"
                      >
                        قبول وفتح المحادثة
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex-1 py-2.5 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        رفض
                      </button>
                    </>
                  )}
                  {req.status === 'ACCEPTED' && req.conversation && (
                    <Link
                      to={`/messages/${req.conversation.id}`}
                      className="flex-1 py-2.5 bg-[#DAA520] text-[#1B4332] rounded-xl text-sm font-bold text-center hover:bg-[#F5E6B8] transition-colors"
                    >
                      فتح المحادثة
                    </Link>
                  )}
                  {groomProfile?.id && (
                    <Link
                      to={`/browse/${groomProfile.id}`}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-[#6B7280] dark:text-gray-400 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      ملف كامل
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}