import { Link } from 'react-router-dom';

interface Mention {
  userId: string;
  user?: { profile?: { displayName?: string } };
}

export const renderRichText = (content: string, mentions?: Mention[]): React.ReactNode => {
  if (!content) return null;
  const mentionMap = new Map<string, string>();
  mentions?.forEach(m => {
    const name = m.user?.profile?.displayName;
    if (name) mentionMap.set(name.toLowerCase(), m.userId);
  });
  const parts = content.split(/(#[\u0600-\u06FFa-zA-Z0-9_]+|@[\u0600-\u06FFa-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('#')) {
      const tag = part.slice(1).toLowerCase();
      return <Link key={i} to={`/social/hashtag/${tag}`} className="text-[var(--color-primary)] hover:underline font-medium" onClick={e => e.stopPropagation()}>{part}</Link>;
    }
    if (part.startsWith('@')) {
      const name = part.slice(1).toLowerCase();
      const userId = mentionMap.get(name);
      if (userId) {
        return <Link key={i} to={`/social/user/${userId}`} className="text-blue-500 font-medium hover:underline" onClick={e => e.stopPropagation()}>{part}</Link>;
      }
      return <span key={i} className="text-blue-500 font-medium">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
};
