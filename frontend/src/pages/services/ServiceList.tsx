import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ServiceCard from '../../components/ServiceCard';
import ServiceMap from '../../components/ServiceMap';
import { api } from '../../lib/api';

export default function ServiceList() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    api.services.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    api.services.list(params.toString()).then((res) => {
      setServices(res.services);
      setTotal(res.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, categoryId, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">الخدمات</h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400">أحدث الخدمات المقدمة من المستخدمين</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMap(!showMap)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showMap ? 'bg-[#1B4332] text-white border-[#1B4332] dark:bg-[#DAA520] dark:text-[#1B4332] dark:border-[#DAA520]' : 'border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300 hover:border-[#1B4332] dark:hover:border-[#DAA520]'}`}
          >
            {showMap ? 'قائمة' : 'خريطة'}
          </button>
          <Link to="/services/new"
            className="px-4 py-2 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-sm font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors"
          >إضافة خدمة</Link>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="ابحث عن خدمة..."
          className="flex-1 border border-[#E5E7EB] dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
        />
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="border border-[#E5E7EB] dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nameAr}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280] dark:text-gray-400">جاري التحميل...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#D8F3DC] dark:bg-[#1B4332]/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#1B4332] dark:text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-[#6B7280] dark:text-gray-400 mb-1">لا توجد خدمات حالياً</p>
          <p className="text-sm text-[#9CA3AF] dark:text-gray-500 mb-5">كن أول من يضيف خدمة أو تصفح طلبات الخدمة</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/services/new"
              className="px-5 py-2.5 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors">
              أضف أول خدمة
            </Link>
            <Link to="/service-requests"
              className="px-5 py-2.5 border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300 rounded-xl font-medium hover:border-[#1B4332] dark:hover:border-[#DAA520] transition-colors">
              طلبات الخدمة
            </Link>
          </div>
        </div>
      ) : showMap ? (
        <div className="h-[600px] rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-gray-700">
          <ServiceMap services={services} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-[#E5E7EB] dark:border-gray-600 rounded-lg text-sm disabled:opacity-40 hover:border-[#1B4332] dark:hover:border-[#DAA520] transition-colors"
              >السابق</button>
              <span className="text-sm text-[#6B7280] dark:text-gray-400">صفحة {page} من {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-[#E5E7EB] dark:border-gray-600 rounded-lg text-sm disabled:opacity-40 hover:border-[#1B4332] dark:hover:border-[#DAA520] transition-colors"
              >التالي</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
