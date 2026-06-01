import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res: any = await api.admin.users();
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBan = async (id: string) => {
    await api.admin.banUser(id);
    fetchUsers();
  };

  const toggleVerify = async (id: string) => {
    await api.admin.verifyUser(id);
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">إدارة المستخدمين</h1>
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right p-4 text-sm font-medium text-[#6B7280]">المعرف</th>
              <th className="text-right p-4 text-sm font-medium text-[#6B7280]">الهاتف</th>
              <th className="text-right p-4 text-sm font-medium text-[#6B7280]">الدور</th>
              <th className="text-right p-4 text-sm font-medium text-[#6B7280]">الاشتراك</th>
              <th className="text-right p-4 text-sm font-medium text-[#6B7280]">حظر</th>
              <th className="text-right p-4 text-sm font-medium text-[#6B7280]">توثيق</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-t border-[#E5E7EB]">
                <td className="p-4 text-sm">{u.id.slice(0, 8)}...</td>
                <td className="p-4 text-sm">{u.phone || '-'}</td>
                <td className="p-4 text-sm">{u.role}</td>
                <td className="p-4 text-sm">{u.subscriptionPlan}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleBan(u.id)}
                    className={`px-3 py-1 rounded text-sm ${u.isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {u.isBanned ? 'رفع الحظر' : 'حظر'}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleVerify(u.id)}
                    className={`px-3 py-1 rounded text-sm ${u.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {u.isVerified ? 'موثق' : 'توثيق'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
