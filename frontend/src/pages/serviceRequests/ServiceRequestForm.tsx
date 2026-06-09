import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ServiceRequestForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.services.categories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('يرجى إدخال عنوان الطلب'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.serviceRequests.create({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        budget: budget ? parseFloat(budget) : undefined,
      });
      navigate('/service-requests');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">طلب خدمة جديد</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-[#E5E7EB] dark:border-gray-700 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">عنوان الطلب *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: مطلوب مصور زفاف"
            className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">وصف الطلب</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="اشرح تفاصيل الخدمة التي تبحث عنها..."
            className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">التصنيف</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nameAr}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1">الميزانية (ريال)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="مثال: 5000"
            className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-[#DAA520]"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] transition-colors"
          >
            {submitting ? 'جاري الإرسال...' : 'نشر الطلب'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/service-requests')}
            className="px-6 py-2.5 border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300 rounded-lg text-sm font-medium hover:border-[#1B4332] dark:hover:border-[#DAA520] transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
