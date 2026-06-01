import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    api.admin.dashboard().then(setStats).catch(console.error);
  }, []);

  const cards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, path: '/admin/users' },
    { label: 'الملفات الشخصية', value: stats.totalProfiles, path: '/admin/profiles' },
    { label: 'بانتظار المراجعة', value: stats.pendingProfiles, path: '/admin/profiles', highlight: true },
    { label: 'مستخدمين مميزين', value: stats.premiumUsers, path: '/admin/users' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332] mb-6">لوحة التحكم</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.path}
            className={`bg-white p-6 rounded-xl shadow-sm border ${
              card.highlight ? 'border-[#B8860B]' : 'border-[#E5E7EB]'
            } hover:shadow-md transition-shadow`}
          >
            <p className="text-3xl font-bold text-[#1B4332]">{card.value ?? '-'}</p>
            <p className="text-sm text-[#6B7280] mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#1B4332]"
        >
          <h3 className="font-semibold text-[#1B4332]">إدارة المستخدمين</h3>
          <p className="text-sm text-[#6B7280] mt-1">عرض وإدارة المستخدمين</p>
        </Link>
        <Link
          to="/admin/profiles"
          className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#1B4332]"
        >
          <h3 className="font-semibold text-[#1B4332]">الملفات الشخصية</h3>
          <p className="text-sm text-[#6B7280] mt-1">مراجعة واعتماد الملفات</p>
        </Link>
        <Link
          to="/admin/reports"
          className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#1B4332]"
        >
          <h3 className="font-semibold text-[#1B4332]">البلاغات</h3>
          <p className="text-sm text-[#6B7280] mt-1">إدارة بلاغات المستخدمين</p>
        </Link>
      </div>
    </div>
  );
}
