import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const PAYMENT_NUMBER = '01094450141';
const PAYMENT_NAME = 'Amr Lotfy';

export default function Subscription() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'INSTAPAY' | 'VODAFONE_CASH'>('INSTAPAY');
  const [note, setNote] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.subscriptions.getMy()
      .then((res: any) => setSubscription(res.subscription))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!imageBase64) {
      setError('يرجى رفع صورة التحويل');
      return;
    }
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res: any = await api.subscriptions.create({
        paymentMethod,
        transactionImage: imageBase64,
        note: note || undefined,
      });
      setSubscription(res);
      setSuccess('تم إرسال طلب الاشتراك. في انتظار المراجعة من الإدارة.');
      setImageBase64(null);
      setNote('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  const isPremium = user?.subscriptionPlan === 'PREMIUM';
  const pendingSub = subscription?.status === 'PENDING';
  const declinedSub = subscription?.status === 'DECLINED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6 text-center">
        {t('settings.subscription')}
      </h1>

      {/* Current status */}
      <div className={`rounded-xl p-6 mb-6 border ${
        isPremium
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
          : 'bg-gray-50 dark:bg-gray-800 border-[#E5E7EB] dark:border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6B7280] dark:text-gray-400">حالة اشتراكك</p>
            <p className="text-lg font-bold text-[#1B4332] dark:text-gray-100">
              {isPremium ? 'مميز ✓' : 'مجاني'}
            </p>
            {user?.subscriptionExpiry && isPremium && (
              <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">
                ينتهي في: {new Date(user.subscriptionExpiry).toLocaleDateString('ar-EG')}
              </p>
            )}
          </div>
          {!isPremium && !pendingSub && (
            <span className="text-xs bg-[#DAA520]/20 text-[#DAA520] px-3 py-1 rounded-full font-medium">
              50 EGP/شهر
            </span>
          )}
          {isPremium && (
            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-medium">
              مفعل
            </span>
          )}
        </div>
      </div>

      {/* Pending notification */}
      {pendingSub && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5 mb-6 text-center">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium text-[#1B4332] dark:text-gray-100">طلب الاشتراك قيد المراجعة</p>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">تم استلام طلبك وسيتم مراجعته من قبل الإدارة قريباً</p>
        </div>
      )}

      {/* Declined notification */}
      {declinedSub && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-5 mb-6">
          <p className="font-medium text-red-600 dark:text-red-400 text-center">تم رفض طلب الاشتراك</p>
          {subscription.adminNote && (
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-2 text-center">{subscription.adminNote}</p>
          )}
        </div>
      )}

      {/* Subscription form (only if not premium and no pending request) */}
      {!isPremium && !pendingSub && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">
            اشتراك مميز - 50 EGP / شهر
          </h2>

          {/* Payment details */}
          <div className="bg-[#1B4332] dark:bg-gray-700 rounded-lg p-4 mb-5 text-center">
            <p className="text-[#DAA520] text-sm font-medium mb-2">بيانات الدفع</p>
            <p className="text-white text-lg font-bold">{PAYMENT_NUMBER}</p>
            <p className="text-[#B8DFC8] text-sm">{PAYMENT_NAME}</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentMethod === 'INSTAPAY' ? 'bg-[#DAA520] text-[#1B4332]' : 'bg-gray-600 text-gray-300'}`}>
                إنستاباي
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentMethod === 'VODAFONE_CASH' ? 'bg-[#DAA520] text-[#1B4332]' : 'bg-gray-600 text-gray-300'}`}>
                فودافون كاش
              </span>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('INSTAPAY')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  paymentMethod === 'INSTAPAY'
                    ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520]'
                    : 'border-gray-200 dark:border-gray-600 text-[#6B7280] hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                إنستاباي
              </button>
              <button
                onClick={() => setPaymentMethod('VODAFONE_CASH')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  paymentMethod === 'VODAFONE_CASH'
                    ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520]'
                    : 'border-gray-200 dark:border-gray-600 text-[#6B7280] hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                فودافون كاش
              </button>
            </div>
          </div>

          {/* Upload transaction image */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">
              صورة التحويل (إجباري)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            {imageBase64 ? (
              <div className="relative inline-block">
                <img src={imageBase64} alt="Preview" className="h-40 rounded-lg border border-[#E5E7EB] object-cover" />
                <button
                  onClick={() => { setImageBase64(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-[#6B7280] dark:text-gray-400 hover:border-[#DAA520] hover:text-[#DAA520] transition-colors"
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">اضغط لرفع صورة التحويل</span>
              </button>
            )}
          </div>

          {/* Optional note */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">
              ملاحظة (اختياري)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100 text-sm resize-none"
              placeholder="أي ملاحظة إضافية..."
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4 text-sm text-green-600 dark:text-green-400">
              {success}
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || !imageBase64}
            className="w-full py-3 bg-[#DAA520] text-[#1B4332] rounded-lg font-bold hover:bg-[#F5E6B8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'جاري الإرسال...' : 'تأكيد الاشتراك - 50 EGP'}
          </button>

          <p className="text-xs text-[#6B7280] dark:text-gray-500 text-center mt-3">
            سيتم مراجعة طلبك يدوياً من قبل الإدارة وتفعيل الاشتراك بعد التأكيد
          </p>
        </div>
      )}
    </div>
  );
}
