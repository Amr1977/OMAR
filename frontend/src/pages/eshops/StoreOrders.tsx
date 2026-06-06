import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

const statusAr: Record<string, string> = {
  PENDING: 'قيد الانتظار', CONFIRMED: 'مؤكد', SHIPPED: 'تم الشحن', DELIVERED: 'تم التوصيل', CANCELLED: 'ملغي',
};

const nextStatuses: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function StoreOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.eshops.getStoreOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.eshops.updateOrderStatus(orderId, status);
      load();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">{t('eshops.storeOrders')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280]">{t('eshops.noOrders')}</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm text-[#6B7280]">طلب #{order.id.slice(-6)}</span>
                  <span className={`mr-3 text-xs px-2 py-0.5 rounded ${statusColors[order.status] || ''}`}>{statusAr[order.status] || order.status}</span>
                </div>
                <span className="text-sm text-[#6B7280]">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
              <p className="text-xs text-[#6B7280] mb-2">المشتري: {order.buyer?.email}</p>
              <div className="space-y-1 mb-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#374151] dark:text-gray-300">{item.productName} × {item.quantity}</span>
                    <span className="text-[#DAA520] font-medium">{(item.price * item.quantity).toLocaleString('ar-EG')} {order.currency}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 border-t border-[#E5E7EB] dark:border-gray-700">
                <span className="font-bold text-[#1B4332] dark:text-gray-100">{t('eshops.total')}</span>
                <span className="font-bold text-[#DAA520]">{order.total.toLocaleString('ar-EG')} {order.currency}</span>
              </div>
              {(order.shippingAddress || order.shippingCity) && (
                <p className="text-xs text-[#6B7280] mt-2">📍 {order.shippingAddress}, {order.shippingCity} {order.shippingGovernorate}</p>
              )}
              {order.notes && <p className="text-xs text-[#6B7280] mt-1">ملاحظات: {order.notes}</p>}

              {nextStatuses[order.status] && nextStatuses[order.status].length > 0 && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#E5E7EB] dark:border-gray-700">
                  {nextStatuses[order.status].map((s) => (
                    <button key={s} onClick={() => updateStatus(order.id, s)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        s === 'CANCELLED'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100'
                          : 'bg-[#DAA520]/10 text-[#DAA520] hover:bg-[#DAA520]/20'
                      }`}
                    >{s === 'CONFIRMED' ? 'تأكيد' : s === 'SHIPPED' ? 'تم الشحن' : s === 'DELIVERED' ? 'تم التوصيل' : s === 'CANCELLED' ? 'إلغاء' : s}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
