import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function Subscription() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.payments.plans()
      .then((res: any) => setPlans(res.plans || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upgrade = async () => {
    try {
      await api.payments.createCheckout('premium');
      // Mock: upgrade immediately
      const updated = { ...user!, subscriptionPlan: 'PREMIUM' as const };
      setUser(updated as any);
      alert('تم الترقية إلى الاشتراك المميز');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">{t('settings.subscription')}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan: any) => (
          <div
            key={plan.id}
            className={`bg-white p-8 rounded-xl shadow-sm border ${
              plan.id === 'premium' ? 'border-[#B8860B] ring-2 ring-[#FFD700]' : 'border-[#E5E7EB]'
            }`}
          >
            <h2 className="text-xl font-bold text-[#1B4332] mb-2">
              {t(`settings.${plan.id}`)}
            </h2>
            <p className="text-3xl font-bold text-[#1B4332] mb-6">
              {plan.price === 0 ? t('settings.free') : `$${plan.price}/${t('common.month')}`}
            </p>
            <ul className="space-y-3 mb-8">
              {(plan.featuresEn as string[]).map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <span className="text-green-500">✓</span> {feature}
                </li>
              ))}
            </ul>
            {plan.id === 'premium' && user?.subscriptionPlan !== 'PREMIUM' && (
              <button
                onClick={upgrade}
                className="w-full py-3 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#FFD700] hover:text-[#1B4332] transition-colors"
              >
                {t('settings.upgrade')}
              </button>
            )}
            {user?.subscriptionPlan === 'PREMIUM' && plan.id === 'premium' && (
              <p className="text-center text-green-600 font-medium">مفعل حالياً</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
