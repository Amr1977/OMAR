import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';

export default function Conversation() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.messages.getConversation(id)
      .then((conv: any) => setMessages(conv.messages || []))
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
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!id || !content.trim()) return;
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', { conversationId: id, content });
      } else {
        const msg: any = await api.messages.send(id, content);
        setMessages((prev) => [...prev, msg]);
      }
      setContent('');
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.senderId === user?.id
                    ? 'bg-[#D8F3DC] text-[#1B4332]'
                    : 'bg-gray-100 text-[#1A1A1A]'
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs text-[#6B7280] mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString('ar-SA')}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[#E5E7EB] p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1B4332]"
              placeholder={t('messages.typeMessage')}
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]"
            >
              {t('messages.send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
