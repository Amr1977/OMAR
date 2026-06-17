import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, photoUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import UserAvatar from '../../components/UserAvatar';
import PostCard from '../../components/PostCard';
import PostCardSkeleton from '../../components/PostCardSkeleton';

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
        if (!data || data.isBlocked) {
          setProfile(null);
          navigate('/social');
          return;
        }
        setProfile(data);
        setFollowing(data.isFollowing);
        setBlocked(data.isBlocked);
      })
      .catch(() => navigate('/social'))
      .finally(() => setLoading(false));
  }, [userId]);

  const loadPosts = () => {
    if (!userId) return;
    setPostsLoading(true);
    api.social.getUserPosts(userId)
      .then(data => setPosts(data.posts || []))
      .finally(() => setPostsLoading(false));
  };

  useEffect(() => { loadPosts(); }, [userId]);

  const handleFollow = async () => {
    try {
      await api.social.toggleFollow(userId!);
      setFollowing(f => !f);
      setProfile((p: any) => ({
        ...p,
        _count: { ...p._count, followers: p._count.followers + (following ? -1 : 1) }
      }));
    } catch {}
  };

  const handleBlock = async () => {
    try {
      await api.social.toggleBlock(userId!);
      setBlocked(b => !b);
      setMenuOpen(false);
    } catch {}
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = !!(post.likes?.[0]);
    await api.social.toggleLike(postId);
    setPosts(prev => prev.map(p =>
      p.id === postId ? {
        ...p,
        likes: isLiked ? [] : [{ userId: me?.id }],
        _count: { ...p._count, likes: isLiked ? p._count.likes - 1 : p._count.likes + 1 },
      } : p
    ));
  };

  const handleSave = async (postId: string) => {
    const res = await api.social.toggleSave(postId);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, saves: res.saved ? [{ userId: me?.id }] : [] } : p
    ));
  };

  const handleShare = async (postId: string, content?: string) => {
    await api.social.sharePost(postId, content);
    loadPosts();
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    await api.social.deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePin = async (postId: string) => {
    await api.social.togglePin(postId);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, isPinned: !p.isPinned } : p
    ));
  };

  const handleReport = async (postId: string) => {
    const reason = window.prompt('سبب الإبلاغ:');
    if (!reason) return;
    await api.social.reportPost(postId, reason);
    alert('تم إرسال الإبلاغ، شكراً لك');
  };

  const handleCopyLink = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/social/post/${postId}`);
  };

  if (loading) return <div className="text-center py-16 text-[var(--color-muted)]">جاري التحميل...</div>;
  if (!profile) return null;

  const displayName = profile.profile?.displayName || 'مستخدم';
  const photo = profile.profile?.photos?.[0]?.url;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile card */}
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

      {/* Posts */}
      {postsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)]">لا توجد منشورات بعد</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={me?.id}
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              onDelete={handleDelete}
              onPin={handlePin}
              onReport={handleReport}
              onCopyLink={handleCopyLink}
            />
          ))}
        </div>
      )}
    </div>
  );
}
