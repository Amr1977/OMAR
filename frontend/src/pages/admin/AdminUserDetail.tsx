import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const res: any = await api.admin.users(`search=${id}`);
        const found = (res.users || []).find((u: any) => u.id === id);
        if (found) {
          setUser(found);
          setForm({
            email: found.email || '',
            phone: found.phone || '',
            isVerified: found.isVerified || false,
            isActive: found.isActive ?? true,
            subscriptionPlan: found.subscriptionPlan || 'FREE',
            roles: found.roles || ['SOCIAL'],
            displayName: found.profile?.displayName || '',
            bio: found.bio || '',
            tagline: found.tagline || '',
            websiteUrl: found.websiteUrl || '',
          });
        }
      } catch (err) {
        console.error(err);
        setToast({ type: 'error', message: 'Failed to load user' });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.updateUser(id!, {
        email: form.email || null,
        phone: form.phone || null,
        roles: form.roles,
        subscriptionPlan: form.subscriptionPlan,
        isVerified: form.isVerified,
        isActive: form.isActive,
        profile: {
          displayName: form.displayName,
          bio: form.bio,
          tagline: form.tagline,
          websiteUrl: form.websiteUrl,
        },
      });
      setUser(updated);
      showToast('success', 'User updated successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async () => {
    const newRoles = form.roles.includes('ADMIN')
      ? form.roles.filter((r: string) => r !== 'ADMIN')
      : [...form.roles, 'ADMIN'];
    setForm({ ...form, roles: newRoles });
    setSaving(true);
    try {
      await api.admin.updateUser(id!, { roles: newRoles });
      showToast('success', newRoles.includes('ADMIN') ? 'Admin role granted' : 'Admin role removed');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update role');
      setForm({ ...form, roles: form.roles });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.admin.deleteUser(id!);
      showToast('success', 'User deleted');
      setTimeout(() => navigate('/admin/users'), 500);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete user');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const roleLabels: Record<string, string> = {
    GROOM: 'Groom',
    GUARDIAN: 'Guardian',
    SOCIAL: 'Social',
    ADMIN: 'Admin',
  };

  const roleColors: Record<string, string> = {
    GROOM: 'bg-blue-100 text-blue-700',
    GUARDIAN: 'bg-green-100 text-green-700',
    SOCIAL: 'bg-gray-100 text-gray-700',
    ADMIN: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/admin/users')} className="text-[#1B4332] hover:underline mb-4">&larr; Back to users</button>
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <button onClick={() => navigate('/admin/users')} className="text-[#1B4332] hover:underline mb-6 inline-block">&larr; {t('common.back')}</button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-xl font-bold">
          {(form.displayName || user.email || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">{form.displayName || 'Unnamed User'}</h1>
          <p className="text-gray-500 text-sm">{user.email || user.phone || user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-4">
          <p className="text-xs text-gray-500 uppercase">{t('admin.users.role')}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(form.roles || []).map((r: string) => (
              <span key={r} className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[r] || 'bg-gray-100 text-gray-700'}`}>
                {roleLabels[r] || r}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-4">
          <p className="text-xs text-gray-500 uppercase">{t('admin.users.subscription')}</p>
          <p className="text-sm font-medium mt-1">{form.subscriptionPlan}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-4">
          <p className="text-xs text-gray-500 uppercase">Verified</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${form.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {form.isVerified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-4">
          <p className="text-xs text-gray-500 uppercase">Status</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {form.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#1B4332] mb-4">Edit User</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={form.displayName || ''}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
            <input
              type="text"
              value={form.tagline || ''}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio || ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input
              type="text"
              value={form.websiteUrl || ''}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
            <select
              value={form.subscriptionPlan}
              onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            >
              <option value="FREE">FREE</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {['GROOM', 'GUARDIAN', 'SOCIAL', 'ADMIN'].map((role) => (
                <label key={role} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.roles?.includes(role)}
                    onChange={() => {
                      const newRoles = form.roles.includes(role)
                        ? form.roles.filter((r: string) => r !== role)
                        : [...form.roles, role];
                      setForm({ ...form, roles: newRoles });
                    }}
                    className="rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                  />
                  {roleLabels[role] || role}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                className="rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
              />
              <span className="text-sm">{form.isVerified ? 'Verified' : 'Not verified'}</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
              />
              <span className="text-sm">{form.isActive ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2d6a4f] disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Saving...' : t('common.save')}
          </button>
          <button
            onClick={handleToggleAdmin}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              form.roles?.includes('ADMIN')
                ? 'border-red-300 text-red-700 hover:bg-red-50'
                : 'border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332]/5'
            }`}
          >
            {form.roles?.includes('ADMIN') ? 'Remove Admin' : 'Make Admin'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 ml-auto"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                {saving ? 'Deleting...' : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
