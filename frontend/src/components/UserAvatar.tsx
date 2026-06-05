import { photoUrl } from '../lib/api';

const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#E5E7EB" width="100" height="100"/><circle fill="#9CA3AF" cx="50" cy="38" r="18"/><ellipse fill="#9CA3AF" cx="50" cy="80" rx="32" ry="22"/></svg>`
);

interface UserAvatarProps {
  photo?: string | null;
  size?: 'sm' | 'md' | 'lg';
  role?: string;
  subscriptionPlan?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const BADGE_SIZE_MAP = {
  sm: 'w-3.5 h-3.5 text-[7px]',
  md: 'w-4 h-4 text-[8px]',
  lg: 'w-5 h-5 text-[9px]',
};

export default function UserAvatar({ photo, size = 'lg', role, subscriptionPlan, className = '' }: UserAvatarProps) {
  const isPremium = subscriptionPlan === 'PREMIUM';
  const isGuardian = role === 'GUARDIAN';
  const isSocial = role === 'SOCIAL';

  const ringColor = isPremium
    ? 'ring-2 ring-[#DAA520] ring-offset-2 ring-offset-[var(--color-bg)]'
    : isGuardian
    ? 'ring-2 ring-[#2D6A4F] ring-offset-2 ring-offset-[var(--color-bg)]'
    : isSocial
    ? 'ring-2 ring-[#2563EB] ring-offset-2 ring-offset-[var(--color-bg)]'
    : '';

  const glowShadow = isPremium ? 'shadow-[0_0_12px_rgba(218,165,32,0.4)]' : '';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div className={`${SIZE_MAP[size]} rounded-full overflow-hidden ${ringColor} ${glowShadow}`}>
        <img
          src={photo ? photoUrl(photo) : DEFAULT_AVATAR}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      {isPremium && (
        <div className={`absolute -top-0.5 -right-0.5 ${BADGE_SIZE_MAP[size]} bg-[#DAA520] rounded-full flex items-center justify-center shadow-md`}>
          <svg viewBox="0 0 20 20" fill="#1B4332" className="w-full h-full p-0.5">
            <path d="M10 1l2.5 6.5L19 8.5l-5 4.5 1.5 7L10 16l-5.5 4 1.5-7-5-4.5 6.5-1z" />
          </svg>
        </div>
      )}
      {isGuardian && !isPremium && (
        <div className={`absolute -top-0.5 -right-0.5 ${BADGE_SIZE_MAP[size]} bg-[#2D6A4F] rounded-full flex items-center justify-center shadow-md`}>
          <svg viewBox="0 0 20 20" fill="white" className="w-full h-full p-0.5">
            <path d="M10 1L2 5v5c0 4.5 3.5 8.5 8 10 4.5-1.5 8-5.5 8-10V5l-8-4z" />
          </svg>
        </div>
      )}
      {isSocial && !isPremium && (
        <div className={`absolute -top-0.5 -right-0.5 ${BADGE_SIZE_MAP[size]} bg-[#2563EB] rounded-full flex items-center justify-center shadow-md`}>
          <svg viewBox="0 0 20 20" fill="white" className="w-full h-full p-0.5">
            <path d="M10 15l-5.5 3 1.5-6L1 7l6-1 3-5 3 5 6 1-4.5 5 1.5 6z" />
          </svg>
        </div>
      )}
    </div>
  );
}
