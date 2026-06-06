import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function StoreList() {
  const { t } = useTranslation();
  const [stores, setStores] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    api.eshops.listStores(params.toString()).then((res: any) => {
      setStores(res.stores);
      setTotal(res.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">{t('eshops.title')}</h1>
        <Link to="/eshops/my-store" className="text-sm bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] px-4 py-2 rounded-lg font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors">{t('eshops.myStore')}</Link>
      </div>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder={t('eshops.searchProducts')} dir="rtl"
        className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 mb-6"
      />

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>
      ) : stores.length === 0 ? (
        <div className="text-center py-12 text-[#6B7280]">{t('eshops.noStores')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store) => (
            <Link key={store.id} to={`/eshops/stores/${store.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                {store.logo ? (
                  <img src={store.logo} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1B4332]/10 dark:bg-gray-700 flex items-center justify-center text-[#1B4332] dark:text-[#DAA520] font-bold text-lg">{store.name.charAt(0)}</div>
                )}
                <div>
                  <h3 className="font-bold text-[#1B4332] dark:text-gray-100">{store.name}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-gray-400">{store.city || store.governorate || ''}</p>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] dark:text-gray-400 line-clamp-2">{store.description}</p>
              <p className="text-xs text-[#DAA520] mt-2">{store._count?.products || 0} منتجات</p>
            </Link>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-600 rounded text-sm disabled:opacity-50"
          >السابق</button>
          <span className="px-3 py-1.5 text-sm text-[#6B7280]">{page} / {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}
            className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-600 rounded text-sm disabled:opacity-50"
          >التالي</button>
        </div>
      )}
    </div>
  );
}
