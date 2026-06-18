import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { photoUrl, isVideoUrl, isAudioUrl } from '../lib/api';
import { renderRichText } from '../lib/richText';
import UserAvatar from './UserAvatar';
import ImageViewer from './ImageViewer';
import EmojiPicker from './EmojiPicker';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onLike: (postId: string, emoji: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string, content?: string) => Promise<void>;
  onDelete: (postId: string) => void;
  onPin?: (postId: string) => void;
  onReport: (postId: string) => void;
  onCopyLink: (postId: string) => void;
}

const privacyLabels: Record<string, string> = {
  PUBLIC: 'عام',
  PRIVATE: 'خاص',
  CONNECTIONS: 'المتابعين',
  SELECTED: 'مختار',
};

const userName = (p: any) =>
  p.user?.profile?.displayName ||
  p.user?.roles?.find((r: string) => r !== 'SOCIAL') ||
  p.user?.roles?.[0] ||
  '';

export default function PostCard({ post, currentUserId, onLike, onSave, onShare, onDelete, onPin, onReport, onCopyLink }: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverReaction, setHoverReaction] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [sharingSubmitting, setSharingSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewerImg, setViewerImg] = useState<string | null>(null);

  const isOwn = post.user?.id === currentUserId;

  const handleShare = async () => {
    setSharingSubmitting(true);
    try {
      await onShare(post.id, shareContent || undefined);
      setSharing(false);
      setShareContent('');
    } catch {
      setSharingSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    onCopyLink(post.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPremium = post.user?.subscriptionPlan === 'PREMIUM';

  return (
    <>
      <div className={`bg-[var(--color-surface)] rounded-xl border p-4 ${
        isPremium
          ? 'border-[#DAA520]/40 shadow-[0_0_12px_rgba(218,165,32,0.08)]'
          : 'border-[var(--color-border)]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Link
            to={isOwn ? '/profile/my' : `/social/user/${post.user.id}`}
            className="flex items-center gap-3"
          >
            <UserAvatar
              photo={post.user.avatarUrl || post.user.profile?.photos?.[0]?.url}
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
              <p className="text-xs text-[var(--color-muted)]">
                {post.isPinned && '📌 '}
                {new Date(post.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </Link>
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
        <Link to={`/social/post/${post.id}`}>
          {post.content && (
            <p className="text-sm text-[var(--color-text)] leading-relaxed mb-3 whitespace-pre-wrap">
              {renderRichText(post.content, post.mentions)}
            </p>
          )}

          {/* Media */}
          {post.mediaUrls?.length > 0 && (
            <div
              className="grid gap-2 mb-3"
              style={{ gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}
            >
              {post.mediaUrls.map((url: string, i: number) =>
                isVideoUrl(url) ? (
                  <video key={i} src={photoUrl(url)} controls className="rounded-lg w-full max-h-[70vh] object-contain bg-gray-100 dark:bg-gray-800" />
                ) : isAudioUrl(url) ? (
                  <audio key={i} src={photoUrl(url)} controls className="w-full mt-1" />
                ) : (
                  <img
                    key={i}
                    src={photoUrl(url)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="rounded-lg w-full max-h-[70vh] object-contain bg-gray-100 dark:bg-gray-800 cursor-pointer"
                    onClick={(e) => { e.preventDefault(); setViewerImg(photoUrl(url)); }}
                  />
                )
              )}
            </div>
          )}

          {/* Shared post */}
          {post.sharedPost && (
            <div className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] p-3 mb-3" onClick={(e) => e.preventDefault()}>
              <Link to={`/social/post/${post.sharedPost.id}`} className="block">
                <div className="flex items-center gap-2 mb-2">
                  <UserAvatar
                    photo={post.sharedPost.user?.avatarUrl || post.sharedPost.user?.profile?.photos?.[0]?.url}
                    size="sm"
                    roles={post.sharedPost.user?.roles}
                    subscriptionPlan={post.sharedPost.user?.subscriptionPlan}
                  />
                  <span className="text-xs font-semibold text-[var(--color-primary)]">
                    {post.sharedPost.user?.profile?.displayName || ''}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{post.sharedPost.content}</p>
                {post.sharedPost.mediaUrls?.length > 0 && (
                  <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: post.sharedPost.mediaUrls.length > 1 ? '1fr 1fr' : '1fr' }}>
                    {post.sharedPost.mediaUrls.map((url: string, i: number) =>
                      isVideoUrl(url) ? (
                        <video key={i} src={photoUrl(url)} controls className="rounded-lg w-full max-h-48 object-contain bg-gray-100 dark:bg-gray-800" />
                      ) : isAudioUrl(url) ? (
                        <audio key={i} src={photoUrl(url)} controls className="w-full mt-1" />
                      ) : (
                        <img key={i} src={photoUrl(url)} alt="" loading="lazy" decoding="async" className="rounded-lg w-full max-h-48 object-contain bg-gray-100 dark:bg-gray-800 cursor-pointer" onClick={(e) => { e.preventDefault(); setViewerImg(photoUrl(url)); }} />
                      )
                    )}
                  </div>
                )}
              </Link>
            </div>
          )}
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1 relative"
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = setTimeout(() => setHoverReaction(true), 300);
            }}
            onMouseLeave={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = setTimeout(() => setHoverReaction(false), 600);
            }}
          >
            {post.reactions?.map((r: any) => (
              <button key={r.emoji} onClick={() => onLike(post.id, r.emoji)}
                className={`text-sm px-1.5 py-0.5 rounded-lg transition-colors ${r.reacted ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {r.emoji}<span className="text-xs mr-0.5">{r.count}</span>
              </button>
            ))}
            <button onClick={() => { if (!hoverReaction) { setHoverReaction(true); } else { setHoverReaction(false); } }} className="text-sm px-1.5 py-0.5 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700">+</button>
            {hoverReaction && (
              <EmojiPicker
                onSelect={(emoji) => { onLike(post.id, emoji); setHoverReaction(false); }}
                onClose={() => setHoverReaction(false)}
              />
            )}
          </div>
          <Link
            to={`/social/post/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post._count?.comments ?? 0}
          </Link>
          <button
            onClick={() => onSave(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${post.saves?.[0] ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'}`}
          >
            <svg className="w-4 h-4" fill={post.saves?.[0] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={() => setSharing(s => !s)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${sharing ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">إعادة نشر</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            {copied ? (
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
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-10 min-w-[140px]" dir="rtl">
                {isOwn ? (
                  <>
                    {onPin && (
                      <button
                        onClick={() => { onPin(post.id); setMenuOpen(false); }}
                        className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-xl"
                      >
                        {post.isPinned ? 'إلغاء التثبيت' : 'تثبيت المنشور'}
                      </button>
                    )}
                    <Link
                      to={`/social/post/${post.id}`}
                      className="block w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      تعديل
                    </Link>
                    <button
                      onClick={() => { onDelete(post.id); setMenuOpen(false); }}
                      className="w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-xl"
                    >
                      حذف
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { onReport(post.id); setMenuOpen(false); }}
                    className="w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    إبلاغ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Share dialog */}
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

      {viewerImg && <ImageViewer src={viewerImg} onClose={() => setViewerImg(null)} />}
    </>
  );
}
