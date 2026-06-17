import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import UserAvatar from '../../components/UserAvatar';

export default function PeopleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.social.getSuggested().then((data: any[]) => setSuggested(data || [])).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const data = await api.social.searchUsers(query.trim());
      setResults(data || []);
    } finally { setSearching(false); }
  };

  const handleFollow = async (userId: string) => {
    try {
      await api.social.toggleFollow(userId);
      setFollowing(prev => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId); else next.add(userId);
        return next;
      });
    } catch {}
  };

  const UserCard = ({ profile }: { profile: any }) => (
    <div className="flex items-center justify-between p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
      <Link to={`/social/user/${profile.userId || profile.user?.id}`} className="flex items-center gap-3">
        <UserAvatar photo={profile.photos?.[0]?.url} size="md" roles={profile.user?.roles} subscriptionPlan={profile.user?.subscriptionPlan} />
        <div>
          <p className="text-sm font-medium text-[var(--color-primary)]">{profile.displayName}</p>
          {profile.city && <p className="text-xs text-[var(--color-muted)]">{profile.city}</p>}
        </div>
      </Link>
      <button
        onClick={() => handleFollow(profile.userId || profile.user?.id)}
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
          (profile.isFollowing || following.has(profile.userId || profile.user?.id))
            ? 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text)]'
            : 'bg-[#DAA520] text-[#1B4332]'
        }`}
      >
        {(profile.isFollowing || following.has(profile.userId || profile.user?.id)) ? 'متابَع' : 'متابعة'}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">اكتشف أشخاصاً</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="ابحث بالاسم..."
          className="flex-1 p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
        />
        <button onClick={handleSearch} disabled={searching || query.trim().length < 2} className="px-5 py-3 bg-[#DAA520] text-[#1B4332] rounded-xl text-sm font-bold hover:bg-[#F5E6B8] disabled:opacity-50">
          {searching ? '...' : 'بحث'}
        </button>
      </div>

      {results.length > 0 ? (
        <div className="space-y-3 mb-8">
          {results.map((profile: any) => <UserCard key={profile.id} profile={profile} />)}
        </div>
      ) : (
        suggested.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-3">مقترحون لك</h2>
            <div className="space-y-3">
              {suggested.map((profile: any) => <UserCard key={profile.id} profile={profile} />)}
            </div>
          </div>
        )
      )}
    </div>
  );
}
