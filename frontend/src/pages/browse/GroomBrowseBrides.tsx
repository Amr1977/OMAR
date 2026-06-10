import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

type Filters = {
  ageMin: string; ageMax: string; maritalStatus: string;
  education: string; prayerCommitment: string; hijabType: string;
  skinColor: string; originGovernorate: string; residenceGovernorate: string;
  acceptPolygamy: string; wantChildren: string; search: string;
};

const emptyFilters: Filters = {
  ageMin: '', ageMax: '', maritalStatus: '',
  education: '', prayerCommitment: '', hijabType: '',
  skinColor: '', originGovernorate: '', residenceGovernorate: '',
  acceptPolygamy: '', wantChildren: '', search: '',
};

export default function GroomBrowseBrides() {
  const [brides, setBrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedBride, setSelectedBride] = useState<any>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const handleSendRequest = async (bride: any) => {
    if (!bride.guardianProfileId) {
      alert('لا يمكن إرسال الطلب — ملف ولي الأمر غير متاح');
      return;
    }
    setSendingRequest(true);
    try {
      await api.requests.send({
        profileId: bride.guardianProfileId,
        brideId: bride.id,
        message: requestMessage.trim() || undefined,
      });
      setRequestSent(bride.id);
      setRequestMessage('');
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الطلب');
    } finally {
      setSendingRequest(false);
    }
  };

  const buildQuery = useCallback((page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params.toString();
  }, [filters]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await api.brides.visible(buildQuery(page));
      setBrides(data.brides);
      setPagination(data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { load(); }, [load]);

  const handleFilter = () => { load(); };

  const clearFilters = () => {
    setFilters(emptyFilters);
    load(1);
  };

  return (
    <div className="max-w-5xl mx-auto py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100 mb-6">السجلات المتاحة للعرض</h1>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ابحث بكلمة مفتاحية..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
            className="w-full p-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#1B4332] dark:text-gray-100"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-[#6B7280] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {showFilters ? 'إخفاء الفلتر' : 'فلتر متقدم'}
        </button>
        <button onClick={handleFilter} className="px-6 py-2 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8] transition-colors">بحث</button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">السن من</label>
            <input type="number" value={filters.ageMin} onChange={e => setFilters(f => ({ ...f, ageMin: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">السن إلى</label>
            <input type="number" value={filters.ageMax} onChange={e => setFilters(f => ({ ...f, ageMax: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">الحالة الاجتماعية</label>
            <select value={filters.maritalStatus} onChange={e => setFilters(f => ({ ...f, maritalStatus: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100">
              <option value="">الكل</option>
              <option value="عزباء">عزباء</option>
              <option value="مطلقة">مطلقة</option>
              <option value="أرملة">أرملة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">المؤهل</label>
            <select value={filters.education} onChange={e => setFilters(f => ({ ...f, education: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100">
              <option value="">الكل</option>
              <option value="كلية">كلية</option>
              <option value="فوق متوسط">فوق متوسط</option>
              <option value="متوسط">متوسط</option>
              <option value="إعدادية">إعدادية</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">الالتزام بالصلاة</label>
            <select value={filters.prayerCommitment} onChange={e => setFilters(f => ({ ...f, prayerCommitment: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100">
              <option value="">الكل</option>
              <option value="منتظم">منتظم</option>
              <option value="أغلب الوقت">أغلب الوقت</option>
              <option value="أحياناً">أحياناً</option>
              <option value="بتحسن">بتحسن</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">نوع الحجاب</label>
            <select value={filters.hijabType} onChange={e => setFilters(f => ({ ...f, hijabType: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100">
              <option value="">الكل</option>
              <option value="طرحة">طرحة</option>
              <option value="خمار">خمار</option>
              <option value="عباءة">عباءة</option>
              <option value="نقاب">نقاب</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">لون البشرة</label>
            <select value={filters.skinColor} onChange={e => setFilters(f => ({ ...f, skinColor: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100">
              <option value="">الكل</option>
              <option value="بيضاء">بيضاء</option>
              <option value="خمرية">خمرية</option>
              <option value="قمحية">قمحية</option>
              <option value="سمراء">سمراء</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">محافظة الإقامة</label>
            <input type="text" value={filters.residenceGovernorate} onChange={e => setFilters(f => ({ ...f, residenceGovernorate: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100" />
          </div>
          <div className="md:col-span-4 flex gap-2">
            <button onClick={handleFilter} className="px-4 py-2 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8] transition-colors">تطبيق</button>
            <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-[#6B7280] hover:bg-gray-50 dark:hover:bg-gray-700">مسح الكل</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>}

      {/* Results */}
      {!loading && brides.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-[#6B7280] dark:text-gray-400 mb-4">لا توجد سجلات متاحة حالياً</p>
          <p className="text-sm text-[#6B7280] dark:text-gray-400">عندما يشاركك ولي الأمر سجلات العرائس ستظهر هنا</p>
        </div>
      )}

      {!loading && brides.length > 0 && (
        <>
          <div className="text-sm text-[#6B7280] dark:text-gray-400 mb-3">إجمالي السجلات: {pagination.total}</div>
          <div className="grid gap-4">
            {brides.map(bride => (
              <div
                key={bride.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedBride(bride)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100">
                        عروس — كود #{bride.id.slice(-5)}
                      </h3>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">نشط</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-[#6B7280] dark:text-gray-400">
                      <span>السن: <strong className="text-[#1B4332] dark:text-gray-200">{bride.age}</strong></span>
                      <span>المحافظة: <strong className="text-[#1B4332] dark:text-gray-200">{bride.residenceGovernorate || '-'}</strong></span>
                      <span>الحالة: <strong className="text-[#1B4332] dark:text-gray-200">{bride.maritalStatus}</strong></span>
                      <span>المؤهل: <strong className="text-[#1B4332] dark:text-gray-200">{bride.educationName || bride.education || '-'}</strong></span>
                      <span>الالتزام: <strong className="text-[#1B4332] dark:text-gray-200">{bride.prayerCommitment || '-'}</strong></span>
                      <span>الحجاب: <strong className="text-[#1B4332] dark:text-gray-200">{bride.hijabType || '-'}</strong></span>
                      {bride.acceptPolygamy && <span>تعدد: <strong className="text-[#1B4332] dark:text-gray-200">{bride.acceptPolygamy}</strong></span>}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-[#6B7280] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => load(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-[#DAA520] text-[#1B4332]'
                      : 'bg-gray-100 dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Bride Detail Modal */}
      {selectedBride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBride(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1B4332] dark:text-gray-100">تفاصيل العروس</h2>
              <button onClick={() => setSelectedBride(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#6B7280]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Section title="المواصفات العامة">
                <Row label="السن" value={selectedBride.age} />
                <Row label="الوزن" value={selectedBride.weight} />
                <Row label="الطول" value={selectedBride.height} />
                <Row label="لون البشرة" value={selectedBride.skinColor} />
                {selectedBride.healthIssues && <Row label="أمراض/إعاقات" value={selectedBride.healthIssues} />}
              </Section>

              <Section title="الوضع العلمي والوظيفي">
                <Row label="المؤهل" value={selectedBride.education} />
                <Row label="اسم المؤهل" value={selectedBride.educationName} />
                <Row label="العمل" value={selectedBride.occupation} />
                <Row label="نوع العمل" value={selectedBride.workType} />
              </Section>

              <Section title="الحالة الاجتماعية">
                <Row label="الحالة" value={selectedBride.maritalStatus} />
                <Row label="عدد الأبناء (ذكور)" value={selectedBride.childrenBoys} />
                <Row label="عدد الأبناء (إناث)" value={selectedBride.childrenGirls} />
                <Row label="تقبل التعدد" value={selectedBride.acceptPolygamy} />
                <Row label="الرغبة في الإنجاب" value={selectedBride.wantChildren} />
              </Section>

              <Section title="السكن">
                <Row label="محافظة المنشأ" value={selectedBride.originGovernorate} />
                <Row label="محافظة الإقامة" value={selectedBride.residenceGovernorate} />
                <Row label="المنطقة" value={selectedBride.area} />
              </Section>

              <Section title="التدين">
                <Row label="الالتزام بالصلاة" value={selectedBride.prayerCommitment} />
                <Row label="نوع الحجاب" value={selectedBride.hijabType} />
                <Row label="استعداد للنقاب" value={selectedBride.acceptNiqab} />
              </Section>

              {selectedBride.notes && (
                <Section title="ملاحظات">
                  <p className="text-sm text-[#1B4332] dark:text-gray-200 whitespace-pre-wrap">{selectedBride.notes}</p>
                </Section>
              )}
            </div>

            {/* Send Contact Request */}
            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
              {requestSent === selectedBride?.id ? (
                <div className="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-green-700 dark:text-green-400 font-medium text-sm">✓ تم إرسال طلب التواصل</p>
                  <p className="text-xs text-[#6B7280] mt-1">سيتواصل معك ولي الأمر إذا قبل الطلب</p>
                </div>
              ) : selectedBride?.requestStatus ? (
                <div className="text-center py-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    {selectedBride.requestStatus === 'PENDING' ? 'طلبك قيد المراجعة' :
                     selectedBride.requestStatus === 'ACCEPTED' ? '✓ تم قبول طلبك' :
                     'تم رفض طلبك'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#1B4332] dark:text-gray-200 mb-2">أرسل طلب تواصل لولي الأمر</p>
                  <textarea
                    value={requestMessage}
                    onChange={e => setRequestMessage(e.target.value)}
                    placeholder="تعريف موجز بنفسك (اختياري)..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm resize-none focus:outline-none focus:border-[#DAA520] mb-3"
                  />
                  <button
                    onClick={() => handleSendRequest(selectedBride)}
                    disabled={sendingRequest || !selectedBride?.guardianProfileId}
                    className="w-full py-3 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-xl text-sm font-bold hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
                  >
                    {sendingRequest ? 'جاري الإرسال...' : 'إرسال طلب التواصل'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <h3 className="text-sm font-bold text-[#DAA520] mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === '' || value === 0) return null;
  return (
    <div className="text-sm">
      <span className="text-[#6B7280] dark:text-gray-400">{label}: </span>
      <span className="text-[#1B4332] dark:text-gray-200 font-medium">{String(value)}</span>
    </div>
  );
}
