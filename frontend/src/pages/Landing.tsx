import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: 'منشورات وتفاعل',
    desc: 'أنشر صوراً وفيديو، إعجابات، تعليقات، إعادة نشر، متابعات، وخصوصية كاملة للمنشورات.',
    badge: 'اجتماعي',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: 'مراسلات فورية',
    desc: 'دردشة مباشرة عبر Socket.IO مع مؤشرات الكتابة، وإشعارات فورية داخل التطبيق و FCM.',
    badge: 'تواصل',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'ملفات شخصية للزواج',
    desc: 'أكثر من 40 خانة تغطي المواصفات، التعليم، العمل، الأسرة، السكن، وتفضيلات شريك الحياة مع الصور.',
    badge: 'زواج',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'سجلات العرائس',
    desc: 'للأولياء: إدارة سجلات العرائس ببيانات شاملة (8 أقسام) مع حالات (نشط/مُوفَّق/مؤرشف).',
    badge: 'أولياء',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
    title: 'سوق الخدمات',
    desc: 'مزودو خدمات ومستهلكون — دليل مزودين، طلبات خدمة، تقييمات، وموقع على الخريطة.',
    badge: 'خدمات',
    highlight: true,
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
    title: 'متجر إلكتروني',
    desc: 'منصة متكاملة للمتاجر الإلكترونية — إدارة منتجات، سلة مشتريات، طلبات، وشحن.',
    badge: 'متجر',
    external: 'https://shop.et3am.com',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    title: 'خرائط ومواقع',
    desc: 'عرض على الخريطة (Leaflet) — مواقع مزودي الخدمات والمتاجر للعثور على الأقرب إليك.',
    badge: 'GIS',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'اشتراكات premium',
    desc: 'خطط مرنة (1/3/6/12 شهراً) مع دفع عبر إنستاباي، فودافون كاش، أو USDT TRC20 وشارات ذهبية.',
    badge: 'مميز',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: 'اقتراحات AI',
    desc: 'توصيات ذكية بالذكاء الاصطناعي (GPT-4o) للمساعدة في اختيار الأنسب.',
    badge: 'AI',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: 'دعم وتبرع',
    desc: 'ادعم المنصة بتبرع لمرة واحدة أو اشتراك شهري عبر إنستاباي، فودافون كاش، أو USDT TRC20.',
    badge: 'دعم',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    title: 'لوحة تحكم المشرف',
    desc: 'إدارة كاملة للمستخدمين، الملفات، المنشورات، المحادثات، الاشتراكات، والتبرعات مع رسوم بيانية.',
    badge: 'مشرف',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    title: 'بـ 4 لغات',
    desc: 'واجهة كاملة بالعربية (RTL)، الإنجليزية، الفرنسية، والأردية مع وضع مظلم.',
    badge: 'لغات',
  },
];

function TestimonialsSection({ testimonials, isAuthenticated }: { testimonials: any[]; isAuthenticated: boolean }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="max-w-5xl mx-auto mt-24 px-4 scroll-mt-20" dir="rtl" id="testimonials">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 bg-[#DAA520]/10 text-[#DAA520] rounded-full text-xs font-bold mb-3">شهادات</span>
        <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">ماذا يقول المستخدمون</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">كلمات من مجتمع عمر</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.slice(0, 6).map((t: any, i: number) => (
          <div key={t.id || i}
            className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6 relative hover:shadow-lg hover:border-[#DAA520]/30 transition-all duration-300 ${i === 0 ? 'md:col-span-2' : ''}`}>
            <div className="absolute -top-3 -right-3 text-3xl text-[#DAA520]/20 group-hover:text-[#DAA520]/40 transition-colors">❝</div>
            <p className="text-sm text-[#374151] dark:text-gray-300 leading-relaxed mb-4 line-clamp-4 relative z-10">{t.content}</p>
            <div className="flex items-center gap-2 border-t border-[#E5E7EB] dark:border-gray-700 pt-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-[#DAA520] dark:to-[#F5E6B8] flex items-center justify-center text-white dark:text-[#1B4332] text-xs font-bold shadow-sm">
                {t.title?.charAt(0) || 'م'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1B4332] dark:text-[#DAA520] truncate">{t.title}</p>
                {t.rating && (
                  <div className="text-amber-400 text-[11px] tracking-wider">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {isAuthenticated && (
        <div className="text-center mt-6">
          <Link to="/feedback" className="inline-flex items-center gap-1 text-sm text-[#DAA520] hover:text-[#C49520] font-medium transition-colors">
            أضف شهادتك
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      )}
    </section>
  );
}

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, profiles: 0, posts: 0, messages: 0, businesses: 0, orders: 0 });

  useEffect(() => {
    api.feedback.testimonials().then(setTestimonials).catch(() => {});
    api.get('/stats').then(setStats).catch(() => {});
  }, []);

  if (isAuthenticated && user) {
    const hasGroom = user.roles?.includes('GROOM');
    const hasGuardian = user.roles?.includes('GUARDIAN');
    const dashboardLink = hasGuardian ? '/browse' : hasGroom ? '/profile/my' : '/social';
    return (
      <div className="text-center py-12">
        {/* Welcome hero */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#DAA520]/10 text-[#DAA520] rounded-full text-xs font-bold mb-4">
            <span className="w-2 h-2 bg-[#DAA520] rounded-full animate-pulse" />
            مرحباً بعودتك
          </div>
          <h1 className="text-4xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-3">{t('app.name')}</h1>
          <p className="text-lg text-[#6B7280] dark:text-gray-300 mb-8">{t('app.tagline')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to={dashboardLink}
              className="px-8 py-3 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] dark:from-[#DAA520] dark:to-[#C49520] text-white dark:text-[#1B4332] rounded-xl text-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md"
            >
              {hasGuardian ? t('browse.title') : hasGroom ? t('profile.my') : 'المنشورات'}
            </Link>
          </div>
        </div>

        {/* Quick links grid */}
        <div className="max-w-4xl mx-auto mt-16 px-4" dir="rtl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: '/profile/my', label: 'ملفي', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
              { to: '/messages', label: 'الرسائل', icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155' },
              { to: '/settings/subscription', label: 'الاشتراك', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { to: '/donate', label: 'تبرع', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className="flex flex-col items-center gap-2 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#DAA520]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-6 h-6 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-xs font-medium text-[#1B4332] dark:text-gray-200">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <TestimonialsSection testimonials={testimonials} isAuthenticated={isAuthenticated} />

        {/* Story teaser */}
        <section className="max-w-5xl mx-auto mt-20 px-4 text-right" dir="rtl">
          <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-1">من سيرة أمهات المؤمنين</h2>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">قصص موثَّقة من أمهات المصادر الإسلامية</p>
          <Link
            to="/marriage/hafsa"
            className="group block bg-white dark:bg-gray-800 rounded-2xl border-t-4 border-t-[#DAA520] shadow-sm border border-[#E5E7EB] dark:border-gray-600 p-6 md:p-8 text-right no-underline hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#6B7280] dark:text-gray-400">أم المؤمنين</span>
              <span className="text-xs bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] dark:from-[#DAA520] dark:to-[#C49520] text-white dark:text-[#1B4332] px-3 py-1 rounded-full font-bold shadow-sm">السيرة النبوية</span>
            </div>
            <h3 className="text-[22px] font-bold text-[#1B4332] dark:text-gray-100 mb-3 group-hover:text-[#DAA520] transition-colors">حفصة بنت عمر رضي الله عنها</h3>
            <p className="text-base text-[#6B7280] dark:text-gray-300 leading-relaxed mb-4 line-clamp-3">
              زوجة النبي ﷺ وحافظة القرآن الكريم، ابنة الفاروق عمر بن الخطاب رضي الله عنه. قارئةٌ كاتبةٌ صوَّامةٌ قوَّامة، وصفها جبريل بأنها زوجة النبي ﷺ في الجنة.
            </p>
            <div className="border-t border-[#E5E7EB] dark:border-gray-600 pt-3 text-left">
              <span className="inline-flex items-center gap-1 text-[#DAA520] font-medium text-sm group-hover:gap-2 transition-all">اقرأ القصة كاملة ←</span>
            </div>
          </Link>
        </section>

        {/* Donation section */}
        <section className="max-w-5xl mx-auto mt-16 px-4" dir="rtl">
          <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 shadow-lg border border-[#DAA520]/20">
            <div className="flex justify-center mb-5">
              <svg className="w-12 h-12 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
          <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3 text-center">ادعم مشروع عمر</h2>
            <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6 text-center">
              تبرعاتكم تساعد في تطوير المنصة وتغطية تكاليف الاستضافة والخدمات.
            </p>
            <div className="bg-[#1B4332]/50 dark:bg-gray-700/50 rounded-xl p-5 mb-6 text-center max-w-sm mx-auto">
              <p className="text-[#DAA520] text-sm font-medium mb-2">رقم الدفع / المحفظة</p>
              <p className="text-white text-2xl font-bold tracking-wider">01094450141</p>
              <p className="text-[#B8DFC8] text-sm">Amr Lotfy</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-[#DAA520]/15 text-[#DAA520] rounded-full text-xs font-bold border border-[#DAA520]/20">إنستاباي</span>
                <span className="px-3 py-1 bg-[#DAA520]/15 text-[#DAA520] rounded-full text-xs font-bold border border-[#DAA520]/20">فودافون كاش</span>
                <span className="px-3 py-1 bg-[#2563EB]/15 text-[#2563EB] rounded-full text-xs font-bold border border-[#2563EB]/20">USDT TRC20</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[#B8DFC8] text-xs mb-1">USDT (TRC20)</p>
                <div className="flex items-center justify-center gap-1">
                  <p className="text-white text-xs font-mono">TGokJ43uzZvxwMAAsPaAtFmakZ1iQr4WTS</p>
                  <button onClick={() => navigator.clipboard.writeText('TGokJ43uzZvxwMAAsPaAtFmakZ1iQr4WTS')} className="p-1 rounded hover:bg-white/10 transition-colors" title="نسخ">
                    <svg className="w-3.5 h-3.5 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-amber-400/70 mt-0.5">⚠ يجب استخدام شبكة TRC20</p>
              </div>
            </div>
          </div>
        </section>

        {/* Open source */}
        <section className="max-w-5xl mx-auto mt-16 px-4 mb-16" dir="rtl">
          <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 text-center shadow-lg border border-[#DAA520]/20">
            <div className="flex justify-center mb-5">
              <svg viewBox="0 0 16 16" className="w-12 h-12 fill-[#DAA520]"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3">مشروع مفتوح المصدر</h2>
            <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6">
            عمر مشروع مفتوح المصدر نسعى من خلاله لخدمة المجتمع. نسعد بانضمامك إلينا في التطوير والتحسين.
            </p>
            <a href="https://github.com/Amr1977/OMAR" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md">
              <svg viewBox="0 0 16 16" className="w-5 h-5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Amr1977/OMAR
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center">
        {/* Decorative circles */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#D8F3DC]/30 via-transparent to-transparent dark:from-[#1B4332]/20 dark:via-transparent dark:to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-[#DAA520]/5 dark:bg-[#DAA520]/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full bg-[#1B4332]/5 dark:bg-[#2D6A4F]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-4 h-4 rounded-full bg-[#DAA520]/20 animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 rounded-full bg-[#DAA520]/15 animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <span className="inline-block px-4 py-1.5 bg-[#DAA520]/10 text-[#DAA520] rounded-full text-xs font-bold mb-5 border border-[#DAA520]/20">
            {t('app.name')}
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6 font-display leading-tight">
            {t('app.name')}
          </h1>
          <p className="text-xl md:text-2xl text-[#6B7280] dark:text-gray-300 mb-3 font-medium">{t('app.tagline')}</p>
          <p className="text-base text-[#6B7280] dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('app.description')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register"
              className="px-8 py-3.5 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] dark:from-[#DAA520] dark:to-[#C49520] text-white dark:text-[#1B4332] rounded-xl text-lg font-bold hover:shadow-xl hover:scale-105 transition-all duration-200 shadow-lg">
              ابدأ الآن — مجاناً
            </Link>
            <Link to="/login"
              className="px-8 py-3.5 border-2 border-[#1B4332] dark:border-[#DAA520] text-[#1B4332] dark:text-[#DAA520] rounded-xl text-lg font-medium hover:bg-[#D8F3DC] dark:hover:bg-[#1B4332]/40 hover:shadow-md transition-all duration-200">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="relative h-16 -mt-16 pointer-events-none">
        <svg className="absolute bottom-0 w-full h-16 text-white dark:text-gray-900" viewBox="0 0 1440 64" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,32 C360,64 720,0 1440,32 L1440,64 L0,64 Z" opacity="0.4" />
          <path d="M0,48 C360,16 720,48 1440,16 L1440,64 L0,64 Z" opacity="0.2" />
        </svg>
      </div>

      {/* ─── Stats ─── */}
      <section className="max-w-4xl mx-auto px-4 mb-16" dir="rtl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { label: 'مستخدم', value: stats.users },
            { label: 'ملف شخصي', value: stats.profiles },
            { label: 'منشور', value: stats.posts },
            { label: 'رسالة', value: stats.messages },
            { label: 'متجر', value: stats.businesses },
            { label: 'طلب', value: stats.orders },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#DAA520]">{(s.value ?? 0).toLocaleString('ar-EG')}</p>
              <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="max-w-6xl mx-auto px-4 mb-16 scroll-mt-20" dir="rtl" id="features">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-[#DAA520]/10 text-[#DAA520] rounded-full text-xs font-bold mb-3">مميزات المنصة</span>
          <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">منصة متكاملة بأربعة أبعاد</h2>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">اجتماعي — خدمات — زواج — متجر إلكتروني</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Wrapper = (f as any).external ? 'a' : 'div';
              const wrapperProps = (f as any).external
                ? { href: (f as any).external, target: '_blank', rel: 'noopener noreferrer' }
                : {};
              return (
                <Wrapper key={i} {...wrapperProps}
                  className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-[#DAA520]/30 hover:-translate-y-1 transition-all duration-300 ${(f as any).external ? 'cursor-pointer' : ''}`}
                >
                  <div className="w-11 h-11 bg-[#D8F3DC] dark:bg-[#1B4332]/60 text-[#1B4332] dark:text-[#DAA520] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-[#1B4332] dark:text-gray-100">{f.title}</h3>
                    <span className="shrink-0 px-2 py-0.5 bg-[#DAA520]/10 text-[#DAA520] rounded-md text-[10px] font-bold">{f.badge}</span>
                  </div>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  {(f as any).external && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#DAA520] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      زيارة المتجر
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  )}
                </Wrapper>
              );
            })}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="bg-[#D8F3DC]/30 dark:bg-gray-800/50 py-16 scroll-mt-20" dir="rtl" id="how-it-works">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-[#DAA520]/10 text-[#DAA520] rounded-full text-xs font-bold mb-3">طريقة العمل</span>
            <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520]">اختر دورك وابدأ رحلتك</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                role: 'تواصل اجتماعي',
                icon: '🌐',
                steps: ['سجل كتواصل اجتماعي', 'انشر منشورات وصور وفيديو', 'تفاعل مع المجتمع', 'تواصل مع الأصدقاء'],
              },
              {
                role: 'راغب في الزواج',
                icon: '👤',
                steps: ['سجل حسابك', 'أنشئ ملفك الشخصي (40+ خانة)', 'استقبل طلبات الأولياء', 'تواصل عبر الرسائل'],
              },
              {
                role: 'ولي الأمر',
                icon: '👪',
                steps: ['سجل كولي أمر', 'أضف سجلات العرائس', 'تصفح الملفات المناسبة', 'أرسل طلبات تواصل'],
              },
              {
                role: 'مزود خدمة',
                icon: '🔧',
                steps: ['سجل كمزود خدمة', 'أنشئ متجر خدماتك', 'استقبل طلبات العملاء', 'قدّم الخدمة واحصل على تقييم'],
              },
              {
                role: 'صاحب متجر',
                icon: '🏪',
                href: 'https://shop.et3am.com',
                steps: ['أنشئ متجرك على shop.et3am.com', 'أضف المنتجات والصور', 'استقبل الطلبات', 'تتبع حالة الشحن'],
              },
              {
                role: 'باحث عن خدمات',
                icon: '🔍',
                steps: ['تصفح طلبات الخدمة', 'اطلب خدمة مخصصة', 'استقبل عروض المزودين', 'قيّم الخدمة المقدمة'],
              },
            ].map((item) => {
              const Wrapper2 = (item as any).href ? 'a' : 'div';
              const wrapperProps2 = (item as any).href
                ? { href: (item as any).href, target: '_blank', rel: 'noopener noreferrer' }
                : {};
              return (
              <Wrapper2 key={item.role} {...wrapperProps2} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 text-center hover:shadow-xl hover:border-[#DAA520]/30 hover:-translate-y-1 transition-all duration-300">
                <span className="text-4xl block mb-4">{item.icon}</span>
                <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">{item.role}</h3>
                <ol className="text-right space-y-3" dir="rtl">
                  {item.steps.map((step, si) => (
                    <li key={si} className="flex items-center gap-3 text-sm text-[#6B7280] dark:text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-[#DAA520] text-white text-xs font-bold flex items-center justify-center shrink-0">{si + 1}</span>
                      {step}
                    </li>
                  ))}
                  </ol>
                </Wrapper2>
              );
            })}
          </div>
        </div>
      </section>

      <TestimonialsSection testimonials={testimonials} isAuthenticated={isAuthenticated} />

      {/* ─── Story teaser ─── */}
      <section className="max-w-5xl mx-auto mt-20 px-4 text-right" dir="rtl">
        <h2 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-1">من سيرة أمهات المؤمنين</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">قصص موثَّقة من أمهات المصادر الإسلامية</p>
        <Link to="/marriage/hafsa"
          className="group block bg-white dark:bg-gray-800 rounded-2xl border-t-4 border-t-[#DAA520] shadow-sm border border-[#E5E7EB] dark:border-gray-600 p-6 md:p-8 text-right no-underline hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#6B7280] dark:text-gray-400">أم المؤمنين</span>
            <span className="text-xs bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] dark:from-[#DAA520] dark:to-[#C49520] text-white dark:text-[#1B4332] px-3 py-1 rounded-full font-bold shadow-sm">السيرة النبوية</span>
          </div>
          <h3 className="text-[22px] font-bold text-[#1B4332] dark:text-gray-100 mb-3 group-hover:text-[#DAA520] transition-colors">حفصة بنت عمر رضي الله عنها</h3>
          <p className="text-base text-[#6B7280] dark:text-gray-300 leading-relaxed mb-4 line-clamp-3">
            زوجة النبي ﷺ وحافظة القرآن الكريم، ابنة الفاروق عمر بن الخطاب رضي الله عنه. قارئةٌ كاتبةٌ صوَّامةٌ قوَّامة، وصفها جبريل بأنها زوجة النبي ﷺ في الجنة.
          </p>
          <div className="border-t border-[#E5E7EB] dark:border-gray-600 pt-3 text-left">
            <span className="inline-flex items-center gap-1 text-[#DAA520] font-medium text-sm group-hover:gap-2 transition-all">اقرأ القصة كاملة ←</span>
          </div>
        </Link>
      </section>

      {/* ─── Donation (unauthenticated) ─── */}
      <section className="max-w-5xl mx-auto mt-16 px-4" dir="rtl">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 shadow-lg border border-[#DAA520]/20">
          <div className="flex justify-center mb-5">
            <svg className="w-12 h-12 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3 text-center">ادعم مشروع عمر</h2>
          <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6 text-center">
            تبرعاتكم تساعد في تطوير المنصة وتغطية تكاليف الاستضافة والخدمات.
          </p>
          <div className="bg-[#1B4332]/50 dark:bg-gray-700/50 rounded-xl p-5 mb-6 text-center max-w-sm mx-auto">
            <p className="text-[#DAA520] text-sm font-medium mb-2">رقم الدفع / المحفظة</p>
            <p className="text-white text-2xl font-bold tracking-wider">01094450141</p>
            <p className="text-[#B8DFC8] text-sm">Amr Lotfy</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="px-3 py-1 bg-[#DAA520]/15 text-[#DAA520] rounded-full text-xs font-bold border border-[#DAA520]/20">إنستاباي</span>
              <span className="px-3 py-1 bg-[#DAA520]/15 text-[#DAA520] rounded-full text-xs font-bold border border-[#DAA520]/20">فودافون كاش</span>
              <span className="px-3 py-1 bg-[#2563EB]/15 text-[#2563EB] rounded-full text-xs font-bold border border-[#2563EB]/20">USDT TRC20</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[#B8DFC8] text-xs mb-1">USDT (TRC20)</p>
              <div className="flex items-center justify-center gap-1">
                <p className="text-white text-xs font-mono">TGokJ43uzZvxwMAAsPaAtFmakZ1iQr4WTS</p>
                <button onClick={() => navigator.clipboard.writeText('TGokJ43uzZvxwMAAsPaAtFmakZ1iQr4WTS')} className="p-1 rounded hover:bg-white/10 transition-colors" title="نسخ">
                  <svg className="w-3.5 h-3.5 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-amber-400/70 mt-0.5">⚠ يجب استخدام شبكة TRC20</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Open source ─── */}
      <section className="max-w-5xl mx-auto mt-16 px-4 mb-16" dir="rtl">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-10 text-center shadow-lg border border-[#DAA520]/20">
          <div className="flex justify-center mb-5">
            <svg viewBox="0 0 16 16" className="w-12 h-12 fill-[#DAA520]"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#F5E6B8] mb-3">مشروع مفتوح المصدر</h2>
          <p className="text-base text-[#B8DFC8] leading-relaxed max-w-2xl mx-auto mb-6">
            عمر مشروع مفتوح المصدر نسعى من خلاله لخدمة المجتمع. نسعد بانضمامك إلينا في التطوير والتحسين.
          </p>
          <a href="https://github.com/Amr1977/OMAR" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#DAA520] text-[#1B4332] rounded-xl font-bold hover:bg-[#F5E6B8] hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md">
            <svg viewBox="0 0 16 16" className="w-5 h-5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Amr1977/OMAR
          </a>
        </div>
      </section>
    </div>
  );
}
