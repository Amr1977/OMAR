import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Picker from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [vh] = useState(() => window.innerHeight);
  const pickerHeight = Math.min(vh - 120, 420);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div ref={ref} className="relative rounded-2xl border border-[var(--color-border)] shadow-2xl" dir="ltr" onClick={e => e.stopPropagation()}>
        <Picker
          onEmojiClick={({ emoji }) => {
            onSelect(emoji);
            onClose();
          }}
          searchPlaceholder="بحث..."
          width={320}
          height={pickerHeight}
        />
      </div>
    </div>,
    document.body
  );
}
