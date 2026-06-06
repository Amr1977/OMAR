import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

export default function ProductList() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [addingId, setAddingId] = useState('');
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    api.eshops.listProducts(params.toString()).then((res: any) => {
      setProducts(res.products);
      setTotal(res.total);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.eshops.productCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [search, categoryId, page]);

  const addToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      await api.eshops.addToCart(productId);
    } catch (err: any) { alert(err.message); }
    finally { setAddingId(''); }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">{t('eshops.products')}</h1>

      <div className="flex gap-3 mb-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('eshops.searchProducts')}
          className="flex-1 border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
        />
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="w-44 border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
        >
          <option value="">{t('services.allCategories')}</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nameAr}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280]">{t('eshops.noProducts')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <Link to={`/eshops/stores/${product.store?.id}`}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-[#1B4332]/10 to-[#DAA520]/10 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#DAA520]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5" /></svg>
                  </div>
                )}
              </Link>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-[#DAA520]/10 text-[#DAA520] px-2 py-0.5 rounded">{product.category?.nameAr}</span>
                  <Link to={`/eshops/stores/${product.store?.id}`} className="text-xs text-[#6B7280] hover:text-[#DAA520]">{product.store?.name}</Link>
                </div>
                <Link to={`/eshops/stores/${product.store?.id}`}>
                  <h3 className="font-bold text-[#1B4332] dark:text-gray-100 mt-1">{product.name}</h3>
                </Link>
                <p className="text-sm text-[#DAA520] font-bold mt-1">{product.price.toLocaleString('ar-EG')} {product.currency}</p>
                <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">{t('eshops.stock')}: {product.stock}</p>
                <button onClick={() => addToCart(product.id)} disabled={addingId === product.id || product.stock < 1}
                  className="mt-3 w-full py-2 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-sm font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] disabled:opacity-50 transition-colors"
                >{addingId === product.id ? '...' : product.stock < 1 ? 'غير متوفر' : t('eshops.cart')}</button>
              </div>
            </div>
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
