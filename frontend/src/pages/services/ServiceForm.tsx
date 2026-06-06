import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LocationPicker from '../../components/LocationPicker';
import { api } from '../../lib/api';

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    price: '',
    priceUnit: 'FIXED',
    currency: 'EGP',
    latitude: null as number | null,
    longitude: null as number | null,
    address: '',
    city: '',
    governorate: '',
    images: [] as string[],
  });

  useEffect(() => {
    api.services.categories().then(setCategories).catch(() => {});
    if (id) {
      api.services.get(id).then((s) => {
        setForm({
          categoryId: s.categoryId,
          title: s.title,
          description: s.description,
          price: s.price.toString(),
          priceUnit: s.priceUnit,
          currency: s.currency,
          latitude: s.latitude,
          longitude: s.longitude,
          address: s.address || '',
          city: s.city || '',
          governorate: s.governorate || '',
          images: s.images || [],
        });
      }).catch(() => navigate('/services'));
    }
  }, [id]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isEdit) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.services.uploadImage(id!, fd);
        setForm((prev) => ({ ...prev, images: res.images }));
      } catch (err: any) {
        setError(err.message || 'فشل رفع الصورة');
      } finally {
        setUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = async (url: string) => {
    if (isEdit) {
      try {
        await api.services.deleteImage(id!, url);
        setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
      } catch (err: any) {
        setError(err.message || 'فشل حذف الصورة');
      }
    } else {
      setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.title || !form.description || !form.price) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await api.services.update(id!, form);
      } else {
        await api.services.create(form);
      }
      navigate('/my/services');
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الخدمة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-[#DAA520] mb-6">{isEdit ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">التصنيف *</label>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
          >
            <option value="">اختر التصنيف</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nameAr}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">عنوان الخدمة *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
            placeholder="مثال: تصميم مواقع، تدريس خصوصي..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">الوصف *</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 resize-none"
            rows={5} placeholder="صِف خدمتك بالتفصيل..."
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">السعر *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">وحدة السعر</label>
            <select value={form.priceUnit} onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
              className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
            >
              <option value="FIXED">سعر ثابت</option>
              <option value="HOURLY">بالساعة</option>
              <option value="DAILY">باليوم</option>
              <option value="NEGOTIABLE">قابل للتفاوض</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">العملة</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
            >
              <option value="EGP">EGP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">الموقع على الخريطة</label>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">المدينة</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">المحافظة</label>
            <input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })}
              className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">العنوان</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200"
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">الصور</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg border border-[#E5E7EB] dark:border-gray-600" />
                <button type="button" onClick={() => removeImage(img)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >x</button>
              </div>
            ))}
            {form.images.length < 10 && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-20 h-20 border-2 border-dashed border-[#DAA520]/50 rounded-lg flex items-center justify-center text-[#DAA520] hover:border-[#DAA520] hover:bg-[#DAA520]/5 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                )}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl font-bold hover:bg-[#2D6A4F] dark:hover:bg-[#E6C84A] disabled:opacity-50 transition-colors"
        >{loading ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'نشر الخدمة'}</button>
      </form>
    </div>
  );
}
