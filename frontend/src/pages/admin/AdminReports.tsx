import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    api.admin.reports()
      .then((res: any) => setReports(res))
      .catch(console.error);
  }, []);

  const resolve = async (id: string) => {
    await api.admin.resolveReport(id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'RESOLVED' } : r));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">البلاغات</h1>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">لا توجد بلاغات</div>
      ) : (
        <div className="space-y-4">
          {reports.map((r: any) => (
            <div key={r.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-[#1B4332]">{r.reason}</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {r.status}
                </span>
              </div>
              {r.details && <p className="text-sm text-[#6B7280] mb-3">{r.details}</p>}
              <p className="text-xs text-[#6B7280] mb-3">
                {new Date(r.createdAt).toLocaleDateString('ar-SA')}
              </p>
              {r.status === 'PENDING' && (
                <button
                  onClick={() => resolve(r.id)}
                  className="px-4 py-2 bg-[#1B4332] text-white rounded-lg text-sm hover:bg-[#2D6A4F]"
                >
                  حل البلاغ
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
