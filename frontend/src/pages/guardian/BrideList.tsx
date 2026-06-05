import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function BrideList() {
  const navigate = useNavigate();
  const [brides, setBrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.brides.list();
      setBrides(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await api.brides.delete(id);
      setBrides(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">نشط</span>;
      case 'MATCHED': return <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">تم التوفيق</span>;
      case 'ARCHIVED': return <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs font-medium">مؤرشف</span>;
      default: return <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto py-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100">سجلات العرائس</h1>
        <Link
          to="/guardian/brides/new"
          className="px-4 py-2 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إضافة عروس
        </Link>
      </div>

      {brides.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-[#6B7280] dark:text-gray-400 mb-4">لا توجد سجلات عرائس بعد</p>
          <Link
            to="/guardian/brides/new"
            className="inline-block px-6 py-2.5 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8] transition-colors"
          >
            إضافة أول سجل
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {brides.map(bride => (
            <div key={bride.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100">
                      عروس — كود #{bride.id.slice(-5)}
                    </h3>
                    {statusBadge(bride.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-[#6B7280] dark:text-gray-400">
                    <span>السن: <strong className="text-[#1B4332] dark:text-gray-200">{bride.age}</strong></span>
                    <span>المحافظة: <strong className="text-[#1B4332] dark:text-gray-200">{bride.residenceGovernorate || '-'}</strong></span>
                    <span>الحالة: <strong className="text-[#1B4332] dark:text-gray-200">{bride.maritalStatus}</strong></span>
                    <span>المؤهل: <strong className="text-[#1B4332] dark:text-gray-200">{bride.educationName || bride.education || '-'}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mr-4">
                  <button
                    onClick={() => navigate(`/guardian/brides/${bride.id}/edit`)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#6B7280] hover:text-[#DAA520] transition-colors"
                    title="تعديل"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(bride.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#6B7280] hover:text-red-500 transition-colors"
                    title="حذف"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
