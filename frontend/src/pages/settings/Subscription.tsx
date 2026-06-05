import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const PAYMENT_NUMBER = '01094450141';
const PAYMENT_NAME = 'Amr Lotfy';
const USDT_WALLET = 'TGokJ43uzZvxwMAAsPaAtFmakZ1iQr4WTS';

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
  const [paymentMethod, setPaymentMethod] = useState<'INSTAPAY' | 'VODAFONE_CASH' | 'USDT_TRC20'>('INSTAPAY');
  const [note, setNote] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
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

            {/* Payment details */}
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 mb-6">
              {paymentMethod === 'USDT_TRC20' ? (
                <div className="text-center">
                  <p className="text-[#DAA520] text-sm font-medium mb-1">حول المبلغ إلى محفظة USDT (TRC20)</p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(USDT_WALLET); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="text-white text-lg font-mono font-bold tracking-wider hover:text-[#DAA520] transition-colors underline decoration-dotted underline-offset-4"
                      title="انسخ العنوان"
                    >
                      {USDT_WALLET}
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(USDT_WALLET); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-[#DAA520] hover:bg-white/20'}`}
                      title="نسخ"
                    >
                      {copied ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-[#B8DFC8] text-xs mb-2">الشبكة: <span className="text-[#DAA520] font-bold">TRON TRC20</span></p>
                  <button
                    onClick={() => setShowNetworkWarning(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors"
                  >
                    ⚠ يجب استخدام شبكة TRC20 الصحيحة — اضغط للتفاصيل
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[#DAA520] text-sm font-medium mb-1">حول المبلغ إلى</p>
                  <p className="text-white text-2xl font-bold tracking-wider mb-1">{PAYMENT_NUMBER}</p>
                  <p className="text-[#B8DFC8] text-sm mb-3">{PAYMENT_NAME}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium">إنستاباي</span>
                    <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium">فودافون كاش</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">طريقة الدفع</label>
              <div className="grid grid-cols-3 gap-3">
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
                <button
                  onClick={() => setPaymentMethod('USDT_TRC20')}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    paymentMethod === 'USDT_TRC20'
                      ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520] shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 text-[#6B7280] hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-7-2c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7-7-3.13-7-7z" />
                  </svg>
                  USDT TRC20
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

      {/* Network warning modal */}
      {showNetworkWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowNetworkWarning(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-amber-200 dark:border-amber-700">
            <button
              onClick={() => setShowNetworkWarning(false)}
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-[#1B4332] dark:text-[#DAA520] mb-2">تنبيه هام — الشبكة الصحيحة</h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4 text-right">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-bold mb-2">تأكد من استخدام شبكة TRC20 (TRON)</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                  عند التحويل عبر USDT، يجب اختيار شبكة <span className="font-bold">TRC20 (TRON)</span> في محفظتك.
                  إرسال USDT على شبكة خاطئة (مثل ERC20 أو BEP20) قد يؤدي إلى <span className="font-bold underline">فقدان الأموال بشكل دائم</span>.
                </p>
              </div>
              <div className="bg-[#1B4332]/5 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
                <p className="text-xs text-[#6B7280] dark:text-gray-400 mb-1">العنوان (TRC20)</p>
                <p className="text-sm font-mono font-bold text-[#1B4332] dark:text-[#DAA520] break-all">{USDT_WALLET}</p>
              </div>
              <button
                onClick={() => setShowNetworkWarning(false)}
                className="w-full py-3 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] transition-colors"
              >
                فهمت، شكراً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
