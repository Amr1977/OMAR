import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ConnectionRequests() {
  const [pending, setPending] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'connections'>('pending');

  const fetchData = async () => {
    try {
      const [pendRes, connRes] = await Promise.all([
        api.connections.pending(),
        api.connections.myConnections(),
      ]);
      setPending(pendRes);
      setConnections(connRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.connections.accept(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-8 text-[#6B7280] dark:text-gray-400">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">جهات الاتصال</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pending'
              ? 'bg-[#1B4332] text-white dark:bg-[#DAA520] dark:text-[#1B4332]'
              : 'border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300'
          }`}
        >
          طلبات الاتصال {pending.length > 0 && `(${pending.length})`}
        </button>
        <button
          onClick={() => setTab('connections')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'connections'
              ? 'bg-[#1B4332] text-white dark:bg-[#DAA520] dark:text-[#1B4332]'
              : 'border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300'
          }`}
        >
          جهات الاتصال {connections.length > 0 && `(${connections.length})`}
        </button>
      </div>

      {tab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <div className="text-center py-16 text-[#6B7280] dark:text-gray-400">لا توجد طلبات اتصال جديدة</div>
          ) : (
            <div className="space-y-3">
              {pending.map((conn: any) => (
                <div key={conn.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-[#E5E7EB] dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Link to={`/profile/${conn.sender?.id}`} className="font-medium text-[#1B4332] dark:text-gray-200 hover:underline">
                        {conn.sender?.displayName || conn.sender?.email || 'مستخدم'}
                      </Link>
                      {conn.message && <p className="text-sm text-[#6B7280] mt-1">{conn.message}</p>}
                    </div>
                    <span className="text-xs text-[#6B7280]">{new Date(conn.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <button
                    onClick={() => handleAccept(conn.id)}
                    className="px-4 py-2 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-sm font-medium hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors"
                  >
                    قبول
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'connections' && (
        <>
          {connections.length === 0 ? (
            <div className="text-center py-16 text-[#6B7280] dark:text-gray-400">لا توجد جهات اتصال بعد</div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn: any) => {
                const otherUser = conn.sender || conn.receiver;
                return (
                  <div key={conn.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-[#E5E7EB] dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <Link to={`/messages/direct/${conn.id}`} className="font-medium text-[#1B4332] dark:text-gray-200 hover:underline">
                        {otherUser?.displayName || otherUser?.email || 'مستخدم'}
                      </Link>
                      <span className="text-xs text-[#6B7280]">{new Date(conn.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
