
import React, { useState, useEffect, useRef } from 'react';
import { X, BookHeart, Calendar, Clock, Tag, FileText, Send, Shield, Users, AlertCircle, MapPin, Lock, Unlock, Sparkles, Heart, Check, Quote, Info, Smile, Sunrise, MessageCircle, RefreshCcw, Save } from 'lucide-react';
import { ToastType } from '../../types';
import { RichEditor } from './RichEditor';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';

interface DiaryScheduleFormProps {
  onClose: () => void;
  onSubmit: (type: 'DIARY' | 'SCHEDULE', data: any) => Promise<void>;
  onShowToast?: (message: string, type: ToastType) => void;
  initialDate?: string;
  initialData?: any;
  mode?: 'DIARY' | 'SCHEDULE';
}

export const DiaryScheduleForm: React.FC<DiaryScheduleFormProps> = ({ onClose, onSubmit, onShowToast, initialDate, initialData, mode }) => {
  const [activeType, setActiveType] = useState<'DIARY' | 'SCHEDULE'>(mode || initialData?.type || 'DIARY');
  
  // 공통 상태
  const [title, setTitle] = useState(initialData?.title || '');
  const [text, setText] = useState(initialData?.text || initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || initialDate || new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState(initialData?.location?.address || '');
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  
  // 일정 전용 상태
  const [time, setTime] = useState(initialData?.time || '09:00');
  const [category, setCategory] = useState<'PRIVATE' | 'SHARED' | 'IMPORTANT'>(initialData?.category || 'PRIVATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isDiaryMode = activeType === 'DIARY';

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  
  const currentUser = useStore(state => state.currentUser);
  const communityId = useStore(state => state.communityId);

  const draftKey = isDiaryMode ? (
    initialData?.id 
      ? `diary_draft_${communityId}_${currentUser?.id}_${initialData.id}` 
      : `diary_draft_${communityId}_${currentUser?.id}_new`
  ) : null;

  // Track latest state in refs for interval access
  const stateRef = useRef({ title, text, date, location, isPrivate });
  useEffect(() => {
    stateRef.current = { title, text, date, location, isPrivate };
  }, [title, text, date, location, isPrivate]);

  // Check for draft on mount
  useEffect(() => {
    if (isDiaryMode && draftKey) {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          // Check if it's different from initial
          const isBasicallyEmpty = !initialData && !title && (!text || text === '<p></p>');
          const isSubstantiallyDifferent = draft.title !== (initialData?.title || '') || draft.text !== (initialData?.text || '');
          
          if (isBasicallyEmpty || isSubstantiallyDifferent) {
            setHasDraft(true);
          }
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }, [isDiaryMode, draftKey, initialData]);

  // Auto-save interval
  useEffect(() => {
    if (!isDiaryMode || !draftKey || isSubmitting) return;

    const interval = setInterval(() => {
      // Check again inside interval just in case
      if (isSubmitting) return;
      
      const { title: t, text: txt, date: d, location: l, isPrivate: p } = stateRef.current;
      
      // Don't save if absolutely empty
      if (t || (txt && txt !== '<p></p>')) {
        const draft = { title: t, text: txt, date: d, location: l, isPrivate: p, updatedAt: new Date().toISOString() };
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setLastSaved(new Date());
        console.log('Diary draft auto-saved');
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [isDiaryMode, draftKey, isSubmitting]);

  const handleRestoreDraft = () => {
    if (!draftKey) return;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setTitle(draft.title || '');
        setText(draft.text || '');
        setDate(draft.date || initialDate || new Date().toISOString().split('T')[0]);
        setLocation(draft.location || '');
        setIsPrivate(draft.isPrivate ?? false);
        setHasDraft(false);
        onShowToast?.('저장된 초안을 불러왔습니다.', 'SUCCESS');
      } catch (e) {
        onShowToast?.('초안을 불러오는데 실패했습니다.', 'ERROR');
      }
    }
  };

  const handleClearDraft = () => {
    if (draftKey) {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeType === 'DIARY') {
        if (!text) {
          onShowToast?.('일기 내용을 입력해주세요.', 'ERROR');
          return;
        }
        setIsSubmitting(true);
        const diaryData: any = { title, text, date, isPrivate };
        if (location) {
          diaryData.location = { lat: 0, lng: 0, address: location };
        }
        await onSubmit('DIARY', diaryData);
        // Clear draft on success
        if (draftKey) localStorage.removeItem(draftKey);
      } else {
        if (!title) {
          onShowToast?.('일정 제목을 입력해주세요.', 'ERROR');
          return;
        }
        setIsSubmitting(true);
        await onSubmit('SCHEDULE', { title, description: text, date, time, category });
      }
      onClose();
    } catch (err) {
      console.error("[DiaryForm] handleSubmit error", err);
      let message = '저장 중 오류가 발생했습니다.';
      if (err instanceof Error) {
        try {
          const detailedErr = JSON.parse(err.message);
          message = `저장 실패: ${detailedErr.error || err.message}`;
        } catch {
          message = err.message;
        }
      }
      onShowToast?.(message, 'ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300 ${isDiaryMode ? 'bg-white' : 'p-4 bg-pastel-sand/60 backdrop-blur-md'}`}>
      <form 
        onSubmit={handleSubmit} 
        className={`bg-white flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
          isDiaryMode 
            ? 'w-full h-full rounded-none animate-in slide-in-from-bottom-10 md:px-24 lg:px-48' 
            : 'rounded-[3rem] w-full max-w-lg shadow-2xl border border-pastel-lavender/30 max-h-[90vh]'
        }`}
      >
        {/* Notion Style Header / Actions */}
        <div className={`flex justify-between items-center bg-white ${isDiaryMode ? 'px-8 py-4' : 'p-8 border-b border-pastel-sand'}`}>
          <div className="flex items-center gap-4">
             {isDiaryMode && (
               <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-medium">
                 <div className="flex items-center gap-2">
                   <BookHeart size={14} />
                   <span>라이프 다이어리</span>
                   <span>/</span>
                   <span className="text-pastel-purple font-bold">새 일기 작성</span>
                 </div>
                 {lastSaved && (
                   <div className="flex items-center gap-1 text-[9px] text-zinc-300 bg-zinc-50 px-2 py-0.5 rounded-full">
                     <Save size={10} />
                     자동 저장됨 {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </div>
                 )}
               </div>
             )}
             {!isDiaryMode && (
               <div>
                 <h2 className="text-sm font-bold text-pastel-text uppercase tracking-widest">📅 새로운 일정 예약</h2>
                 <p className="text-[10px] text-zinc-400 mt-1">내일을 위한 조각을 남겨주세요.</p>
               </div>
             )}
          </div>
          <div className="flex items-center gap-4">
            {isDiaryMode && (
              <div className="flex items-center gap-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="text-xs font-black text-white bg-pastel-purple px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-pastel-purple/20 hover:scale-105 active:scale-95"
              >
                <Send size={14} /> {isSubmitting ? '기록 중...' : '기록 완료하기'}
              </button>
            </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-300">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={`flex-1 flex overflow-hidden ${isDiaryMode ? 'w-full' : 'p-10'}`}>
          {isDiaryMode && (
            <div className="hidden lg:flex w-80 shrink-0 flex-col bg-zinc-50/50 border-r border-zinc-100 p-10 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {hasDraft && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-10 p-5 bg-pastel-purple/10 border border-pastel-purple/20 rounded-3xl space-y-3"
                  >
                    <div className="flex items-center gap-2 text-pastel-purple text-[10px] font-black uppercase tracking-widest">
                      <RefreshCcw size={12} className="animate-spin-slow" /> 초안 발견
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                      이전에 작성하던 내용이 있습니다. 불러오시겠습니까?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={handleRestoreDraft}
                        className="flex-1 py-2 bg-pastel-purple text-white text-[9px] font-bold rounded-xl"
                      >
                        불러오기
                      </button>
                      <button 
                        type="button"
                        onClick={handleClearDraft}
                        className="flex-1 py-2 bg-white text-zinc-400 text-[9px] font-bold rounded-xl border border-zinc-100"
                      >
                        삭제
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-pastel-purple animate-pulse" />
                  <span className="text-xs font-black text-pastel-text uppercase tracking-[0.2em]">AI Mind Guide</span>
                </div>
                
                <div className="space-y-8">
                    {[
                      { label: '오늘 느낀 3가지 감정', desc: '기쁨, 슬픔, 설렘 등...', icon: Info },
                      { label: '오늘 먹은 음식', desc: '맛있게 먹은 식사 한끼', icon: Check },
                      { label: '오늘 있었던 만남', desc: '대화한 사람 또는 마주침', icon: Quote },
                      { label: '기억에 남는 한가지 일', desc: '가장 강렬했던 순간', icon: Sparkles },
                      { label: '조금 힘들었던 일', desc: '위로받고 싶은 속마음', icon: AlertCircle },
                      { label: '하고 싶은 일 한가지', desc: '미래를 향한 작은 소망', icon: Check },
                      { label: '감사했던 일 한가지', desc: '고마운 마음이 든 순간', icon: Heart },
                      { label: '나를 위한 한가지 행동', desc: '작지만 소중한 나만의 시간', icon: Smile },
                      { label: '내일 기대되는 일 한가지', desc: '설렘 가득한 내일의 조각', icon: Sunrise },
                      { label: '나에게 해주고 싶은 말', desc: '오늘 하루도 수고한 나에게', icon: MessageCircle },
                    ].map((item, idx) => (
                     <div key={idx} className="flex gap-4 group">
                       <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-zinc-100 group-hover:border-pastel-purple/30 transition-colors">
                         <item.icon size={16} className="text-zinc-400 group-hover:text-pastel-purple transition-colors" />
                       </div>
                       <div className="flex flex-col justify-center">
                         <p className="text-[11px] font-bold text-zinc-600 mb-0.5">{item.label}</p>
                         <p className="text-[9px] font-medium text-zinc-400 leading-tight">{item.desc}</p>
                       </div>
                     </div>
                   ))}
                </div>

                <div className="pt-8 border-t border-dashed border-zinc-200">
                  <p className="text-[10px] font-bold text-zinc-400 leading-relaxed">
                    이 내용을 포함해 작성하면 AI가 당신의 마음을 더 깊이 이해하고 정확한 심리 분석과 상담을 도와드릴 수 있습니다. 🌸
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className={`flex-1 overflow-y-auto custom-scrollbar ${isDiaryMode ? 'py-10' : 'space-y-10'}`}>
            {isDiaryMode && hasDraft && (
              <div className="lg:hidden mx-8 mb-8 p-4 bg-pastel-purple/5 border border-pastel-purple/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCcw size={14} className="text-pastel-purple" />
                  <span className="text-[10px] font-bold text-zinc-500">이전 초안이 있습니다.</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleRestoreDraft} className="px-3 py-1.5 bg-pastel-purple text-white text-[9px] font-bold rounded-lg shadow-sm">불러오기</button>
                  <button type="button" onClick={handleClearDraft} className="px-3 py-1.5 bg-white text-zinc-400 text-[9px] font-bold rounded-lg border border-zinc-100">삭제</button>
                </div>
              </div>
            )}

            {!isDiaryMode && (
               <div className="flex bg-pastel-sand/50 p-1.5 rounded-3xl border border-pastel-lavender/10 mb-10">
              <button type="button" onClick={() => setActiveType('DIARY')} className={`flex-1 py-3 rounded-2xl text-[11px] font-bold transition-all ${activeType !== 'SCHEDULE' ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-400'}`}>일기</button>
              <button type="button" onClick={() => setActiveType('SCHEDULE')} className={`flex-1 py-3 rounded-2xl text-[11px] font-bold transition-all ${activeType === 'SCHEDULE' ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-400'}`}>일정</button>
            </div>
          )}

          {isDiaryMode ? (
            <div className="max-w-3xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Page Icon Placeholder -> Replaced with Text Branding */}
              <div className="flex items-center gap-3 mb-8 opacity-90">
                <div className="w-12 h-12 bg-pastel-lavender/30 rounded-2xl flex items-center justify-center text-pastel-purple">
                  <BookHeart size={28} />
                </div>
                <span className="text-2xl font-black text-pastel-text tracking-tighter">라이프 다이어리</span>
              </div>

              {/* Page Title */}
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="오늘의 감정을 한줄로 표현하면?"
                className="w-full bg-transparent text-5xl font-black text-pastel-text placeholder-zinc-100 outline-none border-none leading-tight"
                autoFocus
              />

              {/* Properties Section (Notion Style) */}
              <div className="space-y-4 pt-4 border-t border-zinc-50">
                <div className="grid grid-cols-[120px_1fr] items-center group">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    <Calendar size={12} className="text-zinc-300" />
                    <span>날짜</span>
                  </div>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="bg-transparent border-none outline-none text-sm font-medium text-pastel-text hover:bg-zinc-50 px-2 py-1.5 rounded-lg transition-all"
                  />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center group">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    <MapPin size={12} className="text-zinc-300" />
                    <span>장소</span>
                  </div>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="장소 추가"
                    className="bg-transparent border-none outline-none text-sm font-medium text-pastel-text placeholder-zinc-200 hover:bg-zinc-50 px-2 py-1.5 rounded-lg transition-all"
                  />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center group">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    <Lock size={12} className="text-zinc-300" />
                    <span>공개 여부</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-fit flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPrivate ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}
                  >
                    {isPrivate ? <Lock size={12} /> : <Unlock size={12} />}
                    {isPrivate ? '나만 보기' : '모두에게 공개'}
                  </button>
                </div>
              </div>

              {/* Content Divider */}
              <div className="h-px bg-zinc-100 w-full my-8" />

              {/* Main Writing Area (Rich Text) */}
              <RichEditor 
                content={text}
                onChange={setText}
                placeholder="빈 페이지입니다. 내용을 입력하세요..."
                className="flex-1"
              />
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-2 gap-8">
                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> 기록 날짜
                  </label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="w-full py-3 px-5 text-xs font-bold bg-pastel-sand/30 rounded-2xl outline-none" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-widest flex items-center gap-2">
                    <Clock size={12} /> 시간
                  </label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full py-3 px-5 text-xs font-bold bg-pastel-sand/30 rounded-2xl outline-none" />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-widest flex items-center gap-2">
                  <Tag size={12} /> 카테고리
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'PRIVATE', label: '개인', icon: Shield, color: 'text-zinc-400' },
                    { id: 'SHARED', label: '공유', icon: Users, color: 'text-pastel-purple' },
                    { id: 'IMPORTANT', label: '중요', icon: AlertCircle, color: 'text-rose-400' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`flex-1 py-3 px-2 rounded-2xl text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-2 border
                        ${category === cat.id ? 'bg-white border-pastel-purple shadow-sm ring-4 ring-pastel-purple/5' : 'bg-pastel-sand/30 border-transparent text-zinc-300'}`}
                    >
                      <cat.icon size={14} className={category === cat.id ? cat.color : 'text-zinc-200'} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-widest flex items-center gap-2">
                  <Tag size={12} /> 일정 제목
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="무엇을 계획하시나요?" className="w-full py-4 px-6 bg-pastel-sand/30 rounded-2xl text-sm font-bold outline-none" />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-widest flex items-center gap-2">
                  <FileText size={12} /> 상세 설명 (선택)
                </label>
                <textarea 
                  value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="메모를 남겨주세요."
                  className="w-full py-4 px-6 bg-pastel-sand/30 rounded-3xl text-sm font-medium outline-none resize-none"
                />
              </div>

              <div className="pt-4">
                 <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-pastel-purple text-white py-5 rounded-3xl font-bold uppercase tracking-[0.2em] shadow-lg hover:brightness-95 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Send size={18} /> {isSubmitting ? '기록 중...' : '일정 예약하기'}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </form>
    </div>
  );
};
