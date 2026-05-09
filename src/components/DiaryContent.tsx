
import React, { useState, useEffect, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { motion, AnimatePresence } from 'motion/react';
import { Highlighter, X, Palette, Check, ChevronLeft } from 'lucide-react';

interface DiaryContentProps {
  content: string;
  diaryId: string;
  onUpdate: (id: string, newContent: string) => void;
  isOwner: boolean;
}

const HIGHLIGHT_COLORS = [
  { name: '노랑', color: '#FEF9C3' },
  { name: '보라', color: '#EDE9FE' },
  { name: '에메랄드', color: '#D1FAE5' },
  { name: '블루', color: '#DBEAFE' },
  { name: '로즈', color: '#FFE4E6' },
  { name: '오렌지', color: '#FFEDD5' },
];

export const DiaryContent = memo(({ content, diaryId, onUpdate, isOwner }: DiaryContentProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      BubbleMenuExtension,
    ],
    content: content,
    editable: true, 
    editorProps: {
      attributes: {
        class: `prose prose-zinc prose-sm max-w-none focus:outline-none diary-viewer-content cursor-text`,
      },
    },
  });

  // Sync content if it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const applyHighlight = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
    onUpdate(diaryId, editor.getHTML());
    setShowColorPicker(false);
  };

  const removeHighlight = () => {
    editor.chain().focus().unsetHighlight().run();
    onUpdate(diaryId, editor.getHTML());
    setShowColorPicker(false);
  };

  return (
    <div className="relative group/diary-content">
      <AnimatePresence>
        {editor && (
          <BubbleMenu 
            editor={editor} 
            className="flex items-center bg-white/90 backdrop-blur-md border border-pastel-lavender/30 rounded-2xl p-1.5 soft-shadow-lg gap-1"
          >
            {!showColorPicker ? (
              <>
                <button
                  onClick={() => setShowColorPicker(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-pastel-purple/10 text-pastel-purple transition-all"
                >
                  <Highlighter size={14} />
                  <span className="text-[10px] font-bold">형광펜</span>
                </button>
                <div className="w-px h-4 bg-zinc-100 mx-1" />
                <button
                  onClick={removeHighlight}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-400 transition-all"
                  title="강조 제거"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                className="flex items-center gap-1.5 px-1"
              >
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => applyHighlight(c.color)}
                    className="w-6 h-6 rounded-lg transition-transform hover:scale-125 border border-black/5"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
                <div className="w-px h-4 bg-zinc-100 mx-1" />
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
              </motion.div>
            )}
          </BubbleMenu>
        )}
      </AnimatePresence>

      <EditorContent editor={editor} />

      <style>{`
        .diary-viewer-content mark {
          border-radius: 0.125rem;
          padding: 0 0.1rem;
        }
        .diary-viewer-content {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
});

DiaryContent.displayName = 'DiaryContent';
