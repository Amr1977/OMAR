import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface Props {
  brideId: string;
  onClose: () => void;
}

export default function ExposureManager({ brideId, onClose }: Props) {
  const [exposures, setExposures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const loadExposures = async () => {
    setLoading(true);
    try {
      const data = await api.brides.getExposures(brideId);
      setExposures(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExposures(); }, [brideId]);

  const searchGrooms = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await api.browse.grooms({ search: searchQuery });
      setSearchResults(data.profiles || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleExpose = async (groomUserId: string) => {
    setError('');
    try {
      await api.brides.expose(brideId, groomUserId);
      setSearchResults([]);
      setSearchQuery('');
      loadExposures();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRemove = async (groomId: string) => {
    try {
      await api.brides.removeExposure(brideId, groomId);
      loadExposures();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const isAlreadyExposed = (groomUserId: string) =>
    exposures.some(ex => ex.groomId === groomUserId && ex.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1B4332] dark:text-gray-100">إتاحة السجل لعريس</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#6B7280]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#6B7280] dark:text-gray-400 mb-2">ابحث عن عريس بالاسم أو المحافظة</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchGrooms()}
              placeholder="اسم العريس أو المحافظة..."
              className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-[#1B4332] dark:text-gray-100"
            />
            <button
              onClick={searchGrooms}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 bg-[#DAA520] text-[#1B4332] rounded-lg text-sm font-bold hover:bg-[#F5E6B8] disabled:opacity-50 transition-colors"
            >
              {searching ? '...' : 'بحث'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {searchResults.map((profile: any) => (
                <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30">
                  <div>
                    <p className="text-sm font-medium text-[#1B4332] dark:text-gray-200">{profile.displayName}</p>
                    <p className="text-xs text-[#6B7280]">
                      {profile.age} سنة · {profile.city || profile.residenceGovernorate || '-'}
                    </p>
                  </div>
                  {isAlreadyExposed(profile.user.id) ? (
                    <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">مُتاح مسبقاً</span>
                  ) : (
                    <button
                      onClick={() => handleExpose(profile.user.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#DAA520] text-[#1B4332] rounded-lg hover:bg-[#F5E6B8] transition-colors"
                    >
                      إتاحة
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="text-sm font-bold text-[#1B4332] dark:text-gray-100 mb-3">
          العرسان الممنوحة لهم الإتاحة ({exposures.filter((e: any) => e.isActive).length})
        </h3>

        {loading ? (
          <div className="text-center py-6 text-[#6B7280] text-sm">جاري التحميل...</div>
        ) : exposures.filter((e: any) => e.isActive).length === 0 ? (
          <div className="text-center py-6 text-[#6B7280] text-sm">لم يتم إتاحة هذا السجل لأي عريس بعد</div>
        ) : (
          <div className="space-y-2">
            {exposures.filter((e: any) => e.isActive).map((ex: any) => (
              <div key={ex.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-[#1B4332] dark:text-gray-200">
                    {ex.groom?.profile?.displayName || `عريس #${ex.groomId.slice(-5)}`}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(ex.exposedAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(ex.groomId)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors"
                >
                  إيقاف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
