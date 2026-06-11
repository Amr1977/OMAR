import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, photoUrl, isVideoUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { renderRichText } from '../../lib/richText';
import ImageViewer from '../../components/ImageViewer';
import UserAvatar from '../../components/UserAvatar';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editMediaUrls, setEditMediaUrls] = useState<string[]>([]);
  const [editNewMediaPreviews, setEditNewMediaPreviews] = useState<{ id: string; url: string; type: string; uploading: boolean }[]>([]);
  const [viewerImg, setViewerImg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [sharingSubmitting, setSharingSubmitting] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    api.social.getPost(id).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !post) return;
    api.social.getComments(id).then((res: any) => {
      setPost((prev: any) => prev ? { ...prev, comments: res.comments || [] } : prev);
    }).catch((err) => console.error('Fetch comments error:', err));
  }, [id, post ? post.id : null]);

  const handleLike = async () => {
    if (!post) return;
    await api.social.toggleLike(post.id);
    setPost({
      ...post,
      liked: !post.liked,
      _count: { ...post._count, likes: post.liked ? post._count.likes - 1 : post._count.likes + 1 },
    });
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    try {
      const comment = await api.social.addComment(post.id, commentText);
      setPost({ ...post, comments: [...(post.comments || []), comment], _count: { ...post._count, comments: post._count.comments + 1 } });
      setCommentText('');
    } catch (e) {} finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    await api.social.deleteComment(post.id, commentId);
    setPost({ ...post, comments: post.comments.filter((c: any) => c.id !== commentId), _count: { ...post._count, comments: post._count.comments - 1 } });
  };

  const handleCommentLike = async (commentId: string) => {
    if (!post) return;
    const snapshot = post;
    setPost((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: prev.comments.map((c: any) => {
          if (c.id !== commentId) return c;
          const liked = c.likes?.length > 0;
          return {
            ...c,
            likes: liked ? [] : [{ userId: user?.id }],
            _count: { ...c._count, likes: liked ? c._count.likes - 1 : c._count.likes + 1 },
          };
        }),
      };
    });
    try { await api.social.toggleCommentLike(commentId); }
    catch { setPost(snapshot); }
  };

  const handleReplyLike = async (commentId: string, replyId: string) => {
    if (!post) return;
    const snapshot = post;
    setPost((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: prev.comments.map((c: any) => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            replies: c.replies?.map((r: any) => {
              if (r.id !== replyId) return r;
              const liked = r.likes?.length > 0;
              return {
                ...r,
                likes: liked ? [] : [{ userId: user?.id }],
                _count: { ...r._count, likes: liked ? r._count.likes - 1 : r._count.likes + 1 },
              };
            }),
          };
        }),
      };
    });
    try { await api.social.toggleCommentLike(replyId); }
    catch { setPost(snapshot); }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!replyText.trim() || !post) return;
    setReplying(true);
    try {
      const reply = await api.social.addReply(post.id, commentId, replyText);
      setPost((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.map((c: any) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              _count: { ...c._count, replies: (c._count?.replies || 0) + 1 },
              replies: [...(c.replies || []), reply],
            };
          }),
        };
      });
      setReplyText('');
      setReplyToCommentId(null);
    } catch (e) { console.error('Reply error:', e); }
    finally { setReplying(false); }
  };

  const loadMoreReplies = async (commentId: string) => {
    if (!post) return;
    try {
      const res: any = await api.social.getReplies(post.id, commentId);
      setPost((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.map((c: any) => {
            if (c.id !== commentId) return c;
            return { ...c, replies: res.replies || [] };
          }),
        };
      });
    } catch (e) { console.error('Load replies error:', e); }
  };

  const startEdit = () => {
    if (!post) return;
    setEditContent(post.content);
    setEditMediaUrls([...(post.mediaUrls || [])]);
    setEditNewMediaPreviews([]);
    setEditing(true);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditContent('');
    setEditMediaUrls([]);
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

  const handleSaveEdit = async () => {
    if (!post || !editContent.trim()) return;
    setSubmitting(true);
    try {
      const updated = await api.social.updatePost(post.id, { content: editContent, mediaUrls: editMediaUrls, privacy: post.privacy });
      setPost(updated);
      cancelEdit();
    } catch (e) {} finally { setSubmitting(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/social/post/${post?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!post) return;
    setSharingSubmitting(true);
    try {
      const shared = await api.social.sharePost(post.id, shareContent || undefined);
      setPost(shared);
      setSharing(false);
      setShareContent('');
    } catch (e) {} finally { setSharingSubmitting(false); }
  };

  const userName = (p: any) => p.user?.profile?.displayName || p.user?.role || t('social.anonymous');

  if (loading) return <div className="text-center py-8 text-[var(--color-muted)]">{t('common.loading')}</div>;
  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/social" className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block">&larr; {t('social.back')}</Link>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link to={post.user?.id === user?.id ? '/profile/my' : `/social/user/${post.user?.id}`} className="flex items-center gap-3">
              <UserAvatar
                photo={post.user?.avatarUrl || post.user?.profile?.photos?.[0]?.url}
                size="lg"
                roles={post.user?.roles}
                subscriptionPlan={post.user?.subscriptionPlan}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[var(--color-primary)]">{userName(post)}</p>
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
                <p className="text-xs text-[var(--color-muted)]">{new Date(post.createdAt).toLocaleDateString('ar-SA')}</p>
              </div>
            </Link>
            {post.user?.id === user?.id && !editing && (
              <button onClick={startEdit} className="text-xs text-blue-400 hover:text-blue-600">تعديل</button>
            )}
          </div>

          {editing ? (
            <div className="mb-4">
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
                      {isVideoUrl(url) ? (
                        <video src={photoUrl(url)} className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]" />
                      ) : (
                        <img src={photoUrl(url)} alt="" className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]" />
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
                <select value={post.privacy} onChange={(e) => setPost({ ...post, privacy: e.target.value })} className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-muted)] bg-[var(--color-surface)]">
                  <option value="PUBLIC">عام</option>
                  <option value="CONNECTIONS">المتابعين</option>
                  <option value="PRIVATE">خاص</option>
                </select>
                <div className="flex gap-2 mr-auto">
                  <button onClick={handleSaveEdit} disabled={submitting || !editContent.trim()} className="px-4 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50">
                    {submitting ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button onClick={cancelEdit} className="px-4 py-1.5 border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text)] leading-relaxed mb-4 whitespace-pre-wrap">{renderRichText(post.content, post.mentions)}</p>
              {post.mediaUrls?.length > 0 && (
                <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}>
                  {post.mediaUrls.map((url: string, i: number) => (
                    isVideoUrl(url) ? (
                      <video key={i} src={photoUrl(url)} controls className="rounded-lg w-full max-h-[80vh] object-contain bg-gray-100 dark:bg-gray-800" />
                    ) : (
                      <img key={i} src={photoUrl(url)} alt="" loading="lazy" decoding="async" className="rounded-lg w-full max-h-[80vh] object-contain bg-gray-100 dark:bg-gray-800 cursor-pointer" onClick={() => setViewerImg(photoUrl(url))} />
                    )
                  ))}
                </div>
              )}
              {post.sharedPost && (
                <div className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] p-4 mb-4">
                  <Link to={`/social/post/${post.sharedPost.id}`} className="block">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar
                        photo={post.sharedPost.user?.avatarUrl || post.sharedPost.user?.profile?.photos?.[0]?.url}
                        size="sm"
                        roles={post.sharedPost.user?.roles}
                        subscriptionPlan={post.sharedPost.user?.subscriptionPlan}
                      />
                      <span className="text-sm font-semibold text-[var(--color-primary)]">{userName(post.sharedPost)}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{post.sharedPost.content}</p>
                    {post.sharedPost.mediaUrls?.length > 0 && (
                      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: post.sharedPost.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}>
                        {post.sharedPost.mediaUrls.map((url: string, i: number) => (
                          isVideoUrl(url) ? (
                          <video key={i} src={photoUrl(url)} controls className="rounded-lg w-full max-h-48 object-contain bg-gray-100 dark:bg-gray-800" />
                        ) : (
                          <img key={i} src={photoUrl(url)} alt="" loading="lazy" decoding="async" className="rounded-lg w-full max-h-48 object-contain bg-gray-100 dark:bg-gray-800 cursor-pointer" onClick={() => setViewerImg(photoUrl(url))} />
                          )
                        ))}
                      </div>
                    )}
                  </Link>
                </div>
              )}
            </>
          )}

        <div className="flex items-center gap-6 pt-4 border-t border-[var(--color-border)]">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked?.[0] || post.liked ? 'text-red-500' : 'text-[var(--color-muted)] hover:text-red-500'}`}>
            <svg className="w-5 h-5" fill={post.liked?.[0] || post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post._count.likes} {t('social.like')}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post._count.comments} {t('social.comment')}
          </span>
          <button onClick={() => setSharing(!sharing)} className={`flex items-center gap-1.5 text-sm transition-colors ${sharing ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">إعادة نشر</span>
          </button>
          <button onClick={copyLink} className="mr-auto flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            {copied ? (
              <span className="text-green-500 text-xs">تم النسخ!</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">{t('social.share') || 'مشاركة'}</span>
              </>
            )}
          </button>
        </div>
        {sharing && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <textarea
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              placeholder="أضف تعليقك (اختياري)"
              className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] h-20 mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={sharingSubmitting}
                className="px-4 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50"
              >
                {sharingSubmitting ? 'جاري النشر...' : 'إعادة نشر'}
              </button>
              <button
                onClick={() => { setSharing(false); setShareContent(''); }}
                className="px-4 py-1.5 border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="font-semibold text-[var(--color-primary)] mb-4">{t('social.commentsTitle')}</h3>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t('social.writeComment')}
            className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]"
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          />
          <button onClick={handleComment} disabled={submitting || !commentText.trim()}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50"
          >
            {submitting ? '...' : t('social.commentButton')}
          </button>
        </div>

        {(!post.comments || post.comments.length === 0) ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-4">{t('social.noComments')}</p>
        ) : (
          <div className="space-y-4">
            {post.comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar
                  photo={comment.user?.avatarUrl || comment.user?.profile?.photos?.[0]?.url}
                  size="sm"
                  roles={comment.user?.roles}
                  subscriptionPlan={comment.user?.subscriptionPlan}
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{userName(comment)}</p>
                    <p className="text-sm text-[var(--color-text)] mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1">
                    <span className="text-xs text-[var(--color-muted)]">{new Date(comment.createdAt).toLocaleDateString('ar-SA')}</span>
                    <button onClick={() => handleCommentLike(comment.id)} className={`flex items-center gap-1 text-xs transition-colors ${comment.likes?.length > 0 ? 'text-red-500' : 'text-[var(--color-muted)] hover:text-red-500'}`}>
                      <svg className="w-3.5 h-3.5" fill={comment.likes?.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {comment._count.likes || 0}
                    </button>
                    <button onClick={() => setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id)} className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
                      {t('social.reply') || 'رد'}
                    </button>
                    {comment.userId === user?.id && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-400 hover:text-red-600">{t('social.delete')}</button>
                    )}
                  </div>

                  {replyToCommentId === comment.id && (
                    <div className="flex gap-2 mt-2 px-1">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('social.writeReply') || 'اكتب رداً...'}
                        className="flex-1 px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-xs focus:outline-none focus:border-[var(--color-primary)]"
                        onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(comment.id)}
                      />
                      <button onClick={() => handleReplySubmit(comment.id)} disabled={replying || !replyText.trim()}
                        className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                      >
                        {replying ? '...' : t('social.send') || 'إرسال'}
                      </button>
                    </div>
                  )}

                  {comment.replies?.length > 0 && (
                    <div className="mt-2 space-y-2 pr-3 border-r-2 border-[var(--color-border)]">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2">
                          <UserAvatar
                            photo={reply.user?.avatarUrl || reply.user?.profile?.photos?.[0]?.url}
                            size="sm"
                            roles={reply.user?.roles}
                            subscriptionPlan={reply.user?.subscriptionPlan}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                              <p className="text-xs font-semibold text-[var(--color-primary)]">{userName(reply)}</p>
                              <p className="text-xs text-[var(--color-text)] mt-0.5 whitespace-pre-wrap break-words">{reply.content}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 px-1">
                              <button onClick={() => handleReplyLike(comment.id, reply.id)} className={`flex items-center gap-0.5 text-xs transition-colors ${reply.likes?.length > 0 ? 'text-red-500' : 'text-[var(--color-muted)] hover:text-red-500'}`}>
                                <svg className="w-3 h-3" fill={reply.likes?.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {reply._count.likes || 0}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {comment._count.replies > 3 && (
                        <button onClick={() => loadMoreReplies(comment.id)} className="text-xs text-[var(--color-primary)] hover:underline">
                          {t('social.viewAllReplies') || `عرض الردود كلها (${comment._count.replies})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {viewerImg && <ImageViewer src={viewerImg} onClose={() => setViewerImg(null)} />}
    </div>
  );
}
