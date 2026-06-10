import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function GroomInbox() {
  const [data, setData] = useState<{ receivedProposals: any[]; sentRequests: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'proposals' | 'sent'>('proposals');

  useEffect(() => {
    api.requests.groomInbox().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id: string) => {
    await api.requests.accept(id);
    api.requests.groomInbox().then(setData);
  };

  const handleReject = async (id: string) => {
    if (!confirm('هل أنت متأكد من الرفض؟')) return;
    await api.requests.reject(id);
    api.requests.groomInbox().then(setData);
  };

  const BrideCard = ({ bride }: { bride: any }) => (
    <div className="border border-[#DAA520]/30 bg-[#DAA520]/5 dark:bg-[#DAA520]/10 rounded-xl p-3 my-3">
      <p className="text-xs font-medium text-[#DAA520] mb-1">بيانات الموليه:</p>
      <div className="grid grid-cols-2 gap-1 text-xs text-[#1B4332] dark:text-gray-200">
        <span>السن: <strong>{bride.age}</strong></span>
        <span>المحافظة: <strong>{bride.residenceGovernorate || '-'}</strong></span>
        <span>الحالة: <strong>{bride.maritalStatus || '-'}</strong></span>
        <span>الصلاة: <strong>{bride.prayerCommitment || '-'}</strong></span>
        <span>الحجاب: <strong>{bride.hijabType || '-'}</strong></span>
        {bride.wantChildren && <span>الإنجاب: <strong>{bride.wantChildren}</strong></span>}
        {bride.acceptPolygamy && <span>التعدد: <strong>{bride.acceptPolygamy}</strong></span>}
      </div>
    </div>
  );

  const statusBadge = (status: string) => {
    const map: Record<string, [string, string]> = {
      PENDING: ['bg-amber-100 text-amber-700', 'قيد الانتظار'],
      ACCEPTED: ['bg-green-100 text-green-700', 'مقبول'],
      REJECTED: ['bg-red-100 text-red-600', 'مرفوض'],
    };
    const [cls, label] = map[status] || ['bg-gray-100 text-gray-600', status];
    return <span className={`px-2 py-0.5 ${cls} rounded-full text-xs font-medium`}>{label}</span>;
  };

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  const proposals = data?.receivedProposals || [];
  const sentReqs = data?.sentRequests || [];

  return (
    <div className="max-w-3xl mx-auto py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100 mb-4">صندوق التعارف</h1>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('proposals')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'proposals' ? 'bg-white dark:bg-gray-800 text-[#1B4332] dark:text-[#DAA520] shadow-sm' : 'text-[#6B7280]'}`}
        >
          تقدمات لي ({proposals.filter(p => p.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'sent' ? 'bg-white dark:bg-gray-800 text-[#1B4332] dark:text-[#DAA520] shadow-sm' : 'text-[#6B7280]'}`}
        >
          طلباتي المرسلة ({sentReqs.length})
        </button>
      </div>

      {tab === 'proposals' && (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div className="text-center py-16 text-[#6B7280]">
              <p className="text-lg mb-2">لا توجد تقدمات بعد</p>
              <p className="text-sm">عندما يتقدم إليك ولي أمر ستصلك إشعار هنا</p>
            </div>
          ) : proposals.map((proposal: any) => (
            <div key={proposal.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-[#1B4332] dark:text-gray-100">
                    {proposal.sender?.profile?.displayName || 'ولي أمر'}
                  </p>
                  <p className="text-xs text-[#6B7280]">تقدم بتاريخ {new Date(proposal.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
                {statusBadge(proposal.status)}
              </div>

              {proposal.guardianNote && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                  <p className="text-xs text-[#6B7280] mb-1">رسالة ولي الأمر:</p>
                  <p className="text-sm text-[#1B4332] dark:text-gray-200">{proposal.guardianNote}</p>
                </div>
              )}

              {proposal.bride && <BrideCard bride={proposal.bride} />}

              <div className="flex gap-3 mt-4">
                {proposal.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleAccept(proposal.id)} className="flex-1 py-2.5 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl text-sm font-bold hover:bg-[#2D6A4F] transition-colors">
                      قبول
                    </button>
                    <button onClick={() => handleReject(proposal.id)} className="flex-1 py-2.5 border-2 border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                      رفض
                    </button>
                  </>
                )}
                {proposal.status === 'ACCEPTED' && proposal.conversation && (
                  <Link to={`/messages/${proposal.conversation.id}`} className="flex-1 py-2.5 bg-[#DAA520] text-[#1B4332] rounded-xl text-sm font-bold text-center">
                    فتح المحادثة
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sent' && (
        <div className="space-y-4">
          {sentReqs.length === 0 ? (
            <div className="text-center py-16 text-[#6B7280]">
              <p className="text-lg mb-2">لم ترسل طلبات بعد</p>
              <p className="text-sm">تصفح السجلات المتاحة وأرسل طلب تواصل</p>
              <Link to="/brides/visible" className="mt-4 inline-block px-6 py-2.5 bg-[#DAA520] text-[#1B4332] rounded-xl text-sm font-bold">
                تصفح السجلات المتاحة
              </Link>
            </div>
          ) : sentReqs.map((req: any) => (
            <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-[#1B4332] dark:text-gray-100">
                    ولي الأمر: {req.receiver?.profile?.displayName || '-'}
                  </p>
                  <p className="text-xs text-[#6B7280]">{new Date(req.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
                {statusBadge(req.status)}
              </div>
              {req.bride && <BrideCard bride={req.bride} />}
              {req.status === 'ACCEPTED' && req.conversation && (
                <Link to={`/messages/${req.conversation.id}`} className="block mt-3 py-2.5 bg-[#DAA520] text-[#1B4332] rounded-xl text-sm font-bold text-center">
                  فتح المحادثة
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}