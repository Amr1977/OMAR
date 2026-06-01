import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export default function Requests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res: any = await api.requests.received();
      setRequests(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.requests.accept(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.requests.reject(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">{t('requests.received')}</h1>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">{t('requests.noRequests')}</div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-[#1B4332]">طلب تواصل</p>
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

              {req.status === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="px-4 py-2 bg-[#1B4332] text-white rounded-lg text-sm hover:bg-[#2D6A4F]"
                  >
                    {t('requests.accept')}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                  >
                    {t('requests.reject')}
                  </button>
                </div>
              )}

              {req.conversation && (
                <p className="text-sm text-[#6B7280] mt-3">
                  <a href={`/messages/${req.conversation.id}`} className="text-[#1B4332] hover:underline">
                    فتح المحادثة
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
