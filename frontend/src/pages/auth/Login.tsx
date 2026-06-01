import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        firebaseUid: 'placeholder_' + Date.now(),
        phone,
        role: 'GROOM',
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.post('/auth/verify-otp', { phone, code });
      const user = await api.auth.getMe();
      localStorage.setItem('auth_token', result.accessToken);
      login(result.accessToken, user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E7EB]">
        <h1 className="text-2xl font-bold text-[#1B4332] mb-6 text-center">
          {t('auth.loginTitle')}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendCode}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6B7280] mb-2">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1B4332]"
                placeholder="+966501234567"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1B4332] text-white rounded-lg font-medium hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
            >
              {loading ? t('common.loading') : t('auth.sendOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6B7280] mb-2">
                {t('auth.verifyOtp')}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1B4332] text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1B4332] text-white rounded-lg font-medium hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
            >
              {loading ? t('common.loading') : t('auth.verifyOtp')}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-[#6B7280]">
          {t('auth.registerTitle')}?{' '}
          <Link to="/register" className="text-[#1B4332] font-medium hover:underline">
            {t('nav.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
