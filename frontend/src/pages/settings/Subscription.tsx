import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const PAYMENT_NUMBER = '01094450141';
const PAYMENT_NAME = 'Amr Lotfy';

const PLANS = [
  { months: 1, price: 150, label: 'شهر', popular: false },
  { months: 3, price: 350, label: '3 أشهر', popular: false },
  { months: 6, price: 600, label: '6 أشهر', popular: false },
  { months: 12, price: 1000, label: '12 شهر', popular: true },
];

const PREMIUM_FEATURES = [
  'إرسال أكثر من 3 طلبات تواصل شهرياً',
  'مشاهدة الملفات الشخصية كاملة',
  'أولوية في اقتراحات الذكاء الاصطناعي',
  'دعم أولوية',
  'بدون إعلانات',
];

export default function Subscription() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'INSTAPAY' | 'VODAFONE_CASH'>('INSTAPAY');
  const [note, setNote] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedPlan = PLANS.find(p => p.months === selectedMonths) || PLANS[0];

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
        durationMonths: selectedMonths,
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
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-8 text-center">
        الاشتراك
      </h1>

      {/* Status card */}
      <div className={`rounded-2xl p-6 mb-8 border-2 transition-all ${
        isPremium
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-600 shadow-md'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            isPremium ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {isPremium ? (
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#6B7280] dark:text-gray-400">حالة اشتراكك</p>
            <p className={`text-xl font-bold ${isPremium ? 'text-green-700 dark:text-green-300' : 'text-[#1B4332] dark:text-gray-100'}`}>
              {isPremium ? 'مشترك مميز' : 'اشتراك مجاني'}
            </p>
            {user?.subscriptionExpiry && isPremium && (
              <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
                ينتهي في {new Date(user.subscriptionExpiry).toLocaleDateString('ar-EG')}
              </p>
            )}
          </div>
          {isPremium && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-xs font-bold shrink-0">
              مفعل
            </span>
          )}
        </div>
      </div>

      {/* Pending request */}
      {pendingSub && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#1B4332] dark:text-gray-100">طلب الاشتراك قيد المراجعة</p>
              <p className="text-sm text-[#6B7280] dark:text-gray-400">تم استلام طلبك وسيتم مراجعته من قبل الإدارة قريباً</p>
            </div>
          </div>
        </div>
      )}

      {/* Declined */}
      {declinedSub && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-800 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-red-600 dark:text-red-400">تم رفض طلب الاشتراك</p>
              {subscription.adminNote && (
                <p className="text-sm text-[#6B7280] dark:text-gray-400">{subscription.adminNote}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan selection */}
      {!isPremium && !pendingSub && (
        <div>
          {/* Plan cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {PLANS.map((plan) => {
              const selected = selectedMonths === plan.months;
              return (
                <button
                  key={plan.months}
                  onClick={() => setSelectedMonths(plan.months)}
                  className={`relative p-5 rounded-2xl border-2 text-center transition-all ${
                    selected
                      ? 'border-[#DAA520] bg-[#DAA520]/5 dark:bg-[#DAA520]/10 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#DAA520] text-[#1B4332] px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                      الأفضل
                    </div>
                  )}
                  <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">{plan.label}</p>
                  <p className={`text-2xl font-bold mt-2 ${selected ? 'text-[#DAA520]' : 'text-[#1B4332] dark:text-gray-100'}`}>
                    {plan.price} <span className="text-sm font-normal">EGP</span>
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-gray-500 mt-1">
                    {Math.round(plan.price / plan.months)} EGP/شهر
                  </p>
                  {selected && (
                    <div className="mt-3">
                      <span className="inline-block w-3 h-3 bg-[#DAA520] rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Features card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-8">
            <h3 className="font-bold text-[#1B4332] dark:text-gray-100 mb-3 text-sm">المميزات المشمولة:</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#1B4332] dark:text-gray-200">
                  <svg className="w-4 h-4 text-[#DAA520] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Payment form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <h2 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              بيانات الدفع — {selectedPlan.price} EGP
            </h2>

            {/* Bank details */}
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 mb-6">
              <div className="text-center">
                <p className="text-[#DAA520] text-sm font-medium mb-1">حول المبلغ إلى</p>
                <p className="text-white text-2xl font-bold tracking-wider mb-1">{PAYMENT_NUMBER}</p>
                <p className="text-[#B8DFC8] text-sm mb-3">{PAYMENT_NAME}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium">إنستاباي</span>
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium">فودافون كاش</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">طريقة الدفع</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('INSTAPAY')}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    paymentMethod === 'INSTAPAY'
                      ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520] shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 text-[#6B7280] hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  إنستاباي
                </button>
                <button
                  onClick={() => setPaymentMethod('VODAFONE_CASH')}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    paymentMethod === 'VODAFONE_CASH'
                      ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520] shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 text-[#6B7280] hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  فودافون كاش
                </button>
              </div>
            </div>

            {/* Upload */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">
                صورة التحويل <span className="text-red-500">*</span>
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
                  <img src={imageBase64} alt="Preview" className="h-40 rounded-xl border border-[#E5E7EB] dark:border-gray-600 object-cover" />
                  <button
                    onClick={() => { setImageBase64(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 shadow-md transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-[#6B7280] dark:text-gray-400 hover:border-[#DAA520] hover:text-[#DAA520] hover:bg-[#DAA520]/5 transition-all"
                >
                  <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">اضغط لرفع صورة التحويل</span>
                  <p className="text-xs text-[#6B7280] dark:text-gray-500 mt-1">PNG, JPG, WEBP</p>
                </button>
              )}
            </div>

            {/* Note */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">
                ملاحظة <span className="text-gray-400">(اختياري)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100 text-sm resize-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520] transition-all"
                placeholder="أي ملاحظة إضافية..."
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-5 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-5 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting || !imageBase64}
              className="w-full py-3.5 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold text-lg hover:bg-[#F5E6B8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الإرسال...
                </span>
              ) : `تأكيد الاشتراك - ${selectedPlan.price} EGP`}
            </button>

            <p className="text-xs text-[#6B7280] dark:text-gray-500 text-center mt-4">
              سيتم مراجعة طلبك يدوياً من قبل الإدارة وتفعيل الاشتراك بعد التأكيد
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
