import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export default function Notifications() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res: any = await api.notifications.list();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    fetch();
  };

  const markRead = async (id: string) => {
    await api.notifications.markRead(id);
    fetch();
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332]">الإشعارات</h1>
        <button
          onClick={markAllRead}
          className="text-sm text-[#1B4332] hover:underline"
        >
          تحديد الكل كمقروء
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">لا توجد إشعارات</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer transition-colors ${
                n.isRead ? 'border-[#E5E7EB]' : 'border-[#1B4332] bg-[#D8F3DC]'
              }`}
            >
              <p className="font-medium text-[#1B4332]">
                {i18n.language === 'ar' ? n.titleAr : n.titleEn}
              </p>
              <p className="text-sm text-[#6B7280]">
                {i18n.language === 'ar' ? n.bodyAr : n.bodyEn}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                {new Date(n.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
