import { useEffect, useRef } from 'react';
import Picker from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-10 left-0 z-50" dir="ltr">
      <div className="shadow-2xl rounded-2xl overflow-hidden border border-[var(--color-border)]">
        <Picker
          onEmojiClick={({ emoji }) => {
            onSelect(emoji);
            onClose();
          }}
          searchPlaceholder="بحث..."
          width={320}
          height={400}
        />
      </div>
    </div>
  );
}
