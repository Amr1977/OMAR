import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

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
          {t('auth.loginTitle')}?{' '}
          <Link to="/login" className="text-[#1B4332] font-medium hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
