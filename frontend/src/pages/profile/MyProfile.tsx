import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, photoUrl, isVideoUrl, isAudioUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import ImageViewer from '../../components/ImageViewer';
import UserAvatar from '../../components/UserAvatar';

const SECTION_ICONS: Record<string, string> = {
  family: '👨‍👩‍👧‍👦',
  residence: '🏠',
  maritalInfo: '💍',
};

export default function MyProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewerImg, setViewerImg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState('');
  const [sharingSubmitting, setSharingSubmitting] = useState(false);

  useEffect(() => {
    api.profile.getMy()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setPostsLoading(true);
    api.social.getUserPosts(user.id, `page=${page}&limit=20`)
      .then((res: any) => {
        setPosts(res.posts || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [user?.id, page]);

  const handleLike = async (postId: string) => {
    await api.social.toggleLike(postId);
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      liked: !p.liked,
      _count: { ...p._count, likes: p.liked ? p._count.likes - 1 : p._count.likes + 1 },
    } : p));
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    await api.social.deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const copyLink = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/social/post/${postId}`);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (postId: string) => {
    setSharingSubmitting(true);
    try {
      const shared = await api.social.sharePost(postId, shareContent || undefined);
      setPosts(prev => [shared, ...prev]);
      setSharingId(null);
      setShareContent('');
    } catch (e) {} finally { setSharingSubmitting(false); }
  };



  const statusColors: Record<string, string> = {
    APPROVED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    PENDING_AI_REVIEW: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-[var(--color-muted)] mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );

  const SectionBlock = ({ id, fields }: { id: string; fields: { label: string; value: string }[] }) => (
    <div className="mb-6 last:mb-0">
      <h3 className="flex items-center gap-2 text-sm font-display font-bold text-[var(--color-primary)] mb-3">
        <span className="text-lg leading-none">{SECTION_ICONS[id] || '•'}</span>
        {t(`profile.sections.${id}`)}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        {fields.map((f, i) => (
          <InfoRow key={i} label={f.label} value={f.value} />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-6">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-6">📋</div>
        <h2 className="text-2xl font-bold text-[var(--color-primary)] font-display mb-3">{t('profile.create')}</h2>
        <p className="text-[var(--color-muted)] mb-8 leading-relaxed">ليس لديك ملف شخصي بعد. قم بإنشاء ملفك الآن لتبدأ في التعرف على الآخرين</p>
        <button
          onClick={() => navigate('/profile/setup')}
          className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-light)] transition-colors duration-200 shadow-sm"
        >
          {t('profile.create')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-[var(--color-surface)] p-8 rounded-2xl shadow-sm border border-[var(--color-border)] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-start gap-5 mb-7">
          <UserAvatar
            photo={user?.avatarUrl || profile.photos?.[0]?.url}
            size="lg"
            roles={user?.roles}
            subscriptionPlan={user?.subscriptionPlan}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--color-primary)] font-display leading-tight">
                {profile.displayName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[profile.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {t(`profile.status.${profile.status}`)}
              </span>
            </div>
            <p className="text-sm text-[var(--color-muted)] mt-1">{profile.age} سنة • {profile.nationality}</p>
          </div>
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-7">
          <InfoRow label={t('profile.city')} value={`${profile.city}, ${profile.countryOfResidence}`} />
          <InfoRow label={`${t('profile.weight')} / ${t('profile.height')}`} value={`${profile.weight || '—'} / ${profile.height || '—'}`} />
          <InfoRow label={t('profile.skinColor')} value={profile.skinColor} />
          <InfoRow label={t('profile.beard')} value={profile.beard} />
          <InfoRow label={t('profile.sports')} value={profile.sports} />
          <InfoRow label={t('profile.smoking')} value={profile.smoking} />
          <InfoRow label={t('profile.education')} value={`${profile.education}${profile.educationLevel ? ` - ${profile.educationLevel}` : ''}`} />
          <InfoRow label={t('profile.occupation')} value={`${profile.occupation}${profile.workType ? ` (${profile.workType})` : ''}`} />
          <InfoRow label={t('profile.incomeLevel')} value={profile.incomeLevel} />
          <InfoRow label={t('profile.madhab_label')} value={t(`profile.madhab.${profile.madhab}`)} />
          <InfoRow label={t('profile.originGovernorate')} value={profile.originGovernorate} />
          <InfoRow label={t('profile.residenceGovernorate')} value={profile.residenceGovernorate} />
        </div>

        {/* Photos */}
        {profile.photos?.length > 0 && (
          <div className="mb-7">
            <h3 className="flex items-center gap-2 text-sm font-display font-bold text-[var(--color-primary)] mb-3">
              <span className="text-lg leading-none">📸</span>
              {t('profile.sections.photos')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {profile.photos.map((photo: any) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-[var(--color-border)] group">
                  <img
                    src={photoUrl(photo.url)}
                    alt=""
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setViewerImg(photoUrl(photo.url))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section blocks */}
        <SectionBlock
          id="family"
          fields={[
            { label: t('profile.fatherOccupation'), value: profile.fatherOccupation },
            { label: t('profile.motherOccupation'), value: profile.motherOccupation },
            { label: t('profile.siblingsCount'), value: profile.siblingsCount },
            { label: t('profile.siblingsEducation'), value: profile.siblingsEducation },
          ]}
        />

        <SectionBlock
          id="residence"
          fields={[
            { label: t('profile.areaType'), value: profile.areaType },
            { label: t('profile.marriedResidence'), value: profile.marriedResidence },
            { label: t('profile.housingType'), value: profile.housingType },
            { label: t('profile.housingPrivacy'), value: profile.housingPrivacy },
          ]}
        />

        <SectionBlock
          id="maritalInfo"
          fields={[
            {
              label: t('profile.sections.maritalStatus_label'),
              value: profile.maritalStatus === 'SINGLE' ? t('profile.maritalStatus.SINGLE') : profile.maritalStatus === 'DIVORCED' ? t('profile.maritalStatus.DIVORCED') : profile.maritalStatus === 'WIDOWED' ? t('profile.maritalStatus.WIDOWED') : profile.maritalStatus,
            },
            { label: t('profile.marriageNumber_label'), value: profile.marriageNumber },
            ...(profile.lastDivorceDate ? [{ label: t('profile.lastDivorceDate'), value: profile.lastDivorceDate }] : []),
            { label: t('profile.hasChildren'), value: profile.hasChildren ? `${profile.numberOfChildren} (${profile.childrenDetails || ''})` : t('common.no') },
            ...(profile.childrenCustody ? [{ label: t('profile.childrenCustody'), value: profile.childrenCustody }] : []),
            { label: t('profile.wantsPolygamy'), value: profile.wantsPolygamy ? t('common.yes') : t('common.no') },
            { label: t('profile.wantsChildren'), value: profile.wantsChildren ? t('common.yes') : t('common.no') },
          ]}
        />

        {/* Self introduction */}
        {profile.selfIntroduction && (
          <div className="mb-7">
            <h3 className="flex items-center gap-2 text-sm font-display font-bold text-[var(--color-primary)] mb-3">
              <span className="text-lg leading-none">💬</span>
              {t('profile.selfIntroduction')}
            </h3>
            <div className="bg-[var(--color-bg)] rounded-xl p-5 border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text)] leading-relaxed">{profile.selfIntroduction}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6 border-t border-[var(--color-border)]">
          <button
            onClick={() => navigate(`/profile/setup?edit=${profile.id}`)}
            className="px-5 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-xl text-sm font-medium hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200"
          >
            تعديل الملف
          </button>
          {profile.status === 'DRAFT' && (
            <button
              onClick={() => api.profile.submit(profile.id).then(() => window.location.reload())}
              className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors duration-200 shadow-sm"
            >
              {t('profile.submit')}
            </button>
          )}
          <div className="mr-auto flex items-center gap-4 text-xs text-[var(--color-muted)]">
            <span>المشاهدات: {profile.viewCount || 0}</span>
            <span>طلبات التواصل: {profile.requestCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Posts timeline */}
      <div>
        <h2 className="text-lg font-bold text-[var(--color-primary)] font-display mb-4 flex items-center gap-2">
          <span>📝</span>
          المنشورات
        </h2>

        {postsLoading ? (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 animate-pulse space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-[var(--color-muted)] mb-3">لا توجد منشورات بعد</p>
            <Link to="/social" className="text-sm text-[var(--color-primary)] font-medium hover:underline">
              اذهب إلى المنصة الاجتماعية لإنشاء أول منشور
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 transition-shadow duration-200 hover:shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Link to={`/profile/my`} className="flex items-center gap-3">
                    <UserAvatar
                      photo={post.user?.avatarUrl || post.user?.profile?.photos?.[0]?.url}
                      size="md"
                      roles={post.user?.roles}
                      subscriptionPlan={post.user?.subscriptionPlan}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-[var(--color-primary)]">
                          {post.user?.profile?.displayName || 'مستخدم'}
                        </p>
                        {post.user?.subscriptionPlan === 'PREMIUM' && (
                          <span className="text-[10px] bg-[#DAA520]/20 text-[#DAA520] px-1.5 py-0.5 rounded font-medium leading-none">مميز</span>
                        )}
                        {post.user?.role === 'GUARDIAN' && post.user?.subscriptionPlan !== 'PREMIUM' && (
                          <span className="text-[10px] bg-[#2D6A4F]/20 text-[var(--color-primary-light)] px-1.5 py-0.5 rounded font-medium leading-none">ولي</span>
                        )}
                        {post.user?.role === 'SOCIAL' && post.user?.subscriptionPlan !== 'PREMIUM' && (
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium leading-none">اجتماعي</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)]">
                        {new Date(post.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-3">
                    <Link
                      to={`/social/post/${post.id}`}
                      className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      تعديل
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs text-[var(--color-muted)] hover:text-red-500 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                {/* Privacy badge */}
                {post.privacy && post.privacy !== 'PUBLIC' && (
                  <div className="mb-3">
                    <span className="inline-block text-xs bg-[var(--color-bg)] text-[var(--color-muted)] px-2 py-0.5 rounded">
                      {post.privacy === 'PRIVATE' ? 'خاص' : post.privacy === 'CONNECTIONS' ? 'المتابعين' : post.privacy}
                    </span>
                  </div>
                )}

                {/* Content */}
                <Link to={`/social/post/${post.id}`}>
                  <p className="text-sm text-[var(--color-text)] leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  {post.mediaUrls?.length > 0 && (
                    <div
                      className="grid gap-2 mb-4"
                      style={{ gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}
                    >
                      {post.mediaUrls.map((url: string, i: number) => (
                        isVideoUrl(url) ? (
                          <video key={i} src={photoUrl(url)} controls className="rounded-xl w-full h-48 object-cover" />
                        ) : isAudioUrl(url) ? (
                          <audio key={i} src={photoUrl(url)} controls className="w-full mt-1" />
                        ) : (
                          <img key={i} src={photoUrl(url)} alt="" className="rounded-xl w-full h-48 object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]" onClick={() => setViewerImg(url)} />
                        )
                      ))}
                    </div>
                  )}
                  {post.sharedPost && (
                    <div className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <UserAvatar
                          photo={post.sharedPost.user?.avatarUrl || post.sharedPost.user?.profile?.photos?.[0]?.url}
                          size="sm"
                          roles={post.sharedPost.user?.roles}
                          subscriptionPlan={post.sharedPost.user?.subscriptionPlan}
                        />
                        <span className="text-xs font-semibold text-[var(--color-primary)]">{post.sharedPost.user?.profile?.displayName || ''}</span>
                      </div>
                      <p className="text-xs text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{post.sharedPost.content}</p>
                      {post.sharedPost.mediaUrls?.length > 0 && (
                        <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: post.sharedPost.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}>
                          {post.sharedPost.mediaUrls.map((url: string, i: number) => (
                            isVideoUrl(url) ? (
                              <video key={i} src={photoUrl(url)} controls className="rounded-lg w-full h-24 object-cover" />
                            ) : isAudioUrl(url) ? (
                              <audio key={i} src={photoUrl(url)} controls className="w-full mt-1" />
                            ) : (
                              <img key={i} src={photoUrl(url)} alt="" className="rounded-lg w-full h-24 object-cover" />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-6 pt-3 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors duration-200 ${
                      post.liked?.[0] || post.liked ? 'text-red-500' : 'text-[var(--color-muted)] hover:text-red-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={post.liked?.[0] || post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post._count?.likes || 0}
                  </button>
                  <Link
                    to={`/social/post/${post.id}`}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post._count?.comments || 0}
                  </Link>
                  <button
                    onClick={() => setSharingId(sharingId === post.id ? null : post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors duration-200 ${
                      sharingId === post.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">إعادة نشر</span>
                  </button>
                  <button
                    onClick={() => copyLink(post.id)}
                    className="mr-auto flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    {copiedId === post.id ? (
                      <span className="text-green-500 text-xs">تم النسخ!</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span className="hidden sm:inline">مشاركة</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Share box */}
                {sharingId === post.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <textarea
                      value={shareContent}
                      onChange={(e) => setShareContent(e.target.value)}
                      placeholder="أضف تعليقك (اختياري)"
                      className="w-full border border-[var(--color-border)] rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] h-20 mb-3 bg-[var(--color-bg)] transition-colors duration-200"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShare(post.id)}
                        disabled={sharingSubmitting}
                        className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-all duration-200 shadow-sm"
                      >
                        {sharingSubmitting ? 'جاري النشر...' : 'إعادة نشر'}
                      </button>
                      <button
                        onClick={() => { setSharingId(null); setShareContent(''); }}
                        className="px-5 py-2 border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors duration-200"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-xl disabled:opacity-40 hover:bg-[var(--color-bg)] transition-colors duration-200"
                >
                  السابق
                </button>
                <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors duration-200 ${
                        p === page
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-xl disabled:opacity-40 hover:bg-[var(--color-bg)] transition-colors duration-200"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {viewerImg && <ImageViewer src={viewerImg} onClose={() => setViewerImg(null)} />}
    </div>
  );
}
