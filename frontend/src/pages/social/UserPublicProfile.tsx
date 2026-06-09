import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import UserAvatar from '../../components/UserAvatar';

export default function UserPublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (userId === me?.id) navigate('/profile/my', { replace: true });
  }, [userId, me]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.social.getUserProfile(userId)
      .then(data => {
        setProfile(data);
        setFollowing(data.isFollowing);
        setBlocked(data.isBlocked);
      })
      .catch(() => navigate('/social'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setPostsLoading(true);
    api.social.getUserPosts(userId)
      .then(data => setPosts(data.posts || []))
      .finally(() => setPostsLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    await api.social.toggleFollow(userId!);
    setFollowing(f => !f);
    setProfile((p: any) => ({
      ...p,
      _count: { ...p._count, followers: p._count.followers + (following ? -1 : 1) }
    }));
  };

  const handleBlock = async () => {
    await api.social.toggleBlock(userId!);
    setBlocked(b => !b);
    setMenuOpen(false);
  };

  if (loading) return <div className="text-center py-16 text-[var(--color-muted)]">جاري التحميل...</div>;
  if (!profile) return null;

  const displayName = profile.profile?.displayName || 'مستخدم';
  const photo = profile.profile?.photos?.[0]?.url;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar photo={photo} size="lg" roles={profile.roles} subscriptionPlan={profile.subscriptionPlan} />
              {profile.isOnline && (
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--color-primary)]">{displayName}</h1>
                {profile.isVerified && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                )}
              </div>
              {profile.tagline && <p className="text-sm text-[var(--color-muted)]">{profile.tagline}</p>}
              {profile.profile?.city && (
                <p className="text-xs text-[var(--color-muted)] mt-1">{profile.profile.city}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!blocked && (
              <button
                onClick={handleFollow}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  following
                    ? 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text)] hover:bg-red-50 hover:text-red-500'
                    : 'bg-[#DAA520] text-[#1B4332] hover:bg-[#F5E6B8]'
                }`}
              >
                {following ? 'إلغاء المتابعة' : 'متابعة'}
              </button>
            )}
            <div className="relative">
              <button onClick={() => setMenuOpen(m => !m)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-10 min-w-[140px]" dir="rtl">
                  <button
                    onClick={handleBlock}
                    className="w-full text-right px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    {blocked ? 'إلغاء الحظر' : 'حظر المستخدم'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-[var(--color-text)] leading-relaxed">{profile.bio}</p>
        )}
        {profile.websiteUrl && (
          <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-blue-500 hover:underline block">
            {profile.websiteUrl.replace(/^https?:\/\//, '')}
          </a>
        )}

        <div className="flex gap-8 mt-5 pt-5 border-t border-[var(--color-border)]">
          <div className="text-center">
            <p className="text-xl font-bold text-[var(--color-primary)]">{profile._count?.posts || 0}</p>
            <p className="text-xs text-[var(--color-muted)]">منشور</p>
          </div>
          <Link to={`/social/user/${userId}/followers`} className="text-center hover:opacity-80">
            <p className="text-xl font-bold text-[var(--color-primary)]">{profile._count?.followers || 0}</p>
            <p className="text-xs text-[var(--color-muted)]">متابع</p>
          </Link>
          <Link to={`/social/user/${userId}/following`} className="text-center hover:opacity-80">
            <p className="text-xl font-bold text-[var(--color-primary)]">{profile._count?.following || 0}</p>
            <p className="text-xs text-[var(--color-muted)]">يتابع</p>
          </Link>
        </div>
      </div>

      {postsLoading ? (
        <div className="text-center py-8 text-[var(--color-muted)]">جاري التحميل...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)]">لا توجد منشورات بعد</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Link key={post.id} to={`/social/post/${post.id}`} className="block bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/30 transition-colors">
              <p className="text-sm text-[var(--color-text)] line-clamp-3">{post.content}</p>
              {post.mediaUrls?.length > 0 && (
                <img src={post.mediaUrls[0]} alt="" className="mt-2 w-full h-40 object-cover rounded-lg" />
              )}
              <div className="flex gap-4 mt-3 text-xs text-[var(--color-muted)]">
                <span>❤️ {post._count?.likes || 0}</span>
                <span>💬 {post._count?.comments || 0}</span>
                <span className="mr-auto">{new Date(post.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
