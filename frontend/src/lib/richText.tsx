import { Link } from 'react-router-dom';

export const renderRichText = (content: string): React.ReactNode => {
  if (!content) return null;
  const parts = content.split(/(#[\u0600-\u06FFa-zA-Z0-9_]+|@[\u0600-\u06FFa-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1).toLowerCase();
      return <Link key={i} to={`/social/hashtag/${tag}`} className="text-[var(--color-primary)] hover:underline font-medium">{part}</Link>;
    }
    if (part.startsWith('@')) {
      return <span key={i} className="text-blue-500 font-medium cursor-pointer hover:underline">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
};
