import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    api.feedback.testimonials().then(setTestimonials).catch(() => {});
  }, []);

  const TestimonialsSection = () => testimonials.length > 0 ? (
    <div className="max-w-5xl mx-auto mt-20 px-4" dir="rtl">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-1">كلمات المستخدمين</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400">ماذا يقول عنا المستخدمون</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.slice(0, 6).map((t: any, i: number) => (
          <div key={t.id || i}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6 relative ${i === 0 ? 'md:col-span-2 md:row-span-1' : ''}`}>
            <div className="absolute -top-3 -right-3 text-3xl text-[#DAA520]/30">❝</div>
            <p className="text-sm text-[#374151] dark:text-gray-300 leading-relaxed mb-4 line-clamp-4">{t.content}</p>
            <div className="flex items-center gap-2 border-t border-[#E5E7EB] dark:border-gray-700 pt-3">
              <div className="w-8 h-8 rounded-full bg-[#1B4332] dark:bg-[#DAA520] flex items-center justify-center text-white dark:text-[#1B4332] text-xs font-bold">
                {t.title?.charAt(0) || 'م'}
              </div>
              <div>
                <p className="text-xs font-medium text-[#1B4332] dark:text-[#DAA520]">{t.title}</p>
                {t.rating && (
                  <div className="text-amber-400 text-xs">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {isAuthenticated && (
        <div className="text-center mt-6">
          <Link to="/feedback" className="text-sm text-[#DAA520] hover:underline">أضف شهادتك ←</Link>
        </div>
      )}
    </div>
  ) : null;

  if (isAuthenticated && user) {
    const dashboardLink = user.role === 'GROOM' ? '/profile/my' : '/browse';
    return (
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-4">
          {t('app.name')}
        </h1>
        <p className="text-lg text-[#6B7280] dark:text-gray-300 mb-8">{t('app.tagline')}</p>
        <Link
          to={dashboardLink}
          className="inline-block px-8 py-3 bg-[#1B4332] text-white rounded-lg text-lg font-medium hover:bg-[#2D6A4F]"
        >
          {user.role === 'GROOM' ? t('profile.my') : t('browse.title')}
        </Link>

          <TestimonialsSection />

          {/* ─── Story teaser section (authenticated) ─── */}
          <div className="max-w-5xl mx-auto mt-20 px-4 text-right" dir="rtl">
            <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-1">من سيرة أمهات المؤمنين</h2>
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">قصص موثَّقة من أمهات المصادر الإسلامية</p>
            <Link
              to="/siyar/hafsa-bint-umar"
              className="block bg-white dark:bg-gray-800 rounded-xl border-t-4 border-t-[#DAA520] shadow-sm border border-[#E5E7EB] dark:border-gray-600 p-6 text-right no-underline hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#6B7280] dark:text-gray-400">أم المؤمنين</span>
                <span className="text-xs bg-[#1B4332] dark:bg-[#DAA520] text-[#DAA520] dark:text-[#1B4332] px-3 py-1 rounded-full font-medium">السيرة النبوية</span>
              </div>
              <h3 className="text-[22px] font-bold text-[#1B4332] dark:text-gray-100 mb-3">حفصة بنت عمر رضي الله عنها</h3>
              <p className="text-base text-[#6B7280] dark:text-gray-300 leading-relaxed mb-4 line-clamp-3">
                زوجة النبي ﷺ وحافظة القرآن الكريم، ابنة الفاروق عمر بن الخطاب رضي الله عنه. قارئةٌ كاتبةٌ صوَّامةٌ قوَّامة، وصفها جبريل بأنها زوجة النبي ﷺ في الجنة.
              </p>
              <div className="border-t border-[#E5E7EB] dark:border-gray-600 pt-3 text-left">
                <span className="text-[#DAA520] font-medium text-sm">← اقرأ القصة كاملة</span>
              </div>
            </Link>
          </div>

          {/* ─── Donation section (authenticated) ─── */}
          <div className="max-w-5xl mx-auto mt-16 px-4" dir="rtl">
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 shadow-lg border border-[#DAA520]/20">
              <div className="flex justify-center mb-5">
                <svg className="w-12 h-12 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3 text-center">ادعم مشروع حفصة</h2>
              <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6 text-center">
                تبرعاتكم تساعد في تطوير المنصة وتغطية تكاليف الاستضافة والخدمات. يمكنكم التبرع عبر إنستاباي أو فودافون كاش.
              </p>
              <div className="bg-[#1B4332]/50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-center max-w-sm mx-auto">
                <p className="text-[#DAA520] text-sm font-medium mb-1">رقم الدفع</p>
                <p className="text-white text-xl font-bold tracking-wider">01094450141</p>
                <p className="text-[#B8DFC8] text-sm">Amr Lotfy</p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <span className="px-3 py-0.5 bg-[#DAA520]/20 text-[#DAA520] rounded-full text-xs font-bold">إنستاباي</span>
                  <span className="px-3 py-0.5 bg-[#DAA520]/20 text-[#DAA520] rounded-full text-xs font-bold">فودافون كاش</span>
                </div>
              </div>
              <div className="text-center">
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  تبرع الآن
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Open source contribution section (authenticated) ─── */}
          <div className="max-w-5xl mx-auto mt-16 px-4" dir="rtl">
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 text-center shadow-lg border border-[#DAA520]/20">
              <div className="flex justify-center mb-5">
                <svg viewBox="0 0 16 16" className="w-12 h-12 fill-[#DAA520]">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3">مشروع مفتوح المصدر</h2>
              <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6">
                حفصة مشروع مفتوح المصدر نسعى من خلاله لخدمة المجتمع الإسلامي. نسعد بانضمامك إلينا في التطوير والتحسين.{' '}
                <br className="hidden sm:inline" />
                fork, issue, أو pull request — كل المساهمات مرحب بها.
              </p>
              <a
                href="https://github.com/Amr1977/HAFSA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] transition-colors shadow-md"
              >
                <svg viewBox="0 0 16 16" className="w-5 h-5 fill-current">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub: Amr1977/HAFSA
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
    <div className="text-center py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6 font-display">
          {t('app.name')}
        </h1>
        <p className="text-xl text-[#6B7280] dark:text-gray-300 mb-4">{t('app.tagline')}</p>
        <p className="text-base text-[#6B7280] dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('app.description')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-lg font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#F5E6B8] transition-colors"
          >
            {t('nav.register')}
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border border-[#1B4332] dark:border-[#DAA520] text-[#1B4332] dark:text-[#DAA520] rounded-lg text-lg font-medium hover:bg-[#D8F3DC] dark:hover:bg-[#1B4332] transition-colors"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-24 px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-[#E5E7EB] dark:border-gray-600">
            <div className="w-12 h-12 bg-[#D8F3DC] dark:bg-[#1B4332] rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1B4332] dark:text-gray-100 mb-2">
              للراغبين في الزواج
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-gray-300">
              أنشئ ملفك الشخصي وتعرف على الأولياء المهتمين
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-[#E5E7EB] dark:border-gray-600">
            <div className="w-12 h-12 bg-[#D8F3DC] dark:bg-[#1B4332] rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">👪</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1B4332] dark:text-gray-100 mb-2">
              للأولياء
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-gray-300">
              تصفح الملفات الشخصية واختر الأنسب لمن ترعى
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-[#E5E7EB] dark:border-gray-600">
            <div className="w-12 h-12 bg-[#D8F3DC] dark:bg-[#1B4332] rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1B4332] dark:text-gray-100 mb-2">
              تواصل آمن
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-gray-300">
              تواصل مع الطرف الآخر عبر الرسائل النصية الآمنة
            </p>
          </div>
        </div>
      </div>

      <TestimonialsSection />

      {/* ─── Story teaser section (unauthenticated) ─── */}
      <div className="max-w-5xl mx-auto mt-20 px-4 text-right" dir="rtl">
        <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-1">من سيرة أمهات المؤمنين</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">قصص موثَّقة من أمهات المصادر الإسلامية</p>
        <Link
          to="/siyar/hafsa-bint-umar"
          className="block bg-white dark:bg-gray-800 rounded-xl border-t-4 border-t-[#DAA520] shadow-sm border border-[#E5E7EB] dark:border-gray-600 p-6 text-right no-underline hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6B7280] dark:text-gray-400">أم المؤمنين</span>
            <span className="text-xs bg-[#1B4332] dark:bg-[#DAA520] text-[#DAA520] dark:text-[#1B4332] px-3 py-1 rounded-full font-medium">السيرة النبوية</span>
          </div>
          <h3 className="text-[22px] font-bold text-[#1B4332] dark:text-gray-100 mb-3">حفصة بنت عمر رضي الله عنها</h3>
          <p className="text-base text-[#6B7280] dark:text-gray-300 leading-relaxed mb-4 line-clamp-3">
            زوجة النبي ﷺ وحافظة القرآن الكريم، ابنة الفاروق عمر بن الخطاب رضي الله عنه. قارئةٌ كاتبةٌ صوَّامةٌ قوَّامة، وصفها جبريل بأنها زوجة النبي ﷺ في الجنة.
          </p>
          <div className="border-t border-[#E5E7EB] dark:border-gray-600 pt-3 text-left">
            <span className="text-[#DAA520] font-medium text-sm">← اقرأ القصة كاملة</span>
          </div>
        </Link>
      </div>

      {/* ─── Donation section (unauthenticated) ─── */}
      <div className="max-w-5xl mx-auto mt-16 px-4" dir="rtl">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 shadow-lg border border-[#DAA520]/20">
          <div className="flex justify-center mb-5">
            <svg className="w-12 h-12 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3 text-center">ادعم مشروع حفصة</h2>
          <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6 text-center">
            تبرعاتكم تساعد في تطوير المنصة وتغطية تكاليف الاستضافة والخدمات. يمكنكم التبرع عبر إنستاباي أو فودافون كاش.
          </p>
          <div className="bg-[#1B4332]/50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-center max-w-sm mx-auto">
            <p className="text-[#DAA520] text-sm font-medium mb-1">رقم الدفع</p>
            <p className="text-white text-xl font-bold tracking-wider">01094450141</p>
            <p className="text-[#B8DFC8] text-sm">Amr Lotfy</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="px-3 py-0.5 bg-[#DAA520]/20 text-[#DAA520] rounded-full text-xs font-bold">إنستاباي</span>
              <span className="px-3 py-0.5 bg-[#DAA520]/20 text-[#DAA520] rounded-full text-xs font-bold">فودافون كاش</span>
            </div>
          </div>
          <div className="text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] transition-colors shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              تبرع الآن
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Open source contribution section (unauthenticated) ─── */}
      <div className="max-w-5xl mx-auto mt-16 px-4 mb-16" dir="rtl">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 text-center shadow-lg border border-[#DAA520]/20">
          <div className="flex justify-center mb-5">
            <svg viewBox="0 0 16 16" className="w-12 h-12 fill-[#DAA520]">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3">مشروع مفتوح المصدر</h2>
          <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6">
            حفصة مشروع مفتوح المصدر نسعى من خلاله لخدمة المجتمع الإسلامي. نسعد بانضمامك إلينا في التطوير والتحسين.{' '}
            <br className="hidden sm:inline" />
            fork, issue, أو pull request — كل المساهمات مرحب بها.
          </p>
          <a
            href="https://github.com/Amr1977/HAFSA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] transition-colors shadow-md"
          >
            <svg viewBox="0 0 16 16" className="w-5 h-5 fill-current">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub: Amr1977/HAFSA
          </a>
        </div>
      </div>
    </div>
  );
}
