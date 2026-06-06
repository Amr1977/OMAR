import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function MyStore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', slug: '', phone: '', city: '', governorate: '', address: '' });
  const [productForm, setProductForm] = useState({ categoryId: '', name: '', description: '', price: '', stock: '0' });
  const [showProductForm, setShowProductForm] = useState(false);
  const [productImgUploading, setProductImgUploading] = useState(false);
  const productFileRef = useRef<HTMLInputElement>(null);

  const loadStore = () => {
    setLoading(true);
    api.eshops.getMyStore().then((s) => {
      setStore(s);
      setForm({ name: s.name, description: s.description, slug: s.slug, phone: s.phone || '', city: s.city || '', governorate: s.governorate || '', address: s.address || '' });
    }).catch(() => setStore(null)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.eshops.productCategories().then(setCategories).catch(() => {});
    loadStore();
  }, []);

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.slug) { setError('يرجى ملء جميع الحقول المطلوبة'); return; }
    setSaving(true); setError('');
    try {
      await api.eshops.createStore(form);
      loadStore();
    } catch (err: any) { setError(err.message || 'فشل إنشاء المتجر'); }
    finally { setSaving(false); }
  };

  const updateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true); setError('');
    try {
      await api.eshops.updateStore(store.id, form);
      loadStore();
    } catch (err: any) { setError(err.message || 'فشل تحديث المتجر'); }
    finally { setSaving(false); }
  };

  const handleStoreImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.eshops.uploadStoreImage(store.id, fd);
      setStore((prev: any) => ({ ...prev, images: res.images }));
    } catch (err: any) { setError(err.message); }
    finally { setUploading(false); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const deleteStoreImage = async (url: string) => {
    if (!store) return;
    try {
      const res = await api.eshops.deleteStoreImage(store.id, url);
      setStore((prev: any) => ({ ...prev, images: res.images }));
    } catch (err: any) { setError(err.message); }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !productForm.name || !productForm.description || !productForm.price) { setError('يرجى ملء جميع الحقول'); return; }
    setSaving(true); setError('');
    try {
      await api.eshops.createProduct(store.id, productForm);
      setProductForm({ categoryId: '', name: '', description: '', price: '', stock: '0' });
      setShowProductForm(false);
      loadStore();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleProductImage = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImgUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await api.eshops.uploadProductImage(productId, fd);
      loadStore();
    } catch (err: any) { setError(err.message); }
    finally { setProductImgUploading(false); }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('حذف المنتج؟')) return;
    try {
      await api.eshops.deleteProduct(productId);
      loadStore();
    } catch (err: any) { setError(err.message); }
  };

  const toggleProductStatus = async (product: any) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.eshops.updateProduct(product.id, { status: newStatus });
      loadStore();
    } catch (err: any) { setError(err.message); }
  };

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  if (!store) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4" dir="rtl">
        <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">{t('eshops.createStore')}</h1>
        <form onSubmit={createStore} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-6 space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storeName')} *</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storeSlug')} *</label><input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" placeholder="my-store-slug" /></div>
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storeDescription')} *</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 resize-none" rows={4} /></div>
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storePhone')}</label><input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl font-bold hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] disabled:opacity-50 transition-colors">{saving ? 'جاري...' : t('eshops.createStore')}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">{t('eshops.myStore')}</h1>
        <div className="flex gap-2">
          <Link to="/eshops/orders/store" className="text-sm bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] px-4 py-2 rounded-lg font-medium">{t('eshops.storeOrders')}</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {/* Store info */}
      <form onSubmit={updateStore} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-6 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storeName')}</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storeSlug')}</label><input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
        </div>
        <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storeDescription')}</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 resize-none" rows={3} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">{t('eshops.storePhone')}</label><input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">المدينة</label><input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
          <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">المحافظة</label><input value={form.governorate} onChange={(e) => setForm({...form, governorate: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
        </div>
        <button type="submit" disabled={saving} className="py-2.5 px-6 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] disabled:opacity-50 transition-colors">{saving ? 'جاري...' : t('eshops.editStore')}</button>
      </form>

      {/* Store images */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-2">صور المتجر</label>
        <div className="flex flex-wrap gap-2">
          {store.images?.map((img: string, i: number) => (
            <div key={i} className="relative group">
              <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg border border-[#E5E7EB] dark:border-gray-600" />
              <button type="button" onClick={() => deleteStoreImage(img)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">x</button>
            </div>
          ))}
          {(store.images?.length || 0) < 10 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-20 h-20 border-2 border-dashed border-[#DAA520]/50 rounded-lg flex items-center justify-center text-[#DAA520] hover:border-[#DAA520] hover:bg-[#DAA520]/5 transition-colors disabled:opacity-50"
            >{uploading ? <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>}</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleStoreImage} className="hidden" />
        </div>
      </div>

      {/* Products */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-gray-100">{t('eshops.products')} ({store.products?.length || 0})</h2>
          <button onClick={() => setShowProductForm(!showProductForm)}
            className="text-sm bg-[#DAA520] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#C49520] transition-colors"
          >{showProductForm ? 'إلغاء' : t('eshops.addProduct')}</button>
        </div>

        {showProductForm && (
          <form onSubmit={addProduct} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
            <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">التصنيف</label>
              <select value={productForm.categoryId} onChange={(e) => setProductForm({...productForm, categoryId: e.target.value})}
                className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
              ><option value="">اختر التصنيف</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.productName')} *</label><input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
              <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.price')} *</label><input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
            </div>
            <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.productDescription')} *</label><textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 resize-none" rows={3} /></div>
            <div><label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.stock')}</label><input type="number" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200" /></div>
            <button type="submit" disabled={saving} className="py-2 px-4 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] disabled:opacity-50 transition-colors">{saving ? 'جاري...' : t('eshops.addProduct')}</button>
          </form>
        )}

        <div className="space-y-3">
          {store.products?.map((product: any) => (
            <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt="" className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-[#1B4332]/10 dark:bg-gray-600 rounded-lg flex items-center justify-center text-[#DAA520]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5" /></svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-[#1B4332] dark:text-gray-100 truncate">{product.name}</h4>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{product.status}</span>
                </div>
                <p className="text-sm text-[#DAA520] font-bold">{product.price.toLocaleString('ar-EG')} {product.currency}</p>
                <p className="text-xs text-[#6B7280]">{t('eshops.stock')}: {product.stock} · {product.category?.nameAr}</p>
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer text-xs bg-[#DAA520]/10 text-[#DAA520] px-2 py-1 rounded">
                  <span>📷</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImage(product.id, e)} />
                </label>
                <button onClick={() => toggleProductStatus(product)} className="text-xs px-2 py-1 border border-[#E5E7EB] dark:border-gray-600 rounded">{product.status === 'ACTIVE' ? 'إخفاء' : 'نشر'}</button>
                <button onClick={() => deleteProduct(product.id)} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded">حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
