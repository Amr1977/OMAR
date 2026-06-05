import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function AdminDonations() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetch = () => {
    setLoading(true);
    api.admin.donations()
      .then(setDonations)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const verify = async (id: string) => {
    if (!confirm('تأكيد التبرع؟')) return;
    try {
      await api.admin.verifyDonation(id);
      setActionMsg('تم تأكيد التبرع');
      fetch();
    } catch (err: any) {
      setActionMsg(err.message);
    }
  };

  const decline = async (id: string) => {
    const note = prompt('سبب الرفض (اختياري):');
    try {
      await api.admin.declineDonation(id, note || undefined);
      setActionMsg('تم رفض التبرع');
      fetch();
    } catch (err: any) {
      setActionMsg(err.message);
    }
  };

  const badge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'VERIFIED': return 'bg-green-100 text-green-700';
      case 'DECLINED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100 mb-6">التبرعات</h1>
      {actionMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-600">
          {actionMsg}
        </div>
      )}
      {loading ? (
        <div className="text-center py-8 text-[#6B7280]">جاري التحميل...</div>
      ) : donations.length === 0 ? (
        <div className="text-center py-8 text-[#6B7280]">لا توجد تبرعات</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-gray-700">
                <th className="text-right p-3 text-[#6B7280] font-medium">المستخدم</th>
                <th className="text-right p-3 text-[#6B7280] font-medium">المبلغ</th>
                <th className="text-right p-3 text-[#6B7280] font-medium">طريقة الدفع</th>
                <th className="text-right p-3 text-[#6B7280] font-medium">الحالة</th>
                <th className="text-right p-3 text-[#6B7280] font-medium">الصورة</th>
                <th className="text-right p-3 text-[#6B7280] font-medium">التاريخ</th>
                <th className="text-right p-3 text-[#6B7280] font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d: any) => (
                <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 text-[#1B4332] dark:text-gray-100">{d.user?.email || d.user?.phone || d.user?.id?.slice(0, 8) || 'زائر'}</td>
                  <td className="p-3 text-[#1B4332] dark:text-gray-100">{d.amount} EGP</td>
                  <td className="p-3 text-[#1B4332] dark:text-gray-100">{d.paymentMethod === 'INSTAPAY' ? 'إنستاباي' : d.paymentMethod === 'VODAFONE_CASH' ? 'فودافون كاش' : 'USDT TRC20'}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge(d.status)}`}>{d.status}</span></td>
                  <td className="p-3">
                    {d.transactionImage ? (
                      <a href={d.transactionImage} target="_blank" rel="noopener noreferrer" className="text-[#DAA520] hover:underline text-xs">عرض</a>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-xs text-[#6B7280]">{new Date(d.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="p-3">
                    {d.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => verify(d.id)} className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">تأكيد</button>
                        <button onClick={() => decline(d.id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">رفض</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
