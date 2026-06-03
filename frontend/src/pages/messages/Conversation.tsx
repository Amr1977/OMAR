import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, photoUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';

export default function Conversation() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.messages.getConversation(id)
      .then((conv: any) => {
        setMessages(conv.messages || []);
        const other = conv.participants?.find((p: any) => p.user.id !== user?.id)?.user;
        setPartner(other || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const socket = getSocket();
    if (socket) {
      socket.emit('join_conversation', { conversationId: id });
      socket.on('new_message', (data: any) => {
        if (data.conversationId === id) {
          setMessages((prev) => [...prev, data.message]);
        }
      });
      return () => {
        socket.emit('leave_conversation', { conversationId: id });
        socket.off('new_message');
      };
    }
  }, [id, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!id || !content.trim() || sending) return;
    const text = content.trim();
    setContent('');
    setSending(true);
    try {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('send_message', { conversationId: id, content: text });
        inputRef.current?.focus();
      } else {
        const msg: any = await api.messages.send(id, text);
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const partnerName = partner?.profile?.displayName || 'المحادثة';
  const partnerAvatar = partner?.profile?.photos?.[0]?.url ? photoUrl(partner.profile.photos[0].url) : null;

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      <div className="animate-pulse">
        <div className="h-16 bg-[var(--color-surface)] rounded-t-xl border border-[var(--color-border)] mb-0" />
        <div className="h-[500px] bg-[var(--color-surface)] border-x border-[var(--color-border)] p-4 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`h-10 rounded-lg ${i % 2 === 0 ? 'w-48' : 'w-36'} bg-gray-100 dark:bg-gray-700`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
          <Link to="/messages" className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          {partnerAvatar ? (
            <img src={partnerAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary-pale)] flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
              {partnerName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-[var(--color-text)] text-sm">{partnerName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-muted)]">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">{t('messages.noMessages') || 'لا توجد رسائل بعد، ابدأ المحادثة'}</p>
            </div>
          )}
          {messages.map((msg: any) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMine && (
                  partnerAvatar ? (
                    <img src={partnerAvatar} alt="" className="w-7 h-7 mt-1 rounded-full flex-shrink-0 object-cover" />
                  ) : (
                    <div className="w-7 h-7 mt-1 rounded-full flex-shrink-0 bg-[var(--color-primary-pale)] flex items-center justify-center text-[var(--color-primary)] font-bold text-[10px]">
                      {partnerName.charAt(0)}
                    </div>
                  )
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isMine
                        ? 'bg-[var(--color-primary)] text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text)] rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-[var(--color-muted)] mt-0.5 ${isMine ? 'text-left' : 'text-right'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-full bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
              placeholder={t('messages.typeMessage')}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!content.trim() || sending}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {sending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
