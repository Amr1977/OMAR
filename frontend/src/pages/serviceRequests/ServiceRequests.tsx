import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ServiceRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState<{ [key: string]: { price: string; description: string } }>({});

  const fetchRequests = () => {
    setLoading(true);
    api.serviceRequests.browse()
      .then((res: any) => setRequests(Array.isArray(res) ? res : res.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmitOffer = async (requestId: string) => {
    const data = offerForm[requestId];
    if (!data || !data.price) return;
    try {
      await api.serviceRequests.submitOffer(requestId, {
        price: parseFloat(data.price),
        description: data.description,
      });
      setOfferForm((prev) => ({ ...prev, [requestId]: { price: '', description: '' } }));
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-8 text-[#6B7280] dark:text-gray-400">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">طلبات الخدمة</h1>
        <Link to="/service-requests/new"
          className="px-4 py-2 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-sm font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors"
        >
          إضافة طلب
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#6B7280] dark:text-gray-400 mb-4">لا توجد طلبات خدمة حالياً</p>
          <Link to="/service-requests/new"
            className="px-6 py-3 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl font-medium"
          >
            أضف أول طلب
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-[#E5E7EB] dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-[#1B4332] dark:text-gray-200">{req.title}</h3>
                  <p className="text-sm text-[#6B7280]">
                    {req.user?.displayName || req.user?.email || 'مستخدم'} | {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  req.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                  req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {req.status === 'OPEN' ? 'مفتوح' : req.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'مغلق'}
                </span>
              </div>
              {req.description && (
                <p className="text-[#374151] dark:text-gray-300 text-sm mb-4">{req.description}</p>
              )}
              {req.budget && (
                <p className="text-sm text-[#1B4332] dark:text-[#DAA520] font-medium mb-3">
                  الميزانية: {req.budget.toLocaleString()} ريال
                </p>
              )}
              {req.category && (
                <span className="inline-block px-2 py-0.5 bg-[#1B4332]/10 dark:bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520] text-xs rounded-full mb-3">
                  {req.category.nameAr || req.category.name}
                </span>
              )}
              {req.offers?.length > 0 && (
                <div className="border-t border-[#E5E7EB] dark:border-gray-700 pt-3 mt-3">
                  <p className="text-sm font-medium text-[#6B7280] mb-2">العروض المقدمة ({req.offers.length})</p>
                  {req.offers.map((offer: any) => (
                    <div key={offer.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-[#374151] dark:text-gray-300">
                        {offer.provider?.displayName || 'مقدم خدمة'}: {offer.price?.toLocaleString()} ريال
                      </span>
                      <span className="text-xs text-[#6B7280]">{offer.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {req.status === 'OPEN' && (
                <div className="border-t border-[#E5E7EB] dark:border-gray-700 pt-3 mt-3">
                  <p className="text-sm font-medium text-[#1B4332] dark:text-[#DAA520] mb-2">تقديم عرض</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      placeholder="السعر"
                      value={offerForm[req.id]?.price || ''}
                      onChange={(e) =>
                        setOfferForm((prev) => ({
                          ...prev,
                          [req.id]: { ...prev[req.id], price: e.target.value },
                        }))
                      }
                      className="w-32 border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
                    />
                    <input
                      type="text"
                      placeholder="وصف العرض"
                      value={offerForm[req.id]?.description || ''}
                      onChange={(e) =>
                        setOfferForm((prev) => ({
                          ...prev,
                          [req.id]: { ...prev[req.id], description: e.target.value },
                        }))
                      }
                      className="flex-1 border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
                    />
                    <button
                      onClick={() => handleSubmitOffer(req.id)}
                      disabled={!offerForm[req.id]?.price}
                      className="px-4 py-2 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors"
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
