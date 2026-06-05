import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, photoUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import ImageViewer from '../../components/ImageViewer';
import UserAvatar from '../../components/UserAvatar';

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

  const isVideo = (url: string) => url.startsWith('data:video/');

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-[#1B4332] mb-4">{t('profile.create')}</h2>
        <p className="text-[#6B7280] mb-8">ليس لديك ملف شخصي بعد. قم بإنشاء ملفك الآن</p>
        <button
          onClick={() => navigate('/profile/setup')}
          className="px-8 py-3 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]"
        >
          {t('profile.create')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E7EB] mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">{profile.displayName}</h1>
            <p className="text-[#6B7280]">{profile.age} سنة • {profile.nationality}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            profile.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            profile.status === 'PENDING_AI_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
            profile.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {t(`profile.status.${profile.status}`)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.city')}</p>
            <p className="font-medium">{profile.city}, {profile.countryOfResidence}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.weight')} / {t('profile.height')}</p>
            <p className="font-medium">{profile.weight || '—'} / {profile.height || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.skinColor')}</p>
            <p className="font-medium">{profile.skinColor || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.beard')}</p>
            <p className="font-medium">{profile.beard || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.sports')}</p>
            <p className="font-medium">{profile.sports || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.smoking')}</p>
            <p className="font-medium">{profile.smoking || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.education')}</p>
            <p className="font-medium">{profile.education} {profile.educationLevel ? `- ${profile.educationLevel}` : ''}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.occupation')}</p>
            <p className="font-medium">{profile.occupation}{profile.workType ? ` (${profile.workType})` : ''}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.incomeLevel')}</p>
            <p className="font-medium">{profile.incomeLevel || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.madhab_label')}</p>
            <p className="font-medium">{t(`profile.madhab.${profile.madhab}`)}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.originGovernorate')}</p>
            <p className="font-medium">{profile.originGovernorate || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{t('profile.residenceGovernorate')}</p>
            <p className="font-medium">{profile.residenceGovernorate || '—'}</p>
          </div>
        </div>

        {(profile.photos?.length > 0) && (
          <div className="mb-6">
            <h3 className="font-semibold text-[#1B4332] mb-3">{t('profile.sections.photos')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {profile.photos.map((photo: any) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border border-[#E5E7EB]">
                  <img src={photoUrl(photo.url)} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => setViewerImg(photoUrl(photo.url))} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold text-[#1B4332] mb-2">{t('profile.sections.family')}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#6B7280]">{t('profile.fatherOccupation')}:</span> {profile.fatherOccupation || '—'}</div>
            <div><span className="text-[#6B7280]">{t('profile.motherOccupation')}:</span> {profile.motherOccupation || '—'}</div>
            <div><span className="text-[#6B7280]">{t('profile.siblingsCount')}:</span> {profile.siblingsCount || '—'}</div>
            <div><span className="text-[#6B7280]">{t('profile.siblingsEducation')}:</span> {profile.siblingsEducation || '—'}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-[#1B4332] mb-2">{t('profile.sections.residence')}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#6B7280]">{t('profile.areaType')}:</span> {profile.areaType || '—'}</div>
            <div><span className="text-[#6B7280]">{t('profile.marriedResidence')}:</span> {profile.marriedResidence || '—'}</div>
            <div><span className="text-[#6B7280]">{t('profile.housingType')}:</span> {profile.housingType || '—'}</div>
            <div><span className="text-[#6B7280]">{t('profile.housingPrivacy')}:</span> {profile.housingPrivacy || '—'}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-[#1B4332] mb-2">{t('profile.sections.maritalInfo')}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#6B7280]">{t('profile.sections.maritalStatus_label')}:</span> {profile.maritalStatus === 'SINGLE' ? t('profile.maritalStatus.SINGLE') : profile.maritalStatus === 'DIVORCED' ? t('profile.maritalStatus.DIVORCED') : profile.maritalStatus === 'WIDOWED' ? t('profile.maritalStatus.WIDOWED') : profile.maritalStatus}</div>
            <div><span className="text-[#6B7280]">{t('profile.marriageNumber_label')}:</span> {profile.marriageNumber || '—'}</div>
            {profile.lastDivorceDate && <div><span className="text-[#6B7280]">{t('profile.lastDivorceDate')}:</span> {profile.lastDivorceDate}</div>}
            <div><span className="text-[#6B7280]">{t('profile.hasChildren')}:</span> {profile.hasChildren ? `${profile.numberOfChildren} (${profile.childrenDetails || ''})` : t('common.no')}</div>
            {profile.childrenCustody && <div><span className="text-[#6B7280]">{t('profile.childrenCustody')}:</span> {profile.childrenCustody}</div>}
            <div><span className="text-[#6B7280]">{t('profile.wantsPolygamy')}:</span> {profile.wantsPolygamy ? t('common.yes') : t('common.no')}</div>
            <div><span className="text-[#6B7280]">{t('profile.wantsChildren')}:</span> {profile.wantsChildren ? t('common.yes') : t('common.no')}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-[#1B4332] mb-2">{t('profile.selfIntroduction')}</h3>
          <p className="text-[#4A4A4A] leading-relaxed">{profile.selfIntroduction}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/profile/setup?edit=${profile.id}`)}
            className="px-6 py-2 border border-[#1B4332] text-[#1B4332] rounded-lg hover:bg-gray-50"
          >
            تعديل الملف
          </button>
          {profile.status === 'DRAFT' && (
            <button
              onClick={() => api.profile.submit(profile.id).then(() => window.location.reload())}
              className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]"
            >
              {t('profile.submit')}
            </button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
          <p className="text-sm text-[#6B7280]">
            المشاهدات: {profile.viewCount} • طلبات التواصل: {profile.requestCount}
          </p>
        </div>
      </div>

      {/* Posts timeline */}
      <div>
        <h2 className="text-xl font-bold text-[#1B4332] mb-4">المنشورات</h2>

        {postsLoading ? (
          <div className="text-center py-8 text-[#6B7280]">جاري التحميل...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center">
            <p className="text-[#6B7280] mb-2">لا توجد منشورات بعد</p>
            <Link to="/social" className="text-[#1B4332] font-medium hover:underline">
              اذهب إلى المنصة الاجتماعية لإنشاء أول منشور
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <Link to={`/profile/my`} className="flex items-center gap-3">
                    <UserAvatar
                      photo={post.user?.profile?.photos?.[0]?.url}
                      size="lg"
                      role={post.user?.role}
                      subscriptionPlan={post.user?.subscriptionPlan}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-[#1B4332]">
                          {post.user?.profile?.displayName || post.user?.role || 'مستخدم'}
                        </p>
                        {post.user?.subscriptionPlan === 'PREMIUM' && (
                          <span className="text-[10px] bg-[#DAA520]/20 text-[#DAA520] px-1.5 py-0.5 rounded font-medium leading-none">مميز</span>
                        )}
                        {post.user?.role === 'GUARDIAN' && post.user?.subscriptionPlan !== 'PREMIUM' && (
                          <span className="text-[10px] bg-[#2D6A4F]/20 text-[#2D6A4F] px-1.5 py-0.5 rounded font-medium leading-none">ولي</span>
                        )}
                        {post.user?.role === 'SOCIAL' && post.user?.subscriptionPlan !== 'PREMIUM' && (
                          <span className="text-[10px] bg-[#2563EB]/20 text-[#2563EB] px-1.5 py-0.5 rounded font-medium leading-none">اجتماعي</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        {new Date(post.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <Link
                      to={`/social/post/${post.id}`}
                      className="text-xs text-blue-400 hover:text-blue-600"
                    >
                      تعديل
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                {/* Privacy badge */}
                {post.privacy && post.privacy !== 'PUBLIC' && (
                  <div className="mb-2">
                    <span className="inline-block text-xs bg-gray-100 text-[#6B7280] px-2 py-0.5 rounded">
                      {post.privacy === 'PRIVATE' ? 'خاص' : post.privacy === 'CONNECTIONS' ? 'المتابعين' : post.privacy}
                    </span>
                  </div>
                )}

                {/* Content */}
                <Link to={`/social/post/${post.id}`}>
                  <p className="text-sm text-[#374151] leading-relaxed mb-3 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  {post.mediaUrls?.length > 0 && (
                    <div
                      className="grid gap-2 mb-3"
                      style={{ gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}
                    >
                      {post.mediaUrls.map((url: string, i: number) => (
                        isVideo(url) ? (
                          <video key={i} src={url} controls className="rounded-lg w-full h-48 object-cover" />
                        ) : (
                          <img key={i} src={url} alt="" className="rounded-lg w-full h-48 object-cover cursor-pointer" onClick={() => setViewerImg(url)} />
                        )
                      ))}
                    </div>
                  )}
                  {post.sharedPost && (
                    <div className="bg-gray-50 rounded-xl border border-[#E5E7EB] p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <UserAvatar
                          photo={post.sharedPost.user?.profile?.photos?.[0]?.url}
                          size="sm"
                          role={post.sharedPost.user?.role}
                          subscriptionPlan={post.sharedPost.user?.subscriptionPlan}
                        />
                        <span className="text-xs font-semibold text-[#1B4332]">{post.sharedPost.user?.profile?.displayName || post.sharedPost.user?.role}</span>
                      </div>
                      <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">{post.sharedPost.content}</p>
                      {post.sharedPost.mediaUrls?.length > 0 && (
                        <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: post.sharedPost.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}>
                          {post.sharedPost.mediaUrls.map((url: string, i: number) => (
                            isVideo(url) ? (
                              <video key={i} src={url} controls className="rounded-lg w-full h-24 object-cover" />
                            ) : (
                              <img key={i} src={url} alt="" className="rounded-lg w-full h-24 object-cover" />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-6 pt-3 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      post.liked?.[0] || post.liked ? 'text-red-500' : 'text-[#6B7280] hover:text-red-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={post.liked?.[0] || post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post._count?.likes || 0}
                  </button>
                  <Link
                    to={`/social/post/${post.id}`}
                    className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1B4332] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post._count?.comments || 0}
                  </Link>
                  <button
                    onClick={() => setSharingId(sharingId === post.id ? null : post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      sharingId === post.id ? 'text-[#1B4332]' : 'text-[#6B7280] hover:text-[#1B4332]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">إعادة نشر</span>
                  </button>
                  <button
                    onClick={() => copyLink(post.id)}
                    className="mr-auto flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1B4332] transition-colors"
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
                {sharingId === post.id && (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    <textarea
                      value={shareContent}
                      onChange={(e) => setShareContent(e.target.value)}
                      placeholder="أضف تعليقك (اختياري)"
                      className="w-full border border-[#E5E7EB] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#1B4332] h-20 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShare(post.id)}
                        disabled={sharingSubmitting}
                        className="px-4 py-1.5 bg-[#1B4332] text-white rounded-lg text-xs font-medium hover:bg-[#2D6A4F] disabled:opacity-50"
                      >
                        {sharingSubmitting ? 'جاري النشر...' : 'إعادة نشر'}
                      </button>
                      <button
                        onClick={() => { setSharingId(null); setShareContent(''); }}
                        className="px-4 py-1.5 border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280] hover:text-[#374151]"
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
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-[#E5E7EB] rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  السابق
                </button>
                <span className="px-4 py-2 text-sm text-[#6B7280]">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-[#E5E7EB] rounded-lg disabled:opacity-50 hover:bg-gray-50"
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
