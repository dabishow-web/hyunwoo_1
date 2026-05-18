
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, Minus, 
  Type, Palette, ChevronRight, Check, AlignLeft, AlignCenter, 
  AlignRight, Highlighter, Quote as QuoteIcon, Info, ListOrdered, Sparkles, X, ChevronLeft,
  AlertCircle, Heart
} from 'lucide-react';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, placeholder, className }) => {
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const lastContent = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Ensure defaults are solid
        bulletList: {},
        orderedList: {},
        blockquote: {},
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      BubbleMenuExtension,
      Placeholder.configure({
        placeholder: placeholder || '이곳을 클릭하여 기록을 시작하세요...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== lastContent.current) {
        lastContent.current = html;
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-zinc prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-[500px] cursor-text diary-container',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && content !== lastContent.current) {
      editor.commands.setContent(content);
      lastContent.current = content;
    }
  }, [content, editor]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  useEffect(() => {
    const handleClick = () => closeMenu();
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [closeMenu]);

  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  if (!editor) return null;

  const quickHighlighters = [
    { name: '노랑', color: '#FEF9C3' },
    { name: '보라', color: '#EDE9FE' },
    { name: '에메랄드', color: '#D1FAE5' },
    { name: '로즈', color: '#FFE4E6' },
  ];

  const colors = [
    { name: '기본', value: 'inherit' },
    { name: '보라', value: '#A78BFA' },
    { name: '로즈', value: '#FB7185' },
    { name: '에메랄드', value: '#34D399' },
    { name: '블루', value: '#60A5FA' },
    { name: '오렌지', value: '#FB923C' },
    { name: '그레이', value: '#94A3B8' },
  ];

  const bgColors = [
    { name: '없음', value: 'transparent' },
    { name: '노랑 배경', value: '#FEF9C3' },
    { name: '보라 배경', value: '#EDE9FE' },
    { name: '에메랄드 배경', value: '#D1FAE5' },
    { name: '블루 배경', value: '#DBEAFE' },
    { name: '로즈 배경', value: '#FFE4E6' },
  ];

  return (
    <div 
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <AnimatePresence>
        {editor && (
          <BubbleMenu 
            editor={editor} 
            className="flex items-center bg-white/95 backdrop-blur-xl border border-zinc-100 rounded-2xl p-1.5 shadow-2xl gap-1 shrink-0"
          >
            {!showHighlightMenu ? (
              <>
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded-xl transition-all ${editor.isActive('bold') ? 'bg-pastel-purple/10 text-pastel-purple' : 'hover:bg-zinc-50 text-zinc-400'}`}
                >
                  <Bold size={14} />
                </button>
                <div className="w-px h-4 bg-zinc-50 mx-1" />
                <button
                  onClick={() => setShowHighlightMenu(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-pastel-purple/10 text-pastel-purple transition-all"
                >
                  <Highlighter size={14} />
                  <span className="text-[10px] font-bold">형광펜</span>
                </button>
                <button
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-300 transition-all"
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
                {quickHighlighters.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => { editor.chain().focus().setHighlight({ color: c.color }).run(); setShowHighlightMenu(false); }}
                    className="w-6 h-6 rounded-lg transition-transform hover:scale-125 border border-zinc-50"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <div className="w-px h-4 bg-zinc-50 mx-1" />
                <button
                  onClick={() => setShowHighlightMenu(false)}
                  className="p-1 rounded-lg hover:bg-zinc-50 text-zinc-400"
                >
                  <ChevronLeft size={14} />
                </button>
              </motion.div>
            )}
          </BubbleMenu>
        )}
      </AnimatePresence>

      <div className="h-full overflow-y-auto custom-scrollbar p-0.5 relative writing-canvas">
        <EditorContent editor={editor} className="relative z-10 px-4" />
      </div>

      {/* Modern Context Menu (Notion Inspired) */}
      <AnimatePresence>
        {menuPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            style={{ 
              position: 'fixed', 
              top: Math.min(menuPosition.y, window.innerHeight - 560), 
              left: Math.min(menuPosition.x, window.innerWidth - 260),
              zIndex: 1000 
            }}
            className="bg-white/95 backdrop-blur-3xl border border-zinc-100 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-4 min-w-[260px] flex flex-col gap-2 overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-2.5 text-[11px] font-black text-zinc-300 uppercase tracking-[0.25em] border-b border-zinc-50 mb-1 flex justify-between items-center">
              <span>스토리 편집기</span>
              <Sparkles size={14} className="text-pastel-purple animate-pulse" />
            </div>

            {/* Quick Tools */}
            <div className="grid grid-cols-3 gap-2 px-1">
               {[
                 { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: 'bold', label: '굵게' },
                 { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: 'italic', label: '기울기' },
                 { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: 'underline', label: '밑줄' },
               ].map((item, idx) => (
                 <button 
                   key={idx} type="button"
                   onClick={() => { item.action(); closeMenu(); }}
                   className={`flex flex-col items-center gap-2 p-3.5 rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-95 ${editor.isActive(item.active) ? 'bg-pastel-purple/20 text-pastel-purple ring-1 ring-pastel-purple/30 shadow-sm' : 'hover:bg-zinc-50 text-zinc-400'}`}
                 >
                   <item.icon size={18} />
                   <span className="text-[10px] font-bold">{item.label}</span>
                 </button>
               ))}
            </div>

            <div className="h-px bg-zinc-50 my-2" />

            {/* Submenus (Styles, Blocks, Lists) */}
            {[
              { icon: Type, label: '텍스트 레이아웃', submenu: [
                { label: '본문 텍스트', action: () => editor.chain().focus().setParagraph().run() },
                { label: '큰 제목 (H1)', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
                { label: '중간 제목 (H2)', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
                { label: '작은 제목 (H3)', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
              ]},
              { icon: QuoteIcon, label: '인용 및 콜아웃', submenu: [
                { label: '일반 인용구', action: () => editor.chain().focus().toggleBlockquote().run() },
                { label: '강조 콜아웃', action: () => editor.chain().focus().toggleBlockquote().run() }, // We'll style it to look like callout
                { label: '수평 구분선', action: () => editor.chain().focus().setHorizontalRule().run() },
              ]},
              { icon: List, label: '리스트 형식', submenu: [
                { label: '불렛 목록 (ul)', action: () => editor.chain().focus().toggleBulletList().run() },
                { label: '번호 목록 (ol)', action: () => editor.chain().focus().toggleOrderedList().run() },
              ]},
              { icon: Palette, label: '글자/배경 테마', submenu: [
                ...colors.map(c => ({ label: c.name, action: () => editor.chain().focus().setColor(c.value).run(), color: c.value })),
                { divider: true },
                ...bgColors.map(c => ({ label: `배경: ${c.name}`, action: () => editor.chain().focus().setHighlight({ color: c.value }).run(), bgColor: c.value })),
              ]},
              { icon: AlignCenter, label: '정렬 설정', submenu: [
                { label: '왼쪽 정렬', action: () => editor.chain().focus().setTextAlign('left').run() },
                { label: '가운데 정렬', action: () => editor.chain().focus().setTextAlign('center').run() },
                { label: '오른쪽 정렬', action: () => editor.chain().focus().setTextAlign('right').run() },
              ]}
            ].map((item, idx) => (
              <div key={idx} className="group/item relative px-1">
                <button className="w-full flex items-center justify-between px-5 py-3 rounded-[1.25rem] text-[13px] font-bold text-zinc-500 hover:bg-zinc-50 transition-all group-hover/item:text-pastel-purple">
                  <div className="flex items-center gap-4">
                    <item.icon size={18} className="text-zinc-300 group-hover/item:text-pastel-purple/60" /> {item.label}
                  </div>
                  <ChevronRight size={16} className="text-zinc-200 group-hover/item:translate-x-1 transition-transform" />
                </button>
                <div className="absolute left-[calc(100%-12px)] top-0 ml-3 hidden group-hover/item:flex flex-col gap-1 bg-white border border-zinc-100 shadow-[20px_20px_60px_rgba(0,0,0,0.08)] rounded-[2rem] p-3.5 min-w-[190px] animate-in slide-in-from-left-4 duration-300">
                  {item.submenu?.map((sub: any, sIdx) => (
                    sub.divider ? <div key={sIdx} className="h-px bg-zinc-50 my-1.5 mx-2" /> : (
                      <button 
                        key={sIdx} type="button"
                        onClick={() => { sub.action(); closeMenu(); }}
                        className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-[12px] font-bold text-zinc-400 hover:bg-zinc-50 hover:text-pastel-purple transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {sub.color && <div className="w-3.5 h-3.5 rounded-full border border-zinc-100/50 shadow-sm" style={{ backgroundColor: sub.color === 'inherit' ? '#000' : sub.color }} />}
                          {sub.bgColor && <div className="w-3.5 h-3.5 rounded-lg border border-zinc-100/50 shadow-sm" style={{ backgroundColor: sub.bgColor }} />}
                          {sub.label}
                        </div>
                      </button>
                    )
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Global Editor Styles */
        .diary-container { padding-bottom: 250px !important; }
        .ProseMirror { min-height: 500px; outline: none !important; }
        
        /* Tiptap List Formatting Fixes */
        .prose ul, .prose ol {
          padding-left: 2rem !important;
          margin-top: 1rem !important;
          margin-bottom: 1rem !important;
          display: block !important;
        }
        .prose ul { list-style-type: disc !important; }
        .prose ol { list-style-type: decimal !important; }
        .prose li { display: list-item !important; margin: 0.4rem 0 !important; }
        
        /* Notion Style Quote & Callout */
        .prose blockquote {
          font-style: normal !important;
          border-left: 5px solid #D4C6F0 !important;
          padding: 1.5rem 2rem !important;
          background-color: #F8F7FC !important;
          border-radius: 1.25rem !important;
          color: #52525b !important;
          margin: 2.5rem 0 !important;
          quotes: none !important;
          position: relative;
        }
        .prose blockquote::before {
          content: '"';
          position: absolute;
          top: 0.5rem;
          left: 0.75rem;
          font-size: 2rem;
          font-family: serif;
          color: #D4C6F0;
          opacity: 0.3;
        }
        .prose blockquote p:first-of-type::before { content: none !important; }
        .prose blockquote p:last-of-type::after { content: none !important; }

        /* Modern Horizontal Rule */
        .prose hr {
          margin: 4.5em 0 !important;
          border: 0 !important;
          border-top: 2px solid #FAF9F7 !important;
          background: linear-gradient(to right, transparent, #FAF9F7, transparent) !important;
        }

        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #e4e4e7;
          pointer-events: none;
          height: 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
      `}</style>
    </div>
  );
};
