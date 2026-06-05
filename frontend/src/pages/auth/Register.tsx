import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../stores/authStore';
import { api, setToken } from '../../lib/api';
import { signInWithGoogle } from '../../lib/googleAuth';

const roles = [
  { value: 'SOCIAL', label: 'تواصل اجتماعي', desc: 'أركز على المنشورات', icon: '🌐' },
  { value: 'GROOM', label: 'راغب في الزواج', desc: 'أبحث عن زوجة', icon: '👤' },
  { value: 'GUARDIAN', label: 'ولي أمر', desc: 'أبحث عن زوج لمن أرعاه', icon: '👪' },
  { value: 'BOTH', label: 'الاثنين معاً', desc: 'أبحث عن زوجة ولدي من أرعاه', icon: '🤝' },
];

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'GROOM',
    language: 'ar',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const result = await api.post('/auth/register', {
        firebaseUid: cred.user.uid,
        email: form.email,
        role: form.role,
        language: form.language,
      });
      setToken(result.accessToken);
      localStorage.setItem('auth_token', result.accessToken);
      const user = await api.auth.getMe();
      login(result.accessToken, user);
      navigate(form.role === 'SOCIAL' ? '/social' : '/profile/setup');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'هذا البريد مسجل بالفعل'
        : err.code === 'auth/weak-password'
        ? 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)'
        : err.message || 'فشل التسجيل';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle(form.role);
      navigate(form.role === 'SOCIAL' ? '/social' : '/profile/setup');
    } catch (err: any) {
      setError(err.message || 'فشل التسجيل عبر Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-[#1B4332] dark:text-[#DAA520] font-display tracking-tight">
            حفصة
          </Link>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">منصة زواج إسلامية موثوقة</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E5E7EB] dark:border-gray-700 p-8 md:p-10 transition-all duration-200">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#1B4332]/10 dark:bg-[#DAA520]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#1B4332] dark:text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100">إنشاء حساب جديد</h1>
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">انضم إلى حفصة وابدأ رحلة البحث</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6 text-sm">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Google button */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full py-3.5 border-2 border-[#E5E7EB] dark:border-gray-600 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all duration-200 group">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-[#374151] dark:text-gray-300 group-hover:text-[#1B4332] dark:group-hover:text-[#DAA520]">
              {googleLoading ? 'جاري التحميل...' : 'التسجيل باستخدام Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB] dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-800 px-4 text-sm text-[#9CA3AF] dark:text-gray-500">أو بالبريد الإلكتروني</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-2.5">أنا ...</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {roles.map((r) => (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                      form.role === r.value
                        ? 'border-[#1B4332] dark:border-[#DAA520] bg-[#1B4332]/5 dark:bg-[#DAA520]/10 shadow-sm'
                        : 'border-[#E5E7EB] dark:border-gray-600 hover:border-[#9CA3AF] dark:hover:border-gray-500'
                    }`}>
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className={`text-xs font-medium leading-tight ${
                      form.role === r.value ? 'text-[#1B4332] dark:text-[#DAA520]' : 'text-[#6B7280] dark:text-gray-400'
                    }`}>
                      {r.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pr-11 pl-4 py-3 border-2 border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 placeholder-[#9CA3AF] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520] transition-colors duration-200 text-sm"
                  placeholder="example@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pr-11 pl-11 py-3 border-2 border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 placeholder-[#9CA3AF] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520] transition-colors duration-200 text-sm"
                  placeholder="أقل شيء 6 أحرف" minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] dark:hover:text-gray-300 transition-colors">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl font-semibold hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري التحميل...
                </span>
              ) : 'إنشاء الحساب'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-7 text-center text-sm text-[#6B7280] dark:text-gray-400">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-[#1B4332] dark:text-[#DAA520] font-semibold hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
