import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api, photoUrl } from '../../lib/api';

const formatDate = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000 && date.getDate() === now.getDate()) return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'أمس';
  return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
};

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.messages.conversations()
      .then((res: any) => setConversations(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getPartner = (conv: any) => {
    return conv.participants?.find((p: any) => p.user.id !== user?.id)?.user;
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto">
      <div className="animate-pulse space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{t('messages.title')}</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary-pale)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-[var(--color-muted)]">{t('messages.noConversations')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv: any) => {
            const lastMsg = conv.messages?.[0];
            const partner = getPartner(conv);
            const name = partner?.profile?.displayName || conv.request?.profile?.displayName || 'محادثة';
            const avatarUrl = partner?.profile?.photos?.[0]?.url ? photoUrl(partner.profile.photos[0].url) : null;
            return (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full flex-shrink-0 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex-shrink-0 bg-[var(--color-primary-pale)] flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-[var(--color-text)] truncate">{name}</p>
                    {lastMsg && (
                      <span className="text-[11px] text-[var(--color-muted)] flex-shrink-0 mr-2">
                        {formatDate(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  {lastMsg ? (
                    <p className="text-sm text-[var(--color-muted)] truncate">{lastMsg.content}</p>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] italic">لا توجد رسائل بعد</p>
                  )}
                </div>
                <svg className="w-5 h-5 text-[var(--color-border)] group-hover:text-[var(--color-muted)] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
