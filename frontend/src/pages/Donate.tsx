import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

const PAYMENT_NUMBER = '01094450141';
const PAYMENT_NAME = 'Amr Lotfy';
const USDT_WALLET = 'TGokJ43uzZvxwMAAsPaAtFmakZ1iQr4WTS';

export default function Donate() {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'INSTAPAY' | 'VODAFONE_CASH' | 'USDT_TRC20'>('INSTAPAY');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const presetAmounts = [50, 100, 200, 500];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!amount || Number(amount) < 1) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!imageBase64) {
      setError('يرجى رفع صورة التحويل');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.donations.create({
        paymentMethod,
        amount: Number(amount),
        transactionImage: imageBase64,
        note: note || undefined,
      });
      setSuccess(true);
      setImageBase64(null);
      setAmount('');
      setNote('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-2">تم إرسال التبرع</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">شكراً لك! سيتم مراجعة طلب التبرع من قبل الإدارة</p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] transition-colors"
        >
          تبرع مرة أخرى
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-2 text-center">تبرع لدعم حفصة</h1>
      <p className="text-sm text-[#6B7280] dark:text-gray-400 text-center mb-8">
        ساهم في دعم المنصة وتطويرها لخدمة المجتمع الإسلامي
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6">
        {/* Payment details */}
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-700 dark:to-gray-800 rounded-lg p-5 mb-6 text-center">
          {paymentMethod === 'USDT_TRC20' ? (
            <>
              <p className="text-[#DAA520] text-sm font-medium mb-2">حول إلى محفظة USDT (TRC20)</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-white text-sm font-mono font-bold tracking-wider">{USDT_WALLET}</span>
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
              <p className="text-[#B8DFC8] text-xs mb-1">الشبكة: <span className="text-[#DAA520] font-bold">TRON TRC20</span></p>
              <button
                onClick={() => setShowNetworkWarning(true)}
                className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors"
              >
                ⚠ يجب استخدام شبكة TRC20 الصحيحة — اضغط للتفاصيل
              </button>
            </>
          ) : (
            <>
              <p className="text-[#DAA520] text-sm font-medium mb-2">بيانات الدفع</p>
              <p className="text-white text-xl font-bold tracking-wider">{PAYMENT_NUMBER}</p>
              <p className="text-[#B8DFC8] text-sm">{PAYMENT_NAME}</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentMethod === 'INSTAPAY' ? 'bg-[#DAA520] text-[#1B4332]' : 'bg-gray-600 text-gray-300'}`}>
                  إنستاباي
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentMethod === 'VODAFONE_CASH' ? 'bg-[#DAA520] text-[#1B4332]' : 'bg-gray-600 text-gray-300'}`}>
                  فودافون كاش
                </span>
              </div>
            </>
          )}
        </div>

        {/* Payment method */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">طريقة الدفع</label>
          <div className="grid grid-cols-3 gap-3">
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
            <button
              onClick={() => setPaymentMethod('USDT_TRC20')}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                paymentMethod === 'USDT_TRC20'
                  ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520]'
                  : 'border-gray-200 dark:border-gray-600 text-[#6B7280] hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-7-2c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7-7-3.13-7-7z" />
              </svg>
              USDT TRC20
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">المبلغ (EGP)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetAmounts.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  Number(amount) === a
                    ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#1B4332] dark:text-[#DAA520]'
                    : 'border-gray-200 dark:border-gray-600 text-[#6B7280] hover:border-gray-300'
                }`}
              >
                {a} EGP
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100 text-sm"
            placeholder="أو أدخل مبلغاً مخصصاً..."
          />
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

        <button
          onClick={submit}
          disabled={submitting || !imageBase64 || !amount}
          className="w-full py-3 bg-[#DAA520] text-[#1B4332] rounded-lg font-bold hover:bg-[#F5E6B8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'جاري الإرسال...' : `تبرع بـ ${amount || '0'} EGP`}
        </button>

        <p className="text-xs text-[#6B7280] dark:text-gray-500 text-center mt-3">
          سيتم مراجعة طلب التبرع يدوياً من قبل الإدارة
        </p>
      </div>

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
