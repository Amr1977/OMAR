import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { signInWithGoogle } from '../../lib/googleAuth';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({
    phone: '',
    role: 'GROOM',
    language: 'ar',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.post('/auth/register', {
        firebaseUid: 'placeholder_' + Date.now(),
        phone: form.phone,
        role: form.role,
        language: form.language,
      });
      const user = await api.auth.getMe();
      localStorage.setItem('auth_token', result.accessToken);
      login(result.accessToken, user);
      navigate('/profile/setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle(form.role);
      navigate('/profile/setup');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E7EB]">
        <h1 className="text-2xl font-bold text-[#1B4332] mb-6 text-center">
          {t('auth.registerTitle')}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full py-3 border border-[#E5E7EB] rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-50 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? t('common.loading') : 'التسجيل باستخدام Google'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-[#6B7280]">أو</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              {t('auth.phone')}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1B4332]"
              placeholder="+966501234567"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              {t('auth.role')}
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1B4332] bg-white"
            >
              <option value="GROOM">{t('auth.role_groom')}</option>
              <option value="GUARDIAN">{t('auth.role_guardian')}</option>
              <option value="BOTH">{t('auth.role_both')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1B4332] text-white rounded-lg font-medium hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
          >
            {loading ? t('common.loading') : t('nav.register')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6B7280]">
          {t('auth.loginTitle')}؟{' '}
          <Link to="/login" className="text-[#1B4332] font-medium hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
