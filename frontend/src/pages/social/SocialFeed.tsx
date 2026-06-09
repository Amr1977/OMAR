import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { onNewPostInFeed, emitPostCreated } from '../../lib/socket';
import { renderRichText } from '../../lib/richText';
import ImageViewer from '../../components/ImageViewer';
import UserAvatar from '../../components/UserAvatar';
import StoriesBar from './StoriesBar';

export default function SocialFeed() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [postPrivacy, setPostPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'CONNECTIONS' | 'SELECTED'>('PUBLIC');
  const [tab, setTab] = useState<'feed' | 'explore'>('feed');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ id: string; url: string; type: string; uploading: boolean }[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMediaUrls, setEditMediaUrls] = useState<string[]>([]);
  const [editNewMedia, setEditNewMedia] = useState<string[]>([]);
  const [editNewMediaPreviews, setEditNewMediaPreviews] = useState<{ id: string; url: string; type: string; uploading: boolean }[]>([]);
  const [viewerImg, setViewerImg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState('');
  const [sharingSubmitting, setSharingSubmitting] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const privacyLabels: Record<string, string> = {
    PUBLIC: 'عام',
    PRIVATE: 'خاص',
    CONNECTIONS: 'المتابعين',
    SELECTED: 'مختار',
  };

  const uploadingCount = mediaPreviews.filter(m => m.uploading).length;
  const canPublish = (newPost.trim() || mediaUrls.length > 0) && !submitting && uploadingCount === 0;

  const fetchPosts = (append = false, pageNum?: number) => {
    const p = pageNum ?? page;
    setLoading(true);
    const fetcher = tab === 'feed' ? api.social.getFeed(`page=${p}&limit=20`) : api.social.getExplore(`page=${p}&limit=20`);
    fetcher.then((res: any) => {
      setPosts(prev => append ? [...prev, ...res.posts] : res.posts);
      setTotalPages(res.totalPages);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (page > 1) fetchPosts(true);
    else fetchPosts();
  }, [tab, page]);

  useEffect(() => {
    const unsub = onNewPostInFeed(({ postId }) => {
      api.social.getPost(postId).then(post => {
        setPosts(prev => [post, ...prev]);
      }).catch(() => {});
    });
    return () => { unsub?.(); };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadError('');
    const entries = Array.from(files).map((file) => {
      const id = Math.random().toString(36).slice(2);
      const previewUrl = URL.createObjectURL(file);
      return { file, id, previewUrl };
    });
    const newPreviews = entries.map(e => ({ id: e.id, url: e.previewUrl, type: e.file.type, uploading: true }));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
    const results = await Promise.allSettled(
      entries.map(e => {
        const fd = new FormData();
        fd.append('media', e.file);
        return api.social.uploadMedia(fd).then((res: any) => ({ id: e.id, url: res.url }));
      })
    );
    const succeeded: { id: string; url: string }[] = [];
    const failed: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        succeeded.push(r.value);
      } else {
        failed.push(entries[i].id);
        setUploadError(`فشل رفع ${failed.length} ملف(ملفات)`);
      }
    });
    setMediaUrls(prev => [...prev, ...succeeded.map(s => s.url)]);
    setMediaPreviews(prev => prev.map(p => {
      if (failed.includes(p.id)) return { ...p, uploading: false };
      const found = succeeded.find(s => s.id === p.id);
      return found ? { ...p, uploading: false } : p;
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (idx: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreatePost = async () => {
    if (!canPublish) return;
    setSubmitting(true);
    try {
      const shared = await api.social.createPost({ content: newPost, privacy: postPrivacy, mediaUrls });
      emitPostCreated(shared.id);
      setNewPost('');
      setMediaUrls([]);
      setMediaPreviews([]);
      setUploadError('');
      setPage(1);
      if (page === 1) fetchPosts(false, 1);
    } catch (e) {} finally { setSubmitting(false); }
  };

  const handleSave = async (postId: string) => {
    const res = await api.social.toggleSave(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saves: res.saved ? [{ userId: currentUserId }] : [] } : p));
  };

  const handlePin = async (postId: string) => {
    await api.social.togglePin(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !p.isPinned } : p));
  };

  const handleReport = async (postId: string) => {
    const reason = window.prompt('سبب الإبلاغ:');
    if (!reason) return;
    await api.social.reportPost(postId, reason);
    alert('تم إرسال الإبلاغ، شكراً لك');
  };

  const handleLike = async (postId: string) => {
    await api.social.toggleLike(postId);
    setPosts(posts.map(p => p.id === postId ? {
      ...p,
      liked: !p.liked,
      _count: { ...p._count, likes: p.liked ? p._count.likes - 1 : p._count.likes + 1 },
    } : p));
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    await api.social.deletePost(postId);
    setPosts(posts.filter(p => p.id !== postId));
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

  const startEdit = (post: any) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditMediaUrls([...(post.mediaUrls || [])]);
    setEditNewMedia([]);
    setEditNewMediaPreviews([]);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditMediaUrls([]);
    setEditNewMedia([]);
    setEditNewMediaPreviews([]);
  };

  const removeEditMedia = (idx: number) => {
    setEditMediaUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const entries = Array.from(files).map((file) => {
      const id = Math.random().toString(36).slice(2);
      const previewUrl = URL.createObjectURL(file);
      return { file, id, previewUrl };
    });
    const newPreviews = entries.map(e => ({ id: e.id, url: e.previewUrl, type: e.file.type, uploading: true }));
    setEditNewMediaPreviews(prev => [...prev, ...newPreviews]);
    const results = await Promise.allSettled(
      entries.map(e => {
        const fd = new FormData();
        fd.append('media', e.file);
        return api.social.uploadMedia(fd).then((res: any) => ({ id: e.id, url: res.url }));
      })
    );
    const succeeded: { id: string; url: string }[] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled') succeeded.push(r.value);
    });
    setEditMediaUrls(prev => [...prev, ...succeeded.map(s => s.url)]);
    setEditNewMediaPreviews(prev => prev.map(p => {
      const found = succeeded.find(s => s.id === p.id);
      return found ? { ...p, uploading: false } : p;
    }));
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const handleSaveEdit = async (postId: string, currentPrivacy?: string) => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    try {
      const updated = await api.social.updatePost(postId, { content: editContent, mediaUrls: editMediaUrls, privacy: currentPrivacy });
      setPosts(posts.map(p => p.id === postId ? updated : p));
      cancelEdit();
    } catch (e) {} finally { setSubmitting(false); }
  };

  const userName = (p: any) => p.user.profile?.displayName || p.user.roles?.find((r: string) => r !== 'SOCIAL') || p.user.roles?.[0] || '';

  const isVideo = (url: string) => url.startsWith('data:video/');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        {tab === 'feed' ? 'آخر المنشورات' : 'استكشف'}
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[var(--color-border)]">
        <button onClick={() => { setTab('feed'); setPage(1); }} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'feed' ? 'text-[var(--color-primary)] border-[var(--color-primary)]' : 'text-[var(--color-muted)] border-transparent'}`}>
          المتابعة
        </button>
        <button onClick={() => { setTab('explore'); setPage(1); }} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'explore' ? 'text-[var(--color-primary)] border-[var(--color-primary)]' : 'text-[var(--color-muted)] border-transparent'}`}>
          استكشف
        </button>
      </div>

      <StoriesBar />

      {/* Create post */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="ما الذي يدور في ذهنك؟"
          className="w-full border-0 resize-none focus:outline-none text-sm h-20"
        />

        {/* Media previews */}
        {mediaPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {mediaPreviews.map((m, i) => (
              <div key={m.id} className="relative group">
                {m.type.startsWith('video/') ? (
                  <video src={m.url} className="w-24 h-24 object-cover rounded-lg border border-[var(--color-border)]" />
                ) : (
                  <img src={m.url} alt="" className="w-24 h-24 object-cover rounded-lg border border-[var(--color-border)]" />
                )}
                {m.uploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">جاري الرفع...</span>
                  </div>
                )}
                {!m.uploading && (
                  <button onClick={() => removeMedia(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border)]">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
          <select value={postPrivacy} onChange={(e) => setPostPrivacy(e.target.value as any)} className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[var(--color-muted)] bg-[var(--color-surface)]">
            <option value="PUBLIC">عام</option>
            <option value="CONNECTIONS">المتابعين</option>
            <option value="PRIVATE">خاص</option>
          </select>
          {uploadingCount > 0 && (
            <span className="text-xs text-amber-500">جاري رفع {uploadingCount} ملف...</span>
          )}
          {uploadError && (
            <span className="text-xs text-red-500">{uploadError}</span>
          )}
          <span className="text-xs text-[var(--color-muted)]">{newPost.length} حرف</span>
          <button onClick={handleCreatePost} disabled={!canPublish} className="mr-auto px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50">
            {submitting ? 'جاري النشر...' : uploadingCount > 0 ? `جاري الرفع...` : 'نشر'}
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-8 text-[var(--color-muted)]">جاري التحميل...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)]">
          <p className="text-lg mb-2">لا توجد منشورات</p>
          <p className="text-sm">{tab === 'feed' ? 'تابع مستخدمين آخرين لرؤية منشوراتهم' : 'كن أول من ينشر!'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className={`bg-[var(--color-surface)] rounded-xl border p-4 ${
              post.user.subscriptionPlan === 'PREMIUM'
                ? 'border-[#DAA520]/40 shadow-[0_0_12px_rgba(218,165,32,0.08)]'
                : 'border-[var(--color-border)]'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <Link to={post.user.id === currentUserId ? '/profile/my' : `/social/user/${post.user.id}`} className="flex items-center gap-3">
                    <UserAvatar
                      photo={post.user.profile?.photos?.[0]?.url}
                      size="lg"
                      roles={post.user.roles}
                      subscriptionPlan={post.user.subscriptionPlan}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-[var(--color-primary)]">{userName(post)}</p>
                        {post.user.subscriptionPlan === 'PREMIUM' && (
                          <span className="text-[10px] bg-[#DAA520]/20 text-[#DAA520] px-1.5 py-0.5 rounded font-medium leading-none">مميز</span>
                        )}
                        {post.user.roles?.includes('GUARDIAN') && post.user.subscriptionPlan !== 'PREMIUM' && (
                          <span className="text-[10px] bg-[#2D6A4F]/20 text-[#2D6A4F] px-1.5 py-0.5 rounded font-medium leading-none">ولي</span>
                        )}
                        {(!post.user.roles || (post.user.roles.length === 1 && post.user.roles[0] === 'SOCIAL')) && post.user.subscriptionPlan !== 'PREMIUM' && (
                          <span className="text-[10px] bg-[#2563EB]/20 text-[#2563EB] px-1.5 py-0.5 rounded font-medium leading-none">اجتماعي</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)]">{new Date(post.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </Link>
                {post.user.id === currentUserId && (
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(post)} className="text-xs text-blue-400 hover:text-blue-600">تعديل</button>
                    <button onClick={() => handleDelete(post.id)} className="text-xs text-red-400 hover:text-red-600">حذف</button>
                  </div>
                )}
              </div>

              {/* Privacy badge */}
              {post.privacy && post.privacy !== 'PUBLIC' && (
                <div className="mb-2">
                  <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-[var(--color-muted)] px-2 py-0.5 rounded">
                    {privacyLabels[post.privacy] || post.privacy}
                  </span>
                </div>
              )}

              {/* Content */}
              {editingPostId === post.id ? (
                <div className="mb-3">
                  <textarea
                    ref={editInputRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] h-24"
                  />
                  {/* Edit media previews */}
                  {editMediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editMediaUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          {url.startsWith('data:video/') ? (
                            <video src={url} className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]" />
                          ) : (
                            <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]" />
                          )}
                          <button onClick={() => removeEditMedia(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Edit new media uploads */}
                  {editNewMediaPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editNewMediaPreviews.map((m) => (
                        <div key={m.id} className="relative">
                          {m.type.startsWith('video/') ? (
                            <video src={m.url} className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]" />
                          ) : (
                            <img src={m.url} alt="" className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]" />
                          )}
                          {m.uploading && (
                            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs">جاري الرفع...</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => editFileInputRef.current?.click()} className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <input ref={editFileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleEditFileSelect} />
                    <select value={post.privacy} onChange={(e) => {
                      const newPrivacy = e.target.value;
                      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, privacy: newPrivacy } : p));
                    }} className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-muted)] bg-[var(--color-surface)]">
                      <option value="PUBLIC">عام</option>
                      <option value="CONNECTIONS">المتابعين</option>
                      <option value="PRIVATE">خاص</option>
                    </select>
                    <div className="flex gap-2 mr-auto">
                      <button onClick={() => handleSaveEdit(post.id, post.privacy)} disabled={submitting || !editContent.trim()} className="px-4 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50">
                        {submitting ? 'جاري الحفظ...' : 'حفظ'}
                      </button>
                      <button onClick={cancelEdit} className="px-4 py-1.5 border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <Link to={`/social/post/${post.id}`}>
                <p className="text-sm text-[var(--color-text)] leading-relaxed mb-3 whitespace-pre-wrap">{renderRichText(post.content)}</p>
                {post.mediaUrls?.length > 0 && (
                  <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}>
                    {post.mediaUrls.map((url: string, i: number) => (
                      isVideo(url) ? (
                        <video key={i} src={url} controls className="rounded-lg w-full h-48 object-cover" />
                      ) : (
                        <img key={i} src={url} alt="" className="rounded-lg w-full h-48 object-cover cursor-pointer" onClick={(e) => { e.preventDefault(); setViewerImg(url); }} />
                      )
                    ))}
                  </div>
                )}
                {post.sharedPost && (
                  <div className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] p-3 mb-3" onClick={(e) => e.preventDefault()}>
                    <Link to={`/social/post/${post.sharedPost.id}`} className="block">
                      <div className="flex items-center gap-2 mb-2">
                        <UserAvatar
                          photo={post.sharedPost.user?.profile?.photos?.[0]?.url}
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
                            isVideo(url) ? (
                              <video key={i} src={url} controls className="rounded-lg w-full h-24 object-cover" />
                            ) : (
                              <img key={i} src={url} alt="" className="rounded-lg w-full h-24 object-cover" />
                            )
                          ))}
                        </div>
                      )}
                    </Link>
                  </div>
                )}
              </Link>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-3 border-t border-[var(--color-border)]">
                <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked?.[0] || post.liked ? 'text-red-500' : 'text-[var(--color-muted)] hover:text-red-500'}`}>
                  <svg className="w-5 h-5" fill={post.liked?.[0] || post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {post._count.likes}
                </button>
                <Link to={`/social/post/${post.id}`} className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {post._count.comments}
                </Link>
                <button onClick={() => handleSave(post.id)} className={`flex items-center gap-1.5 text-sm transition-colors ${post.saves?.[0] ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'}`}>
                  <svg className="w-4 h-4" fill={post.saves?.[0] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button onClick={() => setSharingId(sharingId === post.id ? null : post.id)} className={`flex items-center gap-1.5 text-sm transition-colors ${sharingId === post.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">إعادة نشر</span>
                </button>
                <button onClick={() => copyLink(post.id)} className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
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
                <div className="relative mr-auto">
                  <button onClick={() => setMenuPostId(menuPostId === post.id ? null : post.id)} className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-primary)]">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                  {menuPostId === post.id && (
                    <div className="absolute left-0 top-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-10 min-w-[140px]" dir="rtl">
                      {post.user.id === currentUserId ? (
                        <>
                          <button onClick={() => { handlePin(post.id); setMenuPostId(null); }} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-xl">
                            {post.isPinned ? 'إلغاء التثبيت' : 'تثبيت المنشور'}
                          </button>
                          <button onClick={() => { startEdit(post); setMenuPostId(null); }} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">تعديل</button>
                          <button onClick={() => { handleDelete(post.id); setMenuPostId(null); }} className="w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-xl">حذف</button>
                        </>
                      ) : (
                        <button onClick={() => { handleReport(post.id); setMenuPostId(null); }} className="w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">إبلاغ</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {sharingId === post.id && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <textarea
                    value={shareContent}
                    onChange={(e) => setShareContent(e.target.value)}
                    placeholder="أضف تعليقك (اختياري)"
                    className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] h-20 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShare(post.id)}
                      disabled={sharingSubmitting}
                      className="px-4 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                    >
                      {sharingSubmitting ? 'جاري النشر...' : 'إعادة نشر'}
                    </button>
                    <button
                      onClick={() => { setSharingId(null); setShareContent(''); }}
                      className="px-4 py-1.5 border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Load more */}
          {page < totalPages && (
            <div className="text-center mt-6">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-8 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
              >
                عرض المزيد
              </button>
            </div>
          )}
        </div>
      )}
      {viewerImg && <ImageViewer src={viewerImg} onClose={() => setViewerImg(null)} />}
    </div>
  );
}
