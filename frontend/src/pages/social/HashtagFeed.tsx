import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, photoUrl, isVideoUrl, isAudioUrl } from '../../lib/api';
import UserAvatar from '../../components/UserAvatar';

export default function HashtagFeed() {
  const { tag } = useParams<{ tag: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    api.social.getHashtagFeed(tag).then(setData).finally(() => setLoading(false));
  }, [tag]);

  if (loading) return <div className="text-center py-8 text-[var(--color-muted)]">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">#{tag}</h1>
        {data && <p className="text-sm text-[var(--color-muted)] mt-1">{data.hashtag?.postCount ?? 0} منشور</p>}
      </div>
      <div className="space-y-4">
        {(data?.posts || []).map((post: any) => (
          <Link key={post.id} to={`/social/post/${post.id}`} className="block bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserAvatar photo={post.user?.avatarUrl || post.user?.profile?.photos?.[0]?.url} size="sm" roles={post.user?.roles} subscriptionPlan={post.user?.subscriptionPlan} />
              <span className="text-sm font-medium text-[var(--color-primary)]">{post.user?.profile?.displayName || 'مستخدم'}</span>
            </div>
            <p className="text-sm text-[var(--color-text)] line-clamp-3">{post.content}</p>
            {post.mediaUrls?.length > 0 && (
              isVideoUrl(post.mediaUrls[0]) ? (
                <video src={photoUrl(post.mediaUrls[0])} controls className="mt-2 w-full h-40 object-cover rounded-lg" />
              ) : isAudioUrl(post.mediaUrls[0]) ? (
                <audio src={photoUrl(post.mediaUrls[0])} controls className="w-full mt-2" />
              ) : (
                <img src={photoUrl(post.mediaUrls[0])} alt="" className="mt-2 w-full h-40 object-cover rounded-lg" />
              )
            )}
          </Link>
        ))}
        {data?.posts?.length === 0 && <div className="text-center py-16 text-[var(--color-muted)]">لا توجد منشورات بهذا الوسم</div>}
      </div>
    </div>
  );
}
