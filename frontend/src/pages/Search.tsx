import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const TABS = [
  { key: '', label: 'الكل' },
  { key: 'profiles', label: 'حسابات' },
  { key: 'services', label: 'خدمات' },
  { key: 'posts', label: 'منشورات' },
  { key: 'serviceRequests', label: 'طلبات خدمة' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults({}); setSearched(false); return; }
    const timer = setTimeout(() => {
      setLoading(true);
      api.search.global(query, type || undefined)
        .then((res: any) => {
          setResults(res);
          setSearched(true);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [query, type]);

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">بحث</h1>

      <div className="relative mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن حسابات، خدمات، متاجر، منشورات..."
          className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-xl px-4 py-3 pr-10 text-sm bg-white dark:bg-gray-800 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
        />
        <svg className="absolute top-3.5 left-3 w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setType(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === tab.key
                ? 'bg-[#1B4332] text-white dark:bg-[#DAA520] dark:text-[#1B4332]'
                : 'border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300 hover:border-[#1B4332] dark:hover:border-[#DAA520]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-[#6B7280] dark:text-gray-400">جاري البحث...</div>
      )}

      {!loading && searched && !Object.values(results).some((arr: any) => arr.length > 0) && (
        <div className="text-center py-16 text-[#6B7280] dark:text-gray-400">
          لا توجد نتائج لـ "{query}"
        </div>
      )}

      {!loading && results.profiles?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-[#DAA520] mb-3">حسابات</h2>
          <div className="space-y-2">
            {results.profiles.map((p: any) => (
              <Link key={p.id} to={`/browse/${p.id}`}
                className="block bg-white dark:bg-gray-800 p-4 rounded-xl border border-[#E5E7EB] dark:border-gray-700 hover:border-[#1B4332] dark:hover:border-[#DAA520] transition-colors"
              >
                <p className="font-medium text-[#1B4332] dark:text-gray-200">{p.displayName || p.fullName || 'غير معروف'}</p>
                {p.governorate && <p className="text-sm text-[#6B7280]">{p.governorate}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && results.services?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-[#DAA520] mb-3">خدمات</h2>
          <div className="space-y-2">
            {results.services.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`}
                className="block bg-white dark:bg-gray-800 p-4 rounded-xl border border-[#E5E7EB] dark:border-gray-700 hover:border-[#1B4332] dark:hover:border-[#DAA520] transition-colors"
              >
                <p className="font-medium text-[#1B4332] dark:text-gray-200">{s.title}</p>
                <p className="text-sm text-[#6B7280]">{s.category?.nameAr || ''}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && results.posts?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-[#DAA520] mb-3">منشورات</h2>
          <div className="space-y-2">
            {results.posts.map((p: any) => (
              <Link key={p.id} to={`/social/post/${p.id}`}
                className="block bg-white dark:bg-gray-800 p-4 rounded-xl border border-[#E5E7EB] dark:border-gray-700 hover:border-[#1B4332] dark:hover:border-[#DAA520] transition-colors"
              >
                <p className="text-[#374151] dark:text-gray-300 line-clamp-2">{p.content}</p>
                <p className="text-xs text-[#6B7280] mt-1">{new Date(p.createdAt).toLocaleDateString('ar-SA')}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && results.serviceRequests?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#1B4332] dark:text-[#DAA520] mb-3">طلبات خدمة</h2>
          <div className="space-y-2">
            {results.serviceRequests.map((sr: any) => (
              <div key={sr.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-[#E5E7EB] dark:border-gray-700"
              >
                <p className="font-medium text-[#1B4332] dark:text-gray-200">{sr.title}</p>
                <p className="text-sm text-[#6B7280]">{sr.description?.slice(0, 150)}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  {sr.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
