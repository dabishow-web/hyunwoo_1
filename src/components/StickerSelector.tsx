import React, { useRef } from "react";
import { StickerType } from "../../types";
import { motion } from "motion/react";
import { useStore } from "../store";

const STICKER_DATA: Record<StickerType, { emoji: string; label: string }> = {
  WELL_DONE: { emoji: "💮", label: "참잘했어요" },
  OKAY: { emoji: "👌", label: "괜찮아요" },
  THUMBS_UP: { emoji: "👍", label: "엄지척" },
  LOVE: { emoji: "❤️", label: "사랑해요" },
  SHOUT: { emoji: "📢", label: "버럭" },
  ANGRY: { emoji: "😡", label: "화났어요" },
  LAUGH: { emoji: "😆", label: "웃겨요" },
  CRY: { emoji: "😢", label: "슬퍼요" },
  SURPRISE: { emoji: "😲", label: "놀랐어요" },
  PARTY: { emoji: "🥳", label: "축하해요" },
  SICK: { emoji: "🤒", label: "아파요" },
  SLEEPY: { emoji: "😴", label: "졸려요" },
  STAR: { emoji: "🌟", label: "반짝반짝" },
  WINK: { emoji: "😉", label: "찡긋" },
  HEART_EYES: { emoji: "😍", label: "넘좋아요" },
  COOL: { emoji: "😎", label: "멋져요" },
  CALM: { emoji: "😌", label: "평온해요" },
  THINK: { emoji: "🤔", label: "고민중" },
};

interface StickerSelectorProps {
  onSelect: (type: StickerType) => void;
  onClose: () => void;
}

export const StickerSelector: React.FC<StickerSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className="absolute bottom-full left-0 mb-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-pastel-lavender/30 p-4 z-50 flex flex-wrap gap-2 w-64 max-h-60 overflow-y-auto custom-scrollbar"
    >
      <div className="fixed inset-0 z-[-1]" onClick={onClose} />
      {(Object.keys(STICKER_DATA) as StickerType[]).map((type) => (
        <button
          key={type}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(type);
          }}
          className="group flex flex-col items-center gap-1 p-1.5 hover:bg-pastel-sand/50 rounded-xl transition-all hover:scale-110 active:scale-95"
          title={STICKER_DATA[type].label}
        >
          <span className="text-xl drop-shadow-sm">
            {STICKER_DATA[type].emoji}
          </span>
          <span className="text-[7px] font-bold text-zinc-400 group-hover:text-pastel-purple whitespace-nowrap uppercase tracking-tighter">
            {STICKER_DATA[type].label.length > 4
              ? STICKER_DATA[type].label.slice(0, 4) + ".."
              : STICKER_DATA[type].label}
          </span>
        </button>
      ))}
    </motion.div>
  );
};

interface StickerDisplayProps {
  diaryId: string;
  stickers: any[];
  users: any[];
}

export const StickerDisplay: React.FC<StickerDisplayProps> = ({
  diaryId,
  stickers,
  users,
}) => {
  const { removeDiarySticker, currentUser } = useStore();

  if (!stickers || stickers.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 items-center ml-2">
      {stickers.map((s, idx) => (
        <motion.div
          key={s.id || `sticker-${idx}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative group"
        >
          <span
            className="text-xl sm:text-2xl drop-shadow-sm block cursor-default hover:scale-110 transition-transform"
            title={STICKER_DATA[s.type as StickerType]?.label}
          >
            {STICKER_DATA[s.type as StickerType]?.emoji}
          </span>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-zinc-800/90 backdrop-blur-sm text-white text-[9px] py-1.5 px-2.5 rounded-xl whitespace-nowrap z-[60] flex flex-col items-center shadow-lg">
            <span className="font-bold flex items-center gap-1.5 text-[8px]">
              {users.find((u) => u.id === s.userId)?.name}
              <span className="text-zinc-400 font-medium">
                ({STICKER_DATA[s.type as StickerType]?.label})
              </span>
            </span>
            {currentUser?.id === s.userId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeDiarySticker(diaryId, s.id);
                }}
                className="mt-1.5 px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded hover:bg-rose-500/40 pointer-events-auto text-[7px] font-bold"
              >
                삭제
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
