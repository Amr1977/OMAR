import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, photoUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import ImageViewer from '../../components/ImageViewer';

const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#D8F3DC" rx="20"/><text x="20" y="26" text-anchor="middle" fill="#1B4332" font-size="16" font-weight="bold">?</text></svg>');

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
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    api.social.getPost(id).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [id]);

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

  const avatar = (p: any) => photoUrl(p.user?.profile?.photos?.[0]?.url) || DEFAULT_AVATAR;
  const userName = (p: any) => p.user?.profile?.displayName || p.user?.role || t('social.anonymous');

  if (loading) return <div className="text-center py-8 text-[var(--color-muted)]">{t('common.loading')}</div>;
  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/social" className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block">&larr; {t('social.back')}</Link>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/profile/my" className="flex items-center gap-3">
              <img src={avatar(post)} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">{userName(post)}</p>
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
              <p className="text-sm text-[var(--color-text)] leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
              {post.mediaUrls?.length > 0 && (
                <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}>
                  {post.mediaUrls.map((url: string, i: number) => (
                    url.startsWith('data:video/') ? (
                      <video key={i} src={url} controls className="rounded-lg w-full h-64 object-cover" />
                    ) : (
                      <img key={i} src={url} alt="" className="rounded-lg w-full h-64 object-cover cursor-pointer" onClick={() => setViewerImg(url)} />
                    )
                  ))}
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
        </div>
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
                <img src={avatar(comment)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{userName(comment)}</p>
                    <p className="text-sm text-[var(--color-text)] mt-1">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1">
                    <span className="text-xs text-[var(--color-muted)]">{new Date(comment.createdAt).toLocaleDateString('ar-SA')}</span>
                    {comment.userId === user?.id && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-400 hover:text-red-600">{t('social.delete')}</button>
                    )}
                  </div>
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
