import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';

const SECTIONS = [
  { id: 'general', label: 'المواصفات العامة' },
  { id: 'education', label: 'الوضع العلمي والوظيفي' },
  { id: 'marital', label: 'الحالة الاجتماعية' },
  { id: 'family', label: 'بيانات الأسرة' },
  { id: 'residence', label: 'بيانات السكن' },
  { id: 'other', label: 'بيانات أخرى' },
  { id: 'partner', label: 'شروط شريك الحياة' },
  { id: 'additional', label: 'إضافات' },
];

const emptyBride = {
  age: 0, dateOfBirth: '', weight: 0, height: 0, skinColor: '', healthIssues: '',
  education: '', educationName: '', occupation: '', workType: '', leaveWorkAfterMarriage: '', incomeLevel: '',
  maritalStatus: '', previousRelationship: '', previousMarriageCount: 0, lastDivorceDate: '', husbandDeathDate: '',
  marriageCount: 0, childrenBoys: 0, childrenGirls: 0, childrenAges: '', custodyAfterMarriage: '',
  acceptPolygamy: '', wantChildren: '',
  fatherOccupation: '', motherOccupation: '', siblingsCount: 0, siblingsEducation: '',
  originGovernorate: '', residenceGovernorate: '', area: '', areaType: '',
  prayerCommitment: '', hijabType: '', acceptNiqab: '', acceptTravel: '', formSubmitter: '',
  preferredAgeMin: 0, preferredAgeMax: 0, preferredSkinColor: '', preferredMaritalStatus: '',
  acceptDivorcedWithChildren: '', acceptDivorcedChildrenCustody: '', acceptOtherGovernorate: '',
  preferredEducation: '', preferredGeneralSpecs: '',
  groomProvideApartment: '', publishConsent: '', previousContact: '', notes: '',
};

export default function BrideForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState<any>(emptyBride);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      api.brides.get(id!).then((data: any) => {
        setForm(data);
        setLoading(false);
      }).catch(() => navigate('/guardian/brides'));
    }
  }, [id]);

  const set = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) {
        await api.brides.update(id!, form);
      } else {
        await api.brides.create(form);
      }
      navigate('/guardian/brides');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-[#6B7280]">جاري التحميل...</div>;

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">المواصفات العامة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">السن *</label>
              <input type="number" value={form.age} onChange={e => set('age', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">تاريخ الميلاد</label>
              <input type="text" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} placeholder="مثال: ١/٧/٨٢" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">الوزن</label>
              <input type="number" value={form.weight || ''} onChange={e => set('weight', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">الطول</label>
              <input type="number" value={form.height || ''} onChange={e => set('height', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">لون البشرة</label>
              <select value={form.skinColor} onChange={e => set('skinColor', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="بيضاء">بيضاء</option>
                <option value="خمرية">خمرية</option>
                <option value="قمحية">قمحية</option>
                <option value="سمراء">سمراء</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">أمراض أو إعاقات</label>
              <input type="text" value={form.healthIssues} onChange={e => set('healthIssues', e.target.value)} placeholder="لا الحمدلله" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">الوضع العلمي والوظيفي</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">المؤهل</label>
              <select value={form.education} onChange={e => set('education', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="كلية">كلية</option>
                <option value="فوق متوسط">فوق متوسط</option>
                <option value="متوسط">متوسط</option>
                <option value="إعدادية">إعدادية</option>
                <option value="ابتدائية">ابتدائية</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">اسم المؤهل</label>
              <input type="text" value={form.educationName} onChange={e => set('educationName', e.target.value)} placeholder="بكالوريوس علوم" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">العمل الفعلي</label>
              <input type="text" value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="مدرسة" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">نوع العمل</label>
              <select value={form.workType} onChange={e => set('workType', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="حكومي">حكومي</option>
                <option value="خاص">خاص</option>
                <option value="حر">حر</option>
                <option value="لا أعمل">لا أعمل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">هل مستعدة لترك العمل بعد الزواج؟</label>
              <input type="text" value={form.leaveWorkAfterMarriage} onChange={e => set('leaveWorkAfterMarriage', e.target.value)} placeholder="علي حسب الاتفاق" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">المستوى المادي</label>
              <select value={form.incomeLevel} onChange={e => set('incomeLevel', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="عادي">عادي</option>
                <option value="متوسط">متوسط</option>
                <option value="مرتفع">مرتفع</option>
              </select>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">الحالة الاجتماعية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">الحالة الاجتماعية *</label>
              <select value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="عزباء">عزباء</option>
                <option value="مطلقة">مطلقة</option>
                <option value="أرملة">أرملة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">هل سبق الارتباط؟</label>
              <input type="text" value={form.previousRelationship} onChange={e => set('previousRelationship', e.target.value)} placeholder="زواج / خطوبة / لا" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">عدد مرات الزواج</label>
              <input type="number" value={form.marriageCount || ''} onChange={e => set('marriageCount', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">تاريخ آخر طلاق</label>
              <input type="text" value={form.lastDivorceDate} onChange={e => set('lastDivorceDate', e.target.value)} placeholder="٢٠٢٠" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">تاريخ وفاة الزوج</label>
              <input type="text" value={form.husbandDeathDate} onChange={e => set('husbandDeathDate', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">عدد الأبناء (ذكور)</label>
              <input type="number" value={form.childrenBoys || ''} onChange={e => set('childrenBoys', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">عدد الأبناء (إناث)</label>
              <input type="number" value={form.childrenGirls || ''} onChange={e => set('childrenGirls', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">أعمارهم</label>
              <input type="text" value={form.childrenAges} onChange={e => set('childrenAges', e.target.value)} placeholder="١٨و١٥" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">الحضانة بعد الزواج</label>
              <input type="text" value={form.custodyAfterMarriage} onChange={e => set('custodyAfterMarriage', e.target.value)} placeholder="مع والدهم" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">هل تقبلين زوجة ثانية؟</label>
              <input type="text" value={form.acceptPolygamy} onChange={e => set('acceptPolygamy', e.target.value)} placeholder="بعلم الزوجة الأولى" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">الرغبة في الإنجاب</label>
              <input type="text" value={form.wantChildren} onChange={e => set('wantChildren', e.target.value)} placeholder="علي حسب الاتفاق" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">بيانات الأسرة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">عمل الوالد</label>
              <input type="text" value={form.fatherOccupation} onChange={e => set('fatherOccupation', e.target.value)} placeholder="الله يرحمه / متوفي / ..." className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">عمل الوالدة</label>
              <input type="text" value={form.motherOccupation} onChange={e => set('motherOccupation', e.target.value)} placeholder="علي المعاش / ربة منزل / ..." className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">عدد الإخوة والأخوات</label>
              <input type="number" value={form.siblingsCount || ''} onChange={e => set('siblingsCount', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">مؤهلاتهم</label>
              <select value={form.siblingsEducation} onChange={e => set('siblingsEducation', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="عليا">عليا</option>
                <option value="متوسطة">متوسطة</option>
                <option value="مختلفة">مختلفة</option>
              </select>
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">بيانات السكن</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">محافظة المنشأ</label>
              <input type="text" value={form.originGovernorate} onChange={e => set('originGovernorate', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">محافظة الإقامة</label>
              <input type="text" value={form.residenceGovernorate} onChange={e => set('residenceGovernorate', e.target.value)} placeholder="الجيزه" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">المنطقة</label>
              <input type="text" value={form.area} onChange={e => set('area', e.target.value)} placeholder="فيصل" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">شكل المنطقة</label>
              <select value={form.areaType} onChange={e => set('areaType', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="وسط">وسط</option>
                <option value="هادئ">هادئ</option>
                <option value="شعبي">شعبي</option>
                <option value="راقي">راقي</option>
              </select>
            </div>
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">بيانات أخرى</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">المحافظة على الصلوات</label>
              <select value={form.prayerCommitment} onChange={e => set('prayerCommitment', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="منتظم">منتظم</option>
                <option value="أغلب الوقت">أغلب الوقت</option>
                <option value="أحياناً">أحياناً</option>
                <option value="بتحسن">بتحسن</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">نوع الحجاب</label>
              <select value={form.hijabType} onChange={e => set('hijabType', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">اختر</option>
                <option value="طرحة">طرحة</option>
                <option value="خمار">خمار</option>
                <option value="عباءة">عباءة</option>
                <option value="نقاب">نقاب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">هل يوجد استعداد للنقاب؟</label>
              <input type="text" value={form.acceptNiqab} onChange={e => set('acceptNiqab', e.target.value)} placeholder="لا / نعم" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">هل تقبلين السفر للخارج؟</label>
              <input type="text" value={form.acceptTravel} onChange={e => set('acceptTravel', e.target.value)} placeholder="مافيش مشكلة" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">من مرسل الاستمارة؟</label>
              <input type="text" value={form.formSubmitter} onChange={e => set('formSubmitter', e.target.value)} placeholder="العروسه / ولي الأمر" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">البيانات الخاصة بشريك الحياة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">السن من</label>
              <input type="number" value={form.preferredAgeMin || ''} onChange={e => set('preferredAgeMin', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">السن إلى</label>
              <input type="number" value={form.preferredAgeMax || ''} onChange={e => set('preferredAgeMax', parseInt(e.target.value) || 0)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">لون البشرة المناسب</label>
              <select value={form.preferredSkinColor} onChange={e => set('preferredSkinColor', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">بدون تفضيل</option>
                <option value="أبيض">أبيض</option>
                <option value="خمري">خمري</option>
                <option value="قمحي">قمحي</option>
                <option value="أسمر">أسمر</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">الحالة الاجتماعية المناسبة</label>
              <input type="text" value={form.preferredMaritalStatus} onChange={e => set('preferredMaritalStatus', e.target.value)} placeholder="مطلق / أرمل / متزوج" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">تقبلين مطلق/أرمل معه أطفال؟</label>
              <input type="text" value={form.acceptDivorcedWithChildren} onChange={e => set('acceptDivorcedWithChildren', e.target.value)} placeholder="نعم / لا" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">تقبلين مطلق أطفاله في حضانة الأم؟</label>
              <input type="text" value={form.acceptDivorcedChildrenCustody} onChange={e => set('acceptDivorcedChildrenCustody', e.target.value)} placeholder="نعم / لا" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">تقبلين من محافظة أخرى؟</label>
              <input type="text" value={form.acceptOtherGovernorate} onChange={e => set('acceptOtherGovernorate', e.target.value)} placeholder="الجيزة او القاهرة" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">المؤهل المطلوب</label>
              <select value={form.preferredEducation} onChange={e => set('preferredEducation', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100">
                <option value="">بدون تفضيل</option>
                <option value="عالي">عالي</option>
                <option value="فوق متوسط">فوق متوسط</option>
                <option value="متوسط">متوسط</option>
                <option value="لا يهم">لا يهم</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">المواصفات العامة المطلوبة</label>
              <textarea value={form.preferredGeneralSpecs} onChange={e => set('preferredGeneralSpecs', e.target.value)} rows={3} placeholder="منتظم في الصلاة - متسامح - لا يحب النكد - يتقي الله في زوجته - متفاهم واضح وصريح" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100 resize-none" />
            </div>
          </div>
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-gray-100 mb-4">إضافات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">تجهيز العريس للشقة والمهر؟</label>
              <input type="text" value={form.groomProvideApartment} onChange={e => set('groomProvideApartment', e.target.value)} placeholder="بالاتفاق" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">نشر الاستمارة فيسبوك وتلجرام؟</label>
              <input type="text" value={form.publishConsent} onChange={e => set('publishConsent', e.target.value)} placeholder="نعم / لا" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">هل سبق مراسلتنا؟</label>
              <input type="text" value={form.previousContact} onChange={e => set('previousContact', e.target.value)} placeholder="لا" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-1">إضافة أو ملحوظة</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1B4332] dark:text-gray-100 resize-none" placeholder="أي إضافة أو ملحوظة..." />
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1B4332] dark:text-gray-100 mb-6">
        {isEdit ? 'تعديل سجل عروس' : 'إضافة سجل عروس جديد'}
      </h1>

      {/* Step indicator */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              i === step
                ? 'bg-[#DAA520] text-[#1B4332] shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Form section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {renderStep()}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate('/guardian/brides')}
            className="px-6 py-2.5 text-sm font-medium text-[#6B7280] dark:text-gray-300 hover:text-[#1B4332] dark:hover:text-gray-100 transition-colors"
          >
            {step > 0 ? 'السابق' : 'رجوع'}
          </button>
          {step < SECTIONS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8] transition-colors"
            >
              التالي
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.age || !form.maritalStatus}
              className="px-8 py-2.5 bg-[#1B4332] dark:bg-[#DAA520] text-white dark:text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#2D6A4F] dark:hover:bg-[#F5E6B8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'جاري الحفظ...' : (isEdit ? 'تحديث' : 'حفظ السجل')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
