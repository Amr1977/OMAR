import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Tab = 'stores' | 'products' | 'orders';

export default function AdminEshops() {
  const [tab, setTab] = useState<Tab>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() }).toString();
    const fetcher = tab === 'stores' ? api.admin.listStores(params) : tab === 'products' ? api.admin.listProducts(params) : api.admin.listOrders(params);
    fetcher.then((res: any) => {
      if (tab === 'stores') { setStores(res.stores); setTotal(res.total); }
      else if (tab === 'products') { setProducts(res.products); setTotal(res.total); }
      else { setOrders(res.orders); setTotal(res.total); }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [tab, page]);

  const suspendStore = async (id: string) => {
    try { await api.admin.suspendStore(id); load(); }
    catch (err: any) { alert(err.message); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('حذف المنتج؟')) return;
    try { await api.admin.deleteProduct(id); load(); }
    catch (err: any) { alert(err.message); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stores', label: 'المتاجر' },
    { key: 'products', label: 'المنتجات' },
    { key: 'orders', label: 'الطلبات' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">المتاجر الإلكترونية</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-[#1B4332] dark:bg-[#DAA520] text-white' : 'bg-gray-100 dark:bg-gray-700 text-[#374151] dark:text-gray-300'}`}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>
      ) : tab === 'stores' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">المالك</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">المنتجات</th><th className="p-3 text-right">الطلبات</th><th className="p-3 text-right">إجراءات</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
              {stores.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-[#6B7280]">{s.owner?.email}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : s.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span></td>
                  <td className="p-3">{s._count?.products}</td>
                  <td className="p-3">{s._count?.orders}</td>
                  <td className="p-3">
                    <button onClick={() => suspendStore(s.id)}
                      className={`text-xs px-2 py-1 rounded ${s.status === 'SUSPENDED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                    >{s.status === 'SUSPENDED' ? 'إلغاء الإيقاف' : 'إيقاف'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'products' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">المتجر</th><th className="p-3 text-right">التصنيف</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إجراءات</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-[#6B7280]">{p.store?.name}</td>
                  <td className="p-3">{p.category?.nameAr}</td>
                  <td className="p-3">{p.price} {p.currency}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                  <td className="p-3"><button onClick={() => deleteProduct(p.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">حذف</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="p-3 text-right">الطلب</th><th className="p-3 text-right">المتجر</th><th className="p-3 text-right">المشتري</th><th className="p-3 text-right">المجموع</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">التاريخ</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-mono text-xs">#{o.id.slice(-8)}</td>
                  <td className="p-3">{o.store?.name}</td>
                  <td className="p-3 text-[#6B7280]">{o.buyer?.email}</td>
                  <td className="p-3 font-medium">{o.total} {o.currency}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span></td>
                  <td className="p-3 text-xs text-[#6B7280]">{new Date(o.createdAt).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-600 rounded text-sm disabled:opacity-50">السابق</button>
          <span className="px-3 py-1.5 text-sm text-[#6B7280]">{page} / {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-600 rounded text-sm disabled:opacity-50">التالي</button>
        </div>
      )}
    </div>
  );
}
