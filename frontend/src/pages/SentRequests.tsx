import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export default function SentRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.requests.sent()
      .then((res: any) => setRequests(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">{t('requests.sent')}</h1>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">{t('requests.noRequests')}</div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <div>
                  <Link to={`/browse/${req.profile?.id}`} className="font-medium text-[#1B4332] hover:underline">
                    {req.profile?.displayName || 'ملف شخصي'}
                  </Link>
                  <p className="text-sm text-[#6B7280]">{new Date(req.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  req.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {t(`requests.${req.status.toLowerCase()}`)}
                </span>
              </div>
              {req.conversation && (
                <Link to={`/messages/${req.conversation.id}`} className="text-sm text-[#1B4332] hover:underline mt-2 block">
                  فتح المحادثة
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
