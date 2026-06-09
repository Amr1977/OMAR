import { useEffect, useState, useRef } from 'react';
import { api, photoUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import UserAvatar from '../../components/UserAvatar';

export default function StoriesBar() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.social.getStoriesFeed().then(setGroups).catch(() => {});
  }, []);

  const openGroup = (group: any) => {
    setActiveGroup(group);
    setActiveStoryIdx(0);
    setProgress(0);
    const story = group.stories[0];
    if (story) api.social.markStoryViewed(story.id).catch(() => {});
  };

  useEffect(() => {
    if (!activeGroup) return;
    clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressRef.current);
          const nextIdx = activeStoryIdx + 1;
          if (nextIdx < activeGroup.stories.length) {
            setActiveStoryIdx(nextIdx);
            setProgress(0);
            api.social.markStoryViewed(activeGroup.stories[nextIdx].id).catch(() => {});
          } else {
            setActiveGroup(null);
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(progressRef.current);
  }, [activeGroup, activeStoryIdx]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('media', file);
    try {
      const { url, mediaType } = await api.social.uploadStoryMedia(fd);
      await api.social.createStory({ mediaUrl: url, mediaType, privacy: 'FOLLOWERS' });
      const updated = await api.social.getStoriesFeed();
      setGroups(updated);
    } catch (err) {
      console.error('Story upload failed:', err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeStory = activeGroup?.stories?.[activeStoryIdx];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-2xl text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">+</div>
          <span className="text-xs text-[var(--color-muted)]">قصتك</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />

        {groups.map((group: any) => (
          <button key={group.user.id} onClick={() => openGroup(group)} className="flex flex-col items-center gap-1 shrink-0">
            <div className={`p-0.5 rounded-full ${group.hasUnviewed ? 'bg-gradient-to-tr from-[#DAA520] to-[#1B4332]' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className="bg-white dark:bg-gray-900 p-0.5 rounded-full">
                <UserAvatar photo={group.user.profile?.photos?.[0]?.url} size="lg" roles={group.user.roles} subscriptionPlan={group.user.subscriptionPlan} />
              </div>
            </div>
            <span className="text-xs text-[var(--color-text)] truncate max-w-[64px]">{group.user.profile?.displayName || '...'}</span>
          </button>
        ))}
      </div>

      {activeGroup && activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setActiveGroup(null)}>
          <div className="relative max-w-sm w-full h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
              {activeGroup.stories.map((_: any, i: number) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
                  <div className="h-full bg-white rounded transition-none" style={{ width: i < activeStoryIdx ? '100%' : i === activeStoryIdx ? `${progress}%` : '0%' }} />
                </div>
              ))}
            </div>
            <button onClick={() => setActiveGroup(null)} className="absolute top-5 right-2 z-10 text-white text-2xl">×</button>
            <div className="absolute top-6 left-2 z-10 flex items-center gap-2">
              <UserAvatar photo={activeGroup.user.profile?.photos?.[0]?.url} size="sm" roles={activeGroup.user.roles} subscriptionPlan={activeGroup.user.subscriptionPlan} />
              <span className="text-white text-sm font-medium">{activeGroup.user.profile?.displayName}</span>
            </div>
            {activeStory.mediaType === 'video' ? (
              <video src={photoUrl(activeStory.mediaUrl)} className="w-full h-full object-contain" autoPlay muted />
            ) : (
              <img src={photoUrl(activeStory.mediaUrl)} alt="" className="w-full h-full object-contain" />
            )}
            {activeStory.caption && (
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/50 text-white text-sm px-4 py-2 rounded-full">{activeStory.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
