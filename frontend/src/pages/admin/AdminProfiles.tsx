import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);

  const fetchProfiles = async () => {
    try {
      const res: any = await api.admin.pendingProfiles();
      setProfiles(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const approve = async (id: string) => {
    await api.admin.approveProfile(id);
    fetchProfiles();
  };

  const reject = async (id: string) => {
    await api.admin.rejectProfile(id);
    fetchProfiles();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">مراجعة الملفات الشخصية</h1>

      {profiles.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">لا توجد ملفات بانتظار المراجعة</div>
      ) : (
        <div className="space-y-4">
          {profiles.map((p: any) => (
            <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#1B4332]">{p.displayName}</h3>
                  <p className="text-sm text-[#6B7280]">{p.age} سنة • {p.nationality}</p>
                  <p className="text-sm text-[#6B7280]">{p.city}, {p.countryOfResidence}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-[#6B7280] mb-1">التعريف الذاتي:</p>
                <p className="text-sm leading-relaxed">{p.selfIntroduction?.slice(0, 300)}...</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => approve(p.id)}
                  className="px-4 py-2 bg-[#1B4332] text-white rounded-lg text-sm hover:bg-[#2D6A4F]"
                >
                  اعتماد
                </button>
                <button
                  onClick={() => reject(p.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
