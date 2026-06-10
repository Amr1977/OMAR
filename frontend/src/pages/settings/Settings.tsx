import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { changeLanguage } from '../../i18n';
import { api, photoUrl } from '../../lib/api';

type Section = 'language' | 'subscription' | 'modules' | 'profile' | null;

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<Section>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.profile.getMy()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const startEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValue(currentValue ?? '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field: string) => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await api.profile.update(profile.id, { [field]: editValue });
      setProfile(updated);
      setEditingField(null);
      showMsg('success', 'تم الحفظ');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 5 * 1024 * 1024) {
      showMsg('error', 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await api.profile.uploadPhoto(profile.id, fd);
      const updated = await api.profile.getMy();
      setProfile(updated);
      showMsg('success', 'تم رفع الصورة');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل رفع الصورة');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!profile) return;
    try {
      await api.profile.deletePhoto(profile.id, photoId);
      const updated = await api.profile.getMy();
      setProfile(updated);
      showMsg('success', 'تم حذف الصورة');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل حذف الصورة');
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!profile) return;
    try {
      await api.profile.setPrimaryPhoto(profile.id, photoId);
      const updated = await api.profile.getMy();
      setProfile(updated);
      showMsg('success', 'تم تعيين الصورة الرئيسية');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل تعيين الصورة');
    }
  };

  const toggleVisibility = async (visible: boolean) => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await api.profile.toggleVisibility(profile.id, visible);
      setProfile(updated);
      showMsg('success', visible ? 'تم إظهار الملف الشخصي' : 'تم إخفاء الملف الشخصي');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل تغيير الحالة');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showMsg('error', 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { avatarUrl } = await api.auth.uploadAvatar(fd);
      const store = useAuthStore.getState();
      store.setUser({ ...store.user!, avatarUrl, profilePhoto: avatarUrl || store.user!.profilePhoto });
      showMsg('success', 'تم تحديث الصورة الشخصية');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل رفع الصورة');
    } finally {
      setUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    setDeletingAvatar(true);
    try {
      await api.auth.deleteAvatar();
      const store = useAuthStore.getState();
      store.setUser({ ...store.user!, avatarUrl: null, profilePhoto: store.user!.profilePhoto });
      showMsg('success', 'تم حذف الصورة الشخصية');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل حذف الصورة');
    } finally {
      setDeletingAvatar(false);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;
    setDeleting(true);
    try {
      await api.profile.delete(profile.id);
      setProfile(null);
      setDeleteConfirm(false);
      showMsg('success', 'تم حذف الملف الشخصي');
    } catch (err: any) {
      showMsg('error', err.message || 'فشل الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const isVisible = profile?.status === 'APPROVED';

  const fieldLabels: Record<string, string> = {
    displayName: t('profile.displayName'),
    age: t('profile.age'),
    nationality: t('profile.nationality'),
    countryOfResidence: t('profile.country'),
    city: t('profile.city'),
    education: t('profile.education'),
    occupation: t('profile.occupation'),
    selfIntroduction: t('profile.selfIntroduction'),
    weight: t('profile.weight'),
    height: t('profile.height'),
    skinColor: t('profile.skinColor'),
    beard: t('profile.beard'),
    sports: t('profile.sports'),
    healthIssues: t('profile.healthIssues'),
    smoking: t('profile.smoking'),
    educationLevel: t('profile.educationLevel'),
    workType: t('profile.workType'),
    incomeLevel: t('profile.incomeLevel'),
    originGovernorate: t('profile.originGovernorate'),
    residenceGovernorate: t('profile.residenceGovernorate'),
    areaType: t('profile.areaType'),
    marriedResidence: t('profile.marriedResidence'),
    housingType: t('profile.housingType'),
    housingPrivacy: t('profile.housingPrivacy'),
    fatherOccupation: t('profile.fatherOccupation'),
    motherOccupation: t('profile.motherOccupation'),
    siblingsCount: t('profile.siblingsCount'),
    siblingsEducation: t('profile.siblingsEducation'),
    hasChildren: t('profile.hasChildren'),
    numberOfChildren: t('profile.numberOfChildren'),
    childrenDetails: t('profile.childrenDetails'),
    childrenCustody: t('profile.childrenCustody'),
    lastDivorceDate: t('profile.lastDivorceDate'),
    wantsPolygamy: t('profile.wantsPolygamy'),
    wantsChildren: t('profile.wantsChildren'),
    wifePreferredSkinColor: t('profile.wifePreferredSkinColor'),
    wifePreferredHijab: t('profile.wifePreferredHijab'),
    wifePreferredWork: t('profile.wifePreferredWork'),
    wifeAcceptDivorcedWithChildren: t('profile.wifeAcceptDivorcedWithChildren'),
    wifeAcceptDivorcedChildrenCustody: t('profile.wifeAcceptDivorcedChildrenCustody'),
    wifeAcceptOtherCity: t('profile.wifeAcceptOtherCity'),
    wifeFurnishApartment: t('profile.wifeFurnishApartment'),
    maritalStatus: t('profile.sections.maritalStatus_label'),
    marriageNumber: t('profile.marriageNumber_label'),
    dateOfBirth: t('profile.dateOfBirth'),
    madhab: t('profile.madhab_label'),
  };

  const toggleSection = (s: Section) => {
    setOpenSection(openSection === s ? null : s);
    setEditingField(null);
  };

  const renderField = (field: string, value: any, type: 'text' | 'textarea' = 'text') => {
    const isEditing = editingField === field;
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
        <div className="flex-1 min-w-0 ml-4">
          <p className="text-xs text-[var(--color-muted)] mb-0.5">{fieldLabels[field] || field}</p>
          {isEditing ? (
            <div className="flex gap-2">
              {type === 'textarea' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-[var(--color-primary)] rounded-lg focus:outline-none resize-none"
                  rows={3}
                />
              ) : (
                <input
                  type={field === 'age' ? 'number' : 'text'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-[var(--color-primary)] rounded-lg focus:outline-none"
                />
              )}
              <button
                onClick={() => saveField(field)}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? '...' : t('common.save')}
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <p className="font-medium text-[var(--color-text)] text-sm truncate">{value || '—'}</p>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => startEdit(field, value)}
            className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors flex-shrink-0"
            title="تعديل"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{t('settings.title')}</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">

        {/* Account Avatar */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
                  {user?.avatarUrl ? (
                    <img src={photoUrl(user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                  ) : user?.profilePhoto ? (
                    <img src={photoUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)] text-sm">{'الصورة الشخصية للحساب'}</p>
                  <p className="text-xs text-[var(--color-muted)]">{'تظهر في المنشورات والتعليقات'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs cursor-pointer hover:opacity-90 transition-opacity">
                  {uploadingAvatar ? '...' : 'تغيير'}
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadAvatar}
                    disabled={uploadingAvatar}
                  />
                </label>
                {user?.avatarUrl && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={deletingAvatar}
                    className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingAvatar ? '...' : 'حذف'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <button
            onClick={() => toggleSection('language')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-black/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-pale)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)] text-sm">{t('settings.language')}</p>
                <p className="text-xs text-[var(--color-muted)]">{i18n.language === 'ar' ? 'العربية' : i18n.language === 'en' ? 'English' : i18n.language === 'ur' ? 'اردو' : 'Français'}</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-[var(--color-muted)] transition-transform ${openSection === 'language' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSection === 'language' && (
            <div className="px-4 pb-4">
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="ur">اردو</option>
                <option value="fr">Français</option>
              </select>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <button
            onClick={() => toggleSection('subscription')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-black/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-pale)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)] text-sm">{t('settings.subscription')}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {t('settings.currentPlan')}: {user?.subscriptionPlan === 'PREMIUM' ? t('settings.premium') : t('settings.free')}
                </p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-[var(--color-muted)] transition-transform ${openSection === 'subscription' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSection === 'subscription' && (
            <div className="px-4 pb-4">
              <Link
                to="/settings/subscription"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                {t('settings.upgrade')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Modules */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <button
            onClick={() => toggleSection('modules')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-black/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-pale)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)] text-sm">الخدمات المفعلة</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {(!user?.roles || user.roles.length <= 1) && 'التواصل الاجتماعي فقط'}
                  {user?.roles?.includes('GROOM') && 'راغب في الزواج '}
                  {user?.roles?.includes('GUARDIAN') && 'ولي أمر '}
                  {user?.roles?.includes('ADMIN') && 'مشرف '}
                </p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-[var(--color-muted)] transition-transform ${openSection === 'modules' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSection === 'modules' && (
            <div className="px-4 pb-4">
              <p className="text-xs text-[var(--color-muted)] mb-3">اختر الخدمات الإضافية التي تريد تفعيلها. يمكنك تغيير هذه الإعدادات في أي وقت.</p>
              <div className="space-y-2">
                <ModuleToggle
                  label="راغب في الزواج"
                  desc="إنشاء ملف تعارف والتواصل مع العائلات"
                  checked={user?.roles?.includes('GROOM') ?? false}
                  onChange={async (val) => {
                    const roles = [...(user?.roles || [])].filter(r => r !== 'ADMIN');
                    if (val) {
                      if (!roles.includes('GROOM')) roles.push('GROOM');
                    } else {
                      const idx = roles.indexOf('GROOM');
                      if (idx >= 0) roles.splice(idx, 1);
                    }
                    const { user: updated } = await api.auth.updateRoles(roles);
                    const store = useAuthStore.getState();
                    store.setUser({ ...store.user!, roles: updated.roles });
                  }}
                />
                <ModuleToggle
                  label="ولي أمر"
                  desc="البحث عن عريس وإدارة ملفات العرائس"
                  checked={user?.roles?.includes('GUARDIAN') ?? false}
                  onChange={async (val) => {
                    const roles = [...(user?.roles || [])].filter(r => r !== 'ADMIN');
                    if (val) {
                      if (!roles.includes('GUARDIAN')) roles.push('GUARDIAN');
                    } else {
                      const idx = roles.indexOf('GUARDIAN');
                      if (idx >= 0) roles.splice(idx, 1);
                    }
                    const { user: updated } = await api.auth.updateRoles(roles);
                    const store = useAuthStore.getState();
                    store.setUser({ ...store.user!, roles: updated.roles });
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Profile Settings */}
        {profile && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            <button
              onClick={() => toggleSection('profile')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-pale)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)] text-sm">{t('profile.my')}</p>
                  <p className="text-xs text-[var(--color-muted)]">{profile.displayName}</p>
                </div>
              </div>
              <svg className={`w-5 h-5 text-[var(--color-muted)] transition-transform ${openSection === 'profile' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSection === 'profile' && (
              <div className="px-4 pb-4 space-y-4">
                {/* Basic Info */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.basicInfo')}</p>
                  {renderField('displayName', profile.displayName)}
                  {renderField('age', profile.age)}
                  {renderField('dateOfBirth', profile.dateOfBirth)}
                  {renderField('nationality', profile.nationality)}
                  {renderField('countryOfResidence', profile.countryOfResidence)}
                  {renderField('city', profile.city)}
                  {renderField('madhab', profile.madhab)}
                </div>

                {/* Personal Info */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.sections.personalInfo')}</p>
                  {renderField('weight', profile.weight)}
                  {renderField('height', profile.height)}
                  {renderField('skinColor', profile.skinColor)}
                  {renderField('beard', profile.beard)}
                  {renderField('sports', profile.sports)}
                  {renderField('healthIssues', profile.healthIssues)}
                  {renderField('smoking', profile.smoking)}
                </div>

                {/* Education & Work */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.sections.educationWork')}</p>
                  {renderField('education', profile.education)}
                  {renderField('educationLevel', profile.educationLevel)}
                  {renderField('occupation', profile.occupation)}
                  {renderField('workType', profile.workType)}
                  {renderField('incomeLevel', profile.incomeLevel)}
                </div>

                {/* Marital Status */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.sections.maritalInfo')}</p>
                  {renderField('maritalStatus', profile.maritalStatus)}
                  {renderField('marriageNumber', profile.marriageNumber)}
                  {renderField('lastDivorceDate', profile.lastDivorceDate)}
                  {renderField('hasChildren', profile.hasChildren)}
                  {renderField('numberOfChildren', profile.numberOfChildren)}
                  {renderField('childrenDetails', profile.childrenDetails)}
                  {renderField('childrenCustody', profile.childrenCustody)}
                  {renderField('wantsPolygamy', profile.wantsPolygamy)}
                  {renderField('wantsChildren', profile.wantsChildren)}
                </div>

                {/* Family */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.sections.familyInfo')}</p>
                  {renderField('fatherOccupation', profile.fatherOccupation)}
                  {renderField('motherOccupation', profile.motherOccupation)}
                  {renderField('siblingsCount', profile.siblingsCount)}
                  {renderField('siblingsEducation', profile.siblingsEducation)}
                </div>

                {/* Residence */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.sections.residenceInfo')}</p>
                  {renderField('originGovernorate', profile.originGovernorate)}
                  {renderField('residenceGovernorate', profile.residenceGovernorate)}
                  {renderField('areaType', profile.areaType)}
                  {renderField('marriedResidence', profile.marriedResidence)}
                  {renderField('housingType', profile.housingType)}
                  {renderField('housingPrivacy', profile.housingPrivacy)}
                </div>

                {/* Partner Preferences */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.sections.preferences')}</p>
                  {renderField('wifePreferredSkinColor', profile.wifePreferredSkinColor)}
                  {renderField('wifePreferredHijab', profile.wifePreferredHijab)}
                  {renderField('wifePreferredWork', profile.wifePreferredWork)}
                  {renderField('wifeAcceptDivorcedWithChildren', profile.wifeAcceptDivorcedWithChildren)}
                  {renderField('wifeAcceptDivorcedChildrenCustody', profile.wifeAcceptDivorcedChildrenCustody)}
                  {renderField('wifeAcceptOtherCity', profile.wifeAcceptOtherCity)}
                  {renderField('wifeFurnishApartment', profile.wifeFurnishApartment)}
                </div>

                {/* Self Introduction */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2 font-semibold">{t('profile.sections.aboutMe')}</p>
                  {renderField('selfIntroduction', profile.selfIntroduction, 'textarea')}
                </div>

                {/* Photos */}
                <div className="bg-[var(--color-bg)] rounded-lg p-3">
                  <p className="text-xs text-[var(--color-muted)] mb-2">{'الصور الشخصية'}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(profile.photos || []).map((photo: any) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-border)] group">
                        <img src={photoUrl(photo.url)} alt="" className="w-full h-full object-cover" />
                        {photo.isPrimary && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[var(--color-primary)] text-white text-[10px] rounded font-bold">{'أساسي'}</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {!photo.isPrimary && (
                            <button
                              onClick={() => handleSetPrimary(photo.id)}
                              className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                              title="تعيين كأساسي"
                            >
                              <svg className="w-3.5 h-3.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="حذف"
                          >
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {(profile.photos || []).length < 6 && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)] flex items-center justify-center cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                        {uploadingPhoto ? (
                          <svg className="w-6 h-6 text-[var(--color-muted)] animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadPhoto}
                          disabled={uploadingPhoto}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{(profile.photos || []).length} / 6</p>
                </div>

                {/* Full profile link */}
                <Link
                  to="/profile/my"
                  className="flex items-center justify-between w-full px-4 py-3 bg-[var(--color-bg)] rounded-lg text-sm hover:bg-black/[0.02] transition-colors"
                >
                  <span className="font-medium text-[var(--color-text)]">{t('settings.viewFullProfile') || 'عرض الملف كاملاً'}</span>
                  <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* Visibility toggle */}
                <div className="flex items-center justify-between bg-[var(--color-bg)] rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{t('settings.profileVisibility') || 'ظهور الملف الشخصي'}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      {isVisible
                        ? (t('settings.visible') || 'ملفك مرئي للآخرين')
                        : (t('settings.hidden') || 'ملفك مخفي عن الآخرين')}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleVisibility(!isVisible)}
                    disabled={saving}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isVisible ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                    } ${saving ? 'opacity-50' : ''}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isVisible ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>

                {/* Status badge */}
                <div className="bg-[var(--color-bg)] rounded-lg px-4 py-3">
                  <p className="text-sm text-[var(--color-muted)]">
                    {t('settings.status') || 'الحالة'}:{' '}
                    <span className={`font-medium ${
                      profile.status === 'APPROVED' ? 'text-green-600' :
                      profile.status === 'DRAFT' ? 'text-yellow-600' :
                      profile.status === 'REJECTED' ? 'text-red-600' : ''
                    }`}>
                      {t(`profile.status.${profile.status}`)}
                    </span>
                  </p>
                </div>

                {/* Delete profile */}
                <div className="pt-2 border-t border-[var(--color-border)]">
                  {deleteConfirm ? (
                    <div className="bg-red-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-red-700 font-medium">
                        {t('settings.deleteConfirm') || 'هل أنت متأكد من حذف الملف الشخصي؟ لا يمكن التراجع عن هذا الإجراء.'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting ? '...' : t('common.confirm')}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-gray-50"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('common.delete') + ' ' + (t('profile.my') || 'الملف الشخصي')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No profile state */}
        {!loading && !profile && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 text-center">
            <p className="text-[var(--color-muted)] mb-4">{t('settings.noProfile') || 'ليس لديك ملف شخصي بعد'}</p>
            <button
              onClick={() => navigate('/profile/setup')}
              className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:opacity-90"
            >
              {t('profile.create')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function ModuleToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (val: boolean) => void }) {
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    setSaving(true);
    try {
      await onChange(!checked);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <button type="button" onClick={handleChange} disabled={saving}
      className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-right transition-all duration-200 ${
        checked
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-pale)]'
          : 'border-[var(--color-border)] hover:border-[#9CA3AF]'
      } ${saving ? 'opacity-50' : ''}`}>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
        checked
          ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
          : 'border-[#9CA3AF]'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
        <p className="text-xs text-[var(--color-muted)]">{desc}</p>
      </div>
    </button>
  );
}
