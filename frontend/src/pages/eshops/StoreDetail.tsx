import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function StoreDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.eshops.getStore(id).then(setStore).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;
  if (!store) return <div className="text-center py-12 text-[#6B7280]">المتجر غير موجود</div>;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4" dir="rtl">
      <Link to="/eshops/stores" className="text-sm text-[#DAA520] hover:text-[#C49520] mb-4 inline-block">&larr; {t('eshops.title')}</Link>

      {/* Store header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-3">
          {store.logo ? (
            <img src={store.logo} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1B4332]/10 dark:bg-gray-700 flex items-center justify-center text-[#1B4332] dark:text-[#DAA520] font-bold text-2xl">{store.name.charAt(0)}</div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100">{store.name}</h1>
            <p className="text-sm text-[#6B7280] dark:text-gray-400">{store.city}{store.governorate ? ` - ${store.governorate}` : ''}</p>
          </div>
        </div>
        {store.banner && <img src={store.banner} alt="" className="w-full h-40 object-cover rounded-xl mb-3" />}
        <p className="text-[#374151] dark:text-gray-300 whitespace-pre-wrap">{store.description}</p>
        {store.phone && <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-2">📞 {store.phone}</p>}
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-4">{t('eshops.products')} ({store.products?.length || 0})</h2>
      {!store.products || store.products.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280]">{t('eshops.noProducts')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.products.map((product: any) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-[#1B4332]/10 to-[#DAA520]/10 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#DAA520]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5" /></svg>
                </div>
              )}
              <div className="p-4">
                <span className="text-xs bg-[#DAA520]/10 text-[#DAA520] px-2 py-0.5 rounded">{product.category?.nameAr}</span>
                <h3 className="font-bold text-[#1B4332] dark:text-gray-100 mt-1">{product.name}</h3>
                <p className="text-sm text-[#DAA520] font-bold mt-1">{product.price.toLocaleString('ar-EG')} {product.currency}</p>
                <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">{t('eshops.stock')}: {product.stock}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
