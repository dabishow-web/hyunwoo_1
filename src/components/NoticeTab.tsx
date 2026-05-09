
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Plus, Calendar, User, MessageSquare, 
  Trash2, Edit3, Image as ImageIcon, X, Send, 
  ArrowRight, Sparkles, ChevronRight, Hash,
  Video, Heart, Eye
} from 'lucide-react';
import { useStore } from '../store';
import { auth } from '../firebase';
import { UserAvatar } from './UserAvatar';
import { Notice } from '../../types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { BubbleMenu } from '@tiptap/react/menus';

export const NoticeTab: React.FC = () => {
  const { 
    notices, addNotice, updateNotice, deleteNotice, 
    toggleNoticeLike, addNoticeComment, incrementNoticeViewCount,
    currentUser, users 
  } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: '블로그처럼 자유롭게 글을 작성해보세요. 이미지도 직접 붙여넣거나 업로드할 수 있습니다...',
      }),
    ],
    content: '',
  });

  const CREATOR_EMAIL = 'dabishow8586@gmail.com';
  const isCreator = auth.currentUser?.email === CREATOR_EMAIL;

  // Simple view count increment on mount
  useEffect(() => {
    notices.forEach(notice => {
        // In a real app we might use a ref to only increment once per session
        // but for this demo render increment is fine
        incrementNoticeViewCount(notice.id);
    });
  }, [notices.length]); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editor) return;
    const contentHtml = editor.getHTML();
    if (!title.trim() || !contentHtml || contentHtml === '<p></p>') return;

    setIsSubmitting(true);
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    // Check content size for Firestore limit (approx 1MB)
    if (contentHtml.length > 800000) {
      alert("글의 용량이 너무 큽니다. 이미지 개수를 줄이거나 크기를 조절해 주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        await updateNotice(isEditing, { 
          title, 
          content: contentHtml, 
          imageUrl: imageUrl || undefined, 
          videoUrl: videoUrl || undefined,
          tags: tagArray 
        });
        setIsEditing(null);
      } else {
        await addNotice({
          title,
          content: contentHtml,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          tags: tagArray,
          likes: [],
          viewCount: 0,
          createdAt: new Date().toISOString(),
          authorId: currentUser.id,
          authorName: currentUser.name,
          communityId: currentUser.communityId || ''
        });
        setIsAdding(false);
      }
      setTitle('');
      editor.commands.setContent('');
      setImageUrl('');
      setVideoUrl('');
      setTags('');
    } catch (error) {
      console.error("Notice error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (notice: Notice) => {
    setTitle(notice.title);
    editor?.commands.setContent(notice.content);
    setImageUrl(notice.imageUrl || '');
    setVideoUrl(notice.videoUrl || '');
    setTags(notice.tags?.join(', ') || '');
    setIsEditing(notice.id);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setIsEditing(null);
    setTitle('');
    editor?.commands.setContent('');
    setImageUrl('');
    setVideoUrl('');
    setTags('');
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      if (file.size > 500000) {
        alert("파일 크기가 너무 큽니다 (최대 500KB 권장).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (file.type.startsWith('image/')) {
          editor.chain().focus().setImage({ src: base64 }).run();
        } else if (file.type.startsWith('video/')) {
          // Simplistic way to handle video: we append a video tag as HTML
          // Tiptap image extension handles images well, but for video we need custom node
          // Or just use base64 in a video tag via raw HTML command
          editor.chain().focus().insertContent(`<video src="${base64}" controls style="max-width: 100%; border-radius: 1rem; margin: 1rem 0;"></video>`).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto px-4 md:px-0">
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-purple/10 rounded-full text-pastel-purple">
            <Megaphone size={14} className="animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Latest Updates & Blog</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-pastel-text tracking-tighter">
            우리들의 <span className="text-pastel-purple">이야기</span>
          </h1>
          <p className="text-sm text-zinc-400 font-medium max-w-md leading-relaxed">
            공동체의 소식과 소소한 일상을 블로그처럼 기록하고 공유합니다.
          </p>
        </div>

        {isCreator && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 px-8 py-5 bg-zinc-900 text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-zinc-200 hover:-translate-y-1 transition-all active:scale-95 group shrink-0"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            글 작성하기
          </button>
        )}
      </header>

      {/* Editor Modal/Section */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="p-8 md:p-12 bg-white rounded-[3rem] shadow-2xl shadow-zinc-200/50 border border-pastel-lavender/10 space-y-8 relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-pastel-sand/30 rounded-full blur-3xl opacity-50"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pastel-purple rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pastel-purple/20">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-pastel-text">{isEditing ? '글 수정하기' : '새로운 글 작성'}</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Creative Moment</p>
                </div>
              </div>
              <button 
                onClick={cancelEdit}
                className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-rose-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-2">Title</label>
                <input 
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-8 py-6 bg-zinc-50/50 border border-zinc-100 rounded-[2rem] text-lg font-bold outline-none focus:bg-white focus:ring-4 focus:ring-pastel-purple/10 transition-all placeholder:text-zinc-300"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-2">Content</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-pastel-purple/10 text-pastel-purple rounded-xl cursor-pointer hover:bg-pastel-purple/20 transition-all">
                    <ImageIcon size={14} />
                    <span className="text-[10px] font-bold">이미지/동영상 업로드</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={onFileUpload}
                    />
                  </label>
                </div>
                
                <div className="bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] overflow-hidden focus-within:bg-white focus-within:ring-4 focus-within:ring-pastel-purple/10 transition-all">
                  <div className="flex items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-100 mb-2">
                    <button 
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-2 rounded-lg hover:bg-white transition-all ${editor?.isActive('bold') ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-400'}`}
                    >
                      B
                    </button>
                    <button 
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-2 rounded-lg hover:bg-white transition-all ${editor?.isActive('italic') ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-400'}`}
                    >
                      I
                    </button>
                    <button 
                      type="button"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={`p-2 rounded-lg hover:bg-white transition-all ${editor?.isActive('underline') ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-400'}`}
                    >
                      U
                    </button>
                  </div>
                  <EditorContent 
                    editor={editor} 
                    className="px-8 py-8 min-h-[400px] prose prose-zinc prose-sm max-w-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-2">Main YouTube/Video URL (Optional)</label>
                  <div className="relative">
                    <input 
                      type="url"
                      placeholder="대표 유튜브 링크가 있으면 입력하세요"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full pl-14 pr-8 py-5 bg-zinc-50/50 border border-zinc-100 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-pastel-purple/10 transition-all placeholder:text-zinc-300"
                    />
                    <Video className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-2">Tags (Comma separated)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="업데이트, 공지, 필독 (쉼표로 구분)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full pl-14 pr-8 py-5 bg-zinc-50/50 border border-zinc-100 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-pastel-purple/10 transition-all placeholder:text-zinc-300"
                    />
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                  </div>
                </div>

                <div className="flex items-end md:col-span-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-6 bg-zinc-900 text-white rounded-[2.5rem] font-black text-sm shadow-2xl shadow-zinc-300 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                  >
                    {isSubmitting ? '저장 중...' : <><Send size={18} /> {isEditing ? '수정 완료하기' : '포스팅 하기'}</>}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notices List */}
      <div className="space-y-12">
        {notices.length > 0 ? (
          notices.map((notice, index) => (
            <motion.article 
              key={notice.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex flex-col md:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
            >
              {/* Date Sideline */}
              <div className="hidden md:flex flex-col items-center pt-2 w-20 shrink-0">
                <span className="text-3xl font-black text-zinc-900 tracking-tighter">
                  {new Date(notice.createdAt).getDate().toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                  {new Date(notice.createdAt).toLocaleString('en-US', { month: 'short' })}
                </span>
                <div className="w-px h-24 bg-gradient-to-b from-zinc-200 to-transparent mt-4"></div>
              </div>

              {/* Main Content Card */}
              <div className="flex-1 bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl shadow-zinc-200/40 border border-pastel-lavender/5 group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-pastel-purple/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <header className="space-y-6 relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        name={notice.authorName} 
                        avatar={users.find(u => u.id === notice.authorId)?.avatar || '♥'} 
                        color={users.find(u => u.id === notice.authorId)?.color || '#A78BFA'}
                        size="sm"
                      />
                      <div>
                        <p className="text-[13px] font-black text-pastel-text">{notice.authorName}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Administrator</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isCreator && (
                        <div className="flex items-center gap-2 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <button 
                            onClick={() => startEdit(notice)}
                            className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-pastel-purple hover:bg-pastel-purple/5 transition-all"
                            title="수정"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('정말 삭제하시겠습니까?')) deleteNotice(notice.id);
                            }}
                            className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-rose-400 hover:bg-rose-50 transition-all"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                      
                      <div className="px-4 py-2 bg-zinc-50 rounded-full flex items-center gap-2">
                        <Calendar size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400">{new Date(notice.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-pastel-text tracking-tight group-hover:text-pastel-purple transition-colors duration-500">
                    {notice.title}
                  </h2>

                  {notice.tags && notice.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                       {notice.tags.map((tag, i) => (
                         <span key={i} className="px-3 py-1 bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-widest rounded-full border border-zinc-100 flex items-center gap-1">
                           <Hash size={10} /> {tag}
                         </span>
                       ))}
                    </div>
                  )}
                </header>

                <div className="mt-8 space-y-8 relative">
                   {/* Render Notice Content as HTML */}
                   <div 
                    className="prose prose-zinc prose-sm md:prose-base max-w-none text-zinc-500 font-medium leading-loose md:leading-extra-loose whitespace-normal blog-content-area"
                    dangerouslySetInnerHTML={{ __html: notice.content }}
                   />

                   {notice.videoUrl && (
                     <div className="space-y-6 mt-12">
                       <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-black group/video">
                          {notice.videoUrl.includes('youtube.com') || notice.videoUrl.includes('youtu.be') ? (
                            <div className="aspect-video">
                              <iframe 
                                src={`https://www.youtube.com/embed/${notice.videoUrl.split('v=')[1] || notice.videoUrl.split('/').pop()}`}
                                className="w-full h-full"
                                allowFullScreen
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <video 
                              src={notice.videoUrl} 
                              controls 
                              className="w-full max-h-[600px] object-contain"
                            />
                          )}
                          <div className="absolute inset-0 bg-pastel-purple/10 opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none"></div>
                       </div>
                     </div>
                   )}
                </div>

                <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-zinc-50 pt-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => currentUser && toggleNoticeLike(notice.id, currentUser.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${notice.likes?.includes(currentUser?.id || '') ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-zinc-50 text-zinc-400 border border-zinc-100 hover:bg-white'}`}
                    >
                      <Heart size={14} fill={notice.likes?.includes(currentUser?.id || '') ? 'currentColor' : 'none'} />
                      Like {notice.likes?.length || 0}
                    </button>
                    
                    <button 
                      onClick={() => setOpenComments(openComments === notice.id ? null : notice.id)}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-50 border border-zinc-100 text-zinc-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all"
                    >
                      <MessageSquare size={14} />
                      Comments {notice.comments?.length || 0}
                    </button>

                    <div className="px-4 py-2 bg-zinc-50/50 rounded-xl flex items-center gap-2">
                       <Eye size={12} className="text-zinc-300" />
                       <span className="text-[10px] font-black text-zinc-300">{notice.viewCount || 0} Views</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {users.slice(0, 3).map((u, i) => (
                        <div key={i} className="ring-4 ring-white rounded-full">
                          <UserAvatar name={u.name} avatar={u.avatar} color={u.color} size="sm" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Shared in Community</span>
                  </div>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {openComments === notice.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-8 space-y-6 pt-8 border-t border-zinc-50">
                        <div className="space-y-4">
                          {notice.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-4">
                              <UserAvatar 
                                name={users.find(u => u.id === comment.userId)?.name || 'User'} 
                                avatar={users.find(u => u.id === comment.userId)?.avatar || '♥'} 
                                color={users.find(u => u.id === comment.userId)?.color || '#A78BFA'}
                                size="sm"
                              />
                              <div className="flex-1 bg-zinc-50 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[11px] font-black text-pastel-text">
                                    {users.find(u => u.id === comment.userId)?.name || 'Unknown User'}
                                  </p>
                                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                                    {new Date(comment.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-4 items-end">
                           <div className="flex-1 relative">
                             <textarea 
                               placeholder="댓글을 남겨보세요..."
                               value={commentText}
                               onChange={(e) => setCommentText(e.target.value)}
                               className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-pastel-purple/10 transition-all min-h-[80px] resize-none"
                             />
                           </div>
                           <button 
                             onClick={async () => {
                               if (!commentText.trim() || !currentUser) return;
                               await addNoticeComment(notice.id, {
                                 userId: currentUser.id,
                                 text: commentText,
                                 date: new Date().toISOString()
                               });
                               setCommentText('');
                             }}
                             className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zinc-200"
                           >
                              <Send size={20} />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          ))
        ) : (
          <div className="py-40 text-center space-y-8 bg-white/50 rounded-[4rem] border-4 border-dashed border-zinc-100 animate-in fade-in duration-1000">
            <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-zinc-100 animate-pulse">
              <Megaphone size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-pastel-text">아직 등록된 공지가 없어요</h3>
              <p className="text-xs text-zinc-400 font-medium">새로운 소식을 기다려주세요!</p>
            </div>
            {isCreator && (
               <button 
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs"
               >
                 <Plus size={16} /> 첫 글 작성하기
               </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer only */}
      <footer className="pt-20 text-center pb-20">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-[10px] font-black text-pastel-purple uppercase tracking-[0.3em] hover:opacity-70 transition-opacity mx-auto"
          >
            Back to Top <ArrowRight size={14} />
          </button>
      </footer>
    </div>
  );
};
