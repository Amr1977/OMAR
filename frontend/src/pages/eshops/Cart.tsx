import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shippingForm, setShippingForm] = useState({ shippingAddress: '', shippingCity: '', shippingGovernorate: '', notes: '' });

  const loadCart = () => {
    setLoading(true);
    api.eshops.getCart().then(setCart).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadCart(); }, []);

  const updateQty = async (itemId: string, qty: number) => {
    try {
      const updated = await api.eshops.updateCartItem(itemId, qty);
      setCart(updated);
    } catch (err: any) { setError(err.message); }
  };

  const removeItem = async (itemId: string) => {
    try {
      const updated = await api.eshops.removeFromCart(itemId);
      setCart(updated);
    } catch (err: any) { setError(err.message); }
  };

  const handleCheckout = async () => {
    setCheckingOut(true); setError('');
    try {
      await api.eshops.checkout(shippingForm);
      setSuccess(true);
      setCart(null);
    } catch (err: any) { setError(err.message); }
    finally { setCheckingOut(false); }
  };

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  const total = cart?.items?.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">{t('eshops.cart')}</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {success ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-6 rounded-xl text-center">
          <p className="text-lg font-bold mb-2">تم إتمام الطلب بنجاح!</p>
          <p className="text-sm mb-4">سيتم مراجعة طلبك من قبل المتجر</p>
          <button onClick={() => navigate('/eshops/orders')} className="bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] px-6 py-2 rounded-lg font-medium">{t('eshops.orders')}</button>
        </div>
      ) : !cart || cart.items?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280]">{t('eshops.emptyCart')}</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-4 space-y-3">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB] dark:border-gray-700 last:border-0 last:pb-0">
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0]} alt="" className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-[#6B7280]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5" /></svg></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1B4332] dark:text-gray-100 truncate">{item.product.name}</p>
                  <p className="text-sm text-[#DAA520] font-bold">{item.product.price.toLocaleString('ar-EG')} {item.product.currency}</p>
                  <p className="text-xs text-[#6B7280]">{item.product.store?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-[#E5E7EB] dark:border-gray-600 flex items-center justify-center text-sm">-</button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-[#E5E7EB] dark:border-gray-600 flex items-center justify-center text-sm">+</button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm px-2">✕</button>
              </div>
            ))}
          </div>

          {/* Shipping form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-4 space-y-3">
            <h3 className="font-bold text-[#1B4332] dark:text-gray-100">معلومات الشحن</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className="block text-xs font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.shippingAddress')}</label><input value={shippingForm.shippingAddress} onChange={(e) => setShippingForm({...shippingForm, shippingAddress: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700" /></div>
              <div><label className="block text-xs font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.shippingCity')}</label><input value={shippingForm.shippingCity} onChange={(e) => setShippingForm({...shippingForm, shippingCity: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.shippingGovernorate')}</label><input value={shippingForm.shippingGovernorate} onChange={(e) => setShippingForm({...shippingForm, shippingGovernorate: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700" /></div>
              <div><label className="block text-xs font-medium text-[#374151] dark:text-gray-300 mb-1">{t('eshops.notes')}</label><input value={shippingForm.notes} onChange={(e) => setShippingForm({...shippingForm, notes: e.target.value})} className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700" /></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-4 flex items-center justify-between">
            <p className="font-bold text-[#1B4332] dark:text-gray-100">{t('eshops.total')}: {total.toLocaleString('ar-EG')} {cart.items[0]?.product.currency || 'EGP'}</p>
            <button onClick={handleCheckout} disabled={checkingOut}
              className="py-3 px-8 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl font-bold hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] disabled:opacity-50 transition-colors"
            >{checkingOut ? 'جاري...' : t('eshops.checkout')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
