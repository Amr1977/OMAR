import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export default function Messages() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.messages.conversations()
      .then((res: any) => setConversations(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">{t('messages.title')}</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">{t('messages.noConversations')}</div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv: any) => {
            const lastMsg = conv.messages?.[0];
            return (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className="block bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#1B4332] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1B4332]">
                      {conv.request?.profile?.displayName || 'محادثة'}
                    </p>
                    {lastMsg && (
                      <p className="text-sm text-[#6B7280] truncate max-w-md">{lastMsg.content}</p>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-[#6B7280]">
                      {new Date(lastMsg.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
