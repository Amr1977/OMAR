import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

const PAYMENT_NUMBER = '01094450141';
const PAYMENT_NAME = 'Amr Lotfy';

export default function Donate() {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'INSTAPAY' | 'VODAFONE_CASH'>('INSTAPAY');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
        </div>

        {/* Payment method */}
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
    </div>
  );
}
