import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BookHeart,
  Calendar as CalendarIcon,
  Trash2,
  Clock,
  Check,
  AlertCircle,
  Users,
  Shield,
  Heart,
  MapPin,
  Image as ImageIcon,
  X,
  Settings,
  MessageSquare,
  BrainCircuit,
  Sparkles,
  Lock,
} from "lucide-react";
import { UserAvatar } from "../UserAvatar";
import { CalendarView } from "../CalendarView";
import { DiaryScheduleForm } from "../DiaryScheduleForm";
import { CommentSection } from "../CommentSection";
import { StickerSelector, StickerDisplay } from "../StickerSelector";
import { DiaryContent } from "../DiaryContent";
import { useStore } from "../../store";
import { Comment, ToastType, StickerType } from "../../../types";
import { consultAI } from "../../services/geminiService";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

export const DiaryTab: React.FC<{
  onOpenModal: (date?: string) => void;
  onConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onShowToast?: (message: string, type: ToastType) => void;
}> = ({ onOpenModal, onConfirm, onShowToast }) => {
  const [historyDate, setHistoryDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split("T")[0],
  );
  const [isDateDetailOpen, setIsDateDetailOpen] = useState(false);
  const [editingDiary, setEditingDiary] = useState<any>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [showStickersFor, setShowStickersFor] = useState<string | null>(null);
  const [stickerPosition, setStickerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // AI 상담 관련 상태
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("사용자님의 마음을 읽는 중입니다...");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [savedDiaryId, setSavedDiaryId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugStatus, setDebugStatus] = useState<string | null>(null);

  const loadingMessages = [
    "사용자님의 마음을 읽는 중입니다...",
    "오늘의 감정 조각을 정성껏 모으고 있습니다...",
    "심층 심리 데이터를 분석하여 통찰을 도출 중입니다...",
    "따뜻한 위로와 지혜를 담은 글을 적는 중입니다...",
    "내면의 성장을 돕기 위한 질문을 고민 중입니다...",
    "전인적 치유 프로토콜을 기반으로 조언을 생성 중입니다..."
  ];

  const handleAskAI = async (diary: any) => {
    const text = diary.text;
    if (!text || text.trim() === "" || text === "<p></p>") {
      onShowToast?.("일기 내용을 먼저 작성해주세요.", "ERROR");
      return;
    }

    const diaryAuthor = users.find((u) => u.id === diary.userId);
    if (!diaryAuthor) {
      onShowToast?.("작성자 정보를 찾을 수 없습니다.", "ERROR");
      return;
    }

    try {
      if (!currentUser) return;
      setIsConsulting(true);
      setShowAiPanel(true);
      setLoadingMessage(loadingMessages[0]);
      
      const messageInterval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 3000);

      // 상담은 작성자의 기준으로 진행
      const advice = await consultAI(text, diaryAuthor.name);
      clearInterval(messageInterval);
      setAiAdvice(advice || "상담 결과를 가져오지 못했습니다.");
      
      setDebugStatus("연결 성공: AI 응답을 정상적으로 수신했습니다.");
      console.log("[DiaryTab] AI Advice received", { adviceLength: advice?.length });

      // 기록 저장 (작성자의 계정으로 저장)
      if (advice) {
        console.log("[DiaryTab] Attempting to save counseling record");
        const { addCounselingRecord } = useStore.getState();
        try {
          await addCounselingRecord({
            userId: diaryAuthor.id, // 작성자 ID로 저장
            date: diary.date,
            diaryId: diary.id,
            diaryText: text,
            aiAdvice: advice,
            createdAt: new Date().toISOString(),
          });
          console.log("[DiaryTab] Counseling record saved successfully");
          
          // 성공 알림 (말풍선)
          setSavedDiaryId(diary.id);
          setTimeout(() => setSavedDiaryId(null), 3000);
        } catch (dbErr) {
          console.error("Firestore Save Error:", dbErr);
          onShowToast?.("상담 결과 저장 중 오류가 발생했습니다. (권한 문제일 수 있습니다)", "ERROR");
        }
      } else {
        console.warn("[DiaryTab] No advice to save");
      }
    } catch (err: any) {
      console.error("Gemini AI Error:", err);
      const isForbidden = err?.message?.includes("403") || err?.message?.includes("Forbidden");
      
      if (isForbidden) {
        setDebugStatus("오류(403): 권한 거부. 프로젝트 설정 또는 결제 상태를 확인하세요.");
      } else {
        setDebugStatus(`오류: ${err?.message || "알 수 없는 오류"}`);
      }

      onShowToast?.(
        err instanceof Error ? err.message : "AI 상담 호출 중 오류가 발생했습니다.",
        "ERROR",
      );
      // Don't auto-hide panel if it's a 403 error, so user can see context
      if (!isForbidden) setShowAiPanel(false);
    } finally {
      setIsConsulting(false);
    }
  };

  const diaries = useStore((state) => state.diaries);
  const schedules = useStore((state) => state.schedules);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);
  const deleteDiary = useStore((state) => state.deleteDiary);
  const deleteSchedule = useStore((state) => state.deleteSchedule);
  const updateSchedule = useStore((state) => state.updateSchedule);
  const addDiary = useStore((state) => state.addDiary);
  const addSchedule = useStore((state) => state.addSchedule);
  const toggleDiaryLike = useStore((state) => state.toggleDiaryLike);
  const addDiarySticker = useStore((state) => state.addDiarySticker);
  const addDiaryComment = useStore((state) => state.addDiaryComment);
  const updateDiary = useStore((state) => state.updateDiary);
  const updateUser = useStore((state) => state.updateUser);

  React.useEffect(() => {
    const latest = diaries[0];
    if (currentUser && latest && latest.id !== currentUser.lastViewedDiaryId) {
      updateUser(currentUser.id, { lastViewedDiaryId: latest.id });
    }
  }, [diaries, currentUser?.id, updateUser]);

  const changeMonth = (offset: number) => {
    setHistoryDate(
      new Date(historyDate.getFullYear(), historyDate.getMonth() + offset, 1),
    );
    setSelectedDate(null);
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsDateDetailOpen(true);
  };

  const filteredDiaries = diaries
    .filter((d) => {
      const dDate = new Date(d.date);
      const isCorrectMonth =
        dDate.getFullYear() === historyDate.getFullYear() &&
        dDate.getMonth() === historyDate.getMonth();
      const canSee = !d.isPrivate || d.userId === currentUser?.id;
      return isCorrectMonth && canSee;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredSchedules = schedules
    .filter((s) => {
      const sDate = new Date(s.date);
      const isCorrectMonth =
        sDate.getFullYear() === historyDate.getFullYear() &&
        sDate.getMonth() === historyDate.getMonth();
      const canSee = s.category !== "PRIVATE" || s.userId === currentUser?.id;
      return isCorrectMonth && canSee;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const dailyDiaries = selectedDate
    ? filteredDiaries.filter((d) => d.date === selectedDate)
    : [];

  const dailySchedules = selectedDate
    ? filteredSchedules.filter((s) => s.date === selectedDate)
    : [];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "IMPORTANT":
        return "text-rose-500 bg-rose-50 border-rose-100";
      case "SHARED":
        return "text-pastel-purple bg-pastel-purple/5 border-pastel-purple/10";
      default:
        return "text-zinc-400 bg-pastel-sand/50 border-pastel-sand";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "IMPORTANT":
        return <AlertCircle size={12} />;
      case "SHARED":
        return <Users size={12} />;
      default:
        return <Shield size={12} />;
    }
  };

  return (
    <>
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 mb-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tighter">
              라이프 플래너
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">
              일기와 일정을 조화롭게 관리하세요.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 bg-white px-8 py-3 rounded-full soft-shadow border border-pastel-lavender/30 w-fit mx-auto">
            <button
              onClick={() => changeMonth(-1)}
              className="text-zinc-300 hover:text-pastel-purple transition-colors p-1"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-pastel-text min-w-[120px] text-center">
              {historyDate.getFullYear()}년 {historyDate.getMonth() + 1}월
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="text-zinc-300 hover:text-pastel-purple transition-colors p-1"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex justify-center md:justify-end">
            <button
              onClick={() => onOpenModal()}
              className="bg-pastel-purple text-white px-10 py-4 rounded-3xl text-sm font-bold shadow-xl flex items-center gap-3 hover:scale-105 transition-all"
            >
              <Plus size={18} /> 기록하기
            </button>
          </div>
        </div>

        <CalendarView
          currentDate={historyDate}
          transactions={[]}
          diaries={filteredDiaries}
          schedules={filteredSchedules}
          users={users}
          hideFinancials={true}
          onDateClick={handleDateClick}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 타임라인: 일기 목록 */}
          <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-3">
                <BookHeart size={16} /> 오늘의 조각
                {selectedDate && (
                  <span className="text-[10px] text-pastel-purple normal-case tracking-normal">
                    {selectedDate}
                  </span>
                )}
              </h3>
            </div>
            {dailyDiaries.length === 0 ? (
              <div className="bg-white/40 p-12 rounded-[3rem] text-center opacity-30 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-pastel-lavender/20">
                {selectedDate
                  ? "선택한 날짜의 조각이 없습니다."
                  : "캘린더에서 날짜를 선택해주세요."}
              </div>
            ) : (
              dailyDiaries.map((d) => (
                <div
                  key={d.id}
                  className="diary-card bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 flex flex-col group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        avatar={
                          users.find((u) => u.id === d.userId)?.avatar || ""
                        }
                        name={users.find((u) => u.id === d.userId)?.name || ""}
                        color={
                          users.find((u) => u.id === d.userId)?.color || "#ccc"
                        }
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-pastel-text">
                            {users.find((u) => u.id === d.userId)?.name}
                          </span>
                          <StickerDisplay
                            diaryId={d.id}
                            stickers={d.stickers || []}
                            users={users}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {d.isPrivate && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded-md text-[9px] font-bold">
                              <Lock size={10} /> 숨김
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                            {d.date}
                          </span>
                          {d.location && (
                            <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
                              <MapPin size={10} /> {d.location.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onConfirm(
                          "일기 삭제",
                          "이 일기를 정말 삭제하시겠습니까?",
                          () => deleteDiary(d.id),
                        )
                      }
                      className="text-zinc-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {d.title && (
                    <h4 className="text-base font-bold text-pastel-text mb-2">
                      {d.title}
                    </h4>
                  )}
                  <DiaryContent 
                    diaryId={d.id}
                    content={d.text}
                    onUpdate={(id, text) => updateDiary(id, { text })}
                    isOwner={d.userId === currentUser?.id}
                  />

                  <div className="mt-8 pt-6 border-t border-pastel-sand flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setEditingDiary(d)}
                        className="text-[10px] font-bold text-pastel-purple uppercase tracking-widest hover:underline"
                      >
                        수정하기
                      </button>
                      <button
                        onClick={() =>
                          setShowCommentsFor(
                            showCommentsFor === d.id ? null : d.id,
                          )
                        }
                        className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${showCommentsFor === d.id ? "text-pastel-purple" : "text-zinc-400 hover:text-pastel-purple"}`}
                      >
                        <MessageSquare size={14} /> {d.comments?.length || 0}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => handleAskAI(d)}
                          className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-pastel-purple group"
                        >
                          <BrainCircuit
                            size={14}
                            className="group-hover:scale-110 transition-transform"
                          />{" "}
                          AI 상담
                        </button>
                        <AnimatePresence>
                          {savedDiaryId === d.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, x: "-50%" }}
                              animate={{ opacity: 1, y: 0, x: "-50%" }}
                              exit={{ opacity: 0, y: 10, x: "-50%" }}
                              className="absolute bottom-full left-1/2 mb-2 px-3 py-2 bg-pastel-purple text-white text-[10px] font-bold rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none"
                            >
                              대시보드 상담 기록에 저장되었습니다.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-pastel-purple" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowStickersFor(
                              showStickersFor === d.id ? null : d.id,
                            )
                          }
                          className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${showStickersFor === d.id ? "text-pastel-purple" : "text-zinc-400 hover:text-pastel-purple"}`}
                        >
                          😊 스티커
                        </button>
                        {showStickersFor === d.id && (
                          <StickerSelector
                            onSelect={(type) => {
                              if (currentUser)
                                addDiarySticker(d.id, currentUser.id, type);
                              setShowStickersFor(null);
                            }}
                            onClose={() => setShowStickersFor(null)}
                          />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        currentUser && toggleDiaryLike(d.id, currentUser.id)
                      }
                      className={`transition-all hover:scale-110 ${d.reactions?.includes(currentUser?.id || "") ? "text-rose-500" : "text-rose-200 hover:text-rose-300"}`}
                    >
                      <Heart
                        size={18}
                        fill={
                          d.reactions?.includes(currentUser?.id || "")
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>

                  {showCommentsFor === d.id && (
                    <div className="mt-6 pt-6 border-t border-pastel-sand/50 animate-in slide-in-from-top-2">
                      <CommentSection
                        comments={d.comments || []}
                        users={users}
                        currentUser={currentUser}
                        onAddComment={async (text) => {
                          if (currentUser) {
                            await addDiaryComment(d.id, {
                              userId: currentUser.id,
                              text,
                              date: new Date().toISOString().split("T")[0],
                            });
                          }
                        }}
                        onDeleteComment={async (commentId) => {
                          const newComments = (d.comments || []).filter(
                            (c) => c.id !== commentId,
                          );
                          await updateDiary(d.id, { comments: newComments });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 플래너: 일정 목록 */}
          <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-3">
                <CalendarIcon size={16} /> 오늘의 일정
                {selectedDate && (
                  <span className="text-[10px] text-pastel-purple normal-case tracking-normal">
                    {selectedDate}
                  </span>
                )}
              </h3>
            </div>
            {dailySchedules.length === 0 ? (
              <div className="bg-white/40 p-12 rounded-[3rem] text-center opacity-30 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-pastel-lavender/20">
                {selectedDate
                  ? "등록된 오늘의 일정이 없습니다."
                  : "캘린더에서 날짜를 선택해주세요."}
              </div>
            ) : (
              [...dailySchedules]
                .sort((a, b) =>
                  (a.date + (a.time || "")).localeCompare(
                    b.date + (b.time || ""),
                  ),
                )
                .map((s) => (
                  <div
                    key={s.id}
                    className={`bg-white p-8 rounded-[2.5rem] soft-shadow border border-pastel-lavender/20 flex items-center justify-between group transition-all ${s.isCompleted ? "opacity-40 grayscale" : "hover:scale-[1.01]"}`}
                  >
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => setEditingSchedule(s)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${s.isCompleted ? "bg-pastel-purple text-white" : "bg-pastel-sand text-zinc-300 hover:text-pastel-purple hover:bg-white"}`}
                      >
                        {s.isCompleted ? (
                          <Check size={24} />
                        ) : (
                          <Clock size={24} />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                            <CalendarIcon size={10} /> {s.date}
                            {s.time && (
                              <>
                                <Clock size={10} className="ml-1" /> {s.time}
                              </>
                            )}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${getCategoryColor(s.category)}`}
                          >
                            {getCategoryIcon(s.category)} {s.category}
                          </span>
                        </div>
                        <h4
                          className={`text-base font-bold text-pastel-text ${s.isCompleted ? "line-through" : ""}`}
                        >
                          {s.title}
                        </h4>
                        {s.description && (
                          <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onConfirm(
                          "일정 삭제",
                          "이 일정을 정말 삭제하시겠습니까?",
                          () => deleteSchedule(s.id),
                        )
                      }
                      className="text-zinc-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Record creation from calendar is now handled by onOpenModal in App.tsx */}

        {isDateDetailOpen && selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div
              className="fixed inset-0"
              onClick={() => setIsDateDetailOpen(false)}
            ></div>
            <div className="bg-white w-full max-w-2xl rounded-[3rem] soft-shadow border border-pastel-lavender/20 relative animate-in zoom-in duration-300 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-8 border-b border-pastel-sand flex justify-between items-center bg-white/50">
                <div>
                  <h3 className="text-lg font-bold text-pastel-text">
                    {selectedDate} 기록
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                    이날의 소중한 일상과 일정입니다.
                  </p>
                </div>
                <button
                  onClick={() => setIsDateDetailOpen(false)}
                  className="p-2 hover:bg-pastel-sand rounded-full transition-colors text-zinc-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* 일기 섹션 */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                    <BookHeart size={14} /> 일기
                  </h4>
                  {diaries.filter((d) => {
                    const isMatch = d.date === selectedDate;
                    const canSee = !d.isPrivate || d.userId === currentUser?.id;
                    return isMatch && canSee;
                  }).length === 0 ? (
                    <p className="text-xs text-zinc-300 italic py-4">
                      기록된 일기가 없습니다.
                    </p>
                  ) : (
                    diaries
                      .filter((d) => {
                        const isMatch = d.date === selectedDate;
                        const canSee =
                          !d.isPrivate || d.userId === currentUser?.id;
                        return isMatch && canSee;
                      })
                      .map((d) => (
                        <div
                          key={d.id}
                          className="diary-card bg-pastel-sand/20 p-6 rounded-[2rem] border border-pastel-sand/30 group relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                avatar={
                                  users.find((u) => u.id === d.userId)
                                    ?.avatar || ""
                                }
                                name={
                                  users.find((u) => u.id === d.userId)?.name ||
                                  ""
                                }
                                color={
                                  users.find((u) => u.id === d.userId)?.color ||
                                  "#ccc"
                                }
                                size="sm"
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-pastel-text">
                                  {users.find((u) => u.id === d.userId)?.name}
                                </span>
                                <StickerDisplay
                                  diaryId={d.id}
                                  stickers={d.stickers || []}
                                  users={users}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingDiary(d)}
                                className="text-zinc-300 hover:text-pastel-purple transition-colors"
                              >
                                <Settings size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  onConfirm(
                                    "일기 삭제",
                                    "정말 삭제하시겠습니까?",
                                    () => deleteDiary(d.id),
                                  )
                                }
                                className="text-zinc-300 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h5 className="text-sm font-bold text-pastel-text mb-2">
                            {d.title}
                          </h5>
                          <DiaryContent 
                            diaryId={d.id}
                            content={d.text}
                            onUpdate={(id, text) => updateDiary(id, { text })}
                            isOwner={d.userId === currentUser?.id}
                          />

                          <div className="flex justify-between items-center pt-4 border-t border-pastel-sand/50">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setShowStickersFor(
                                      showStickersFor === d.id ? null : d.id,
                                    )
                                  }
                                  className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${showStickersFor === d.id ? "text-pastel-purple" : "text-zinc-400 hover:text-pastel-purple"}`}
                                >
                                  😊 스티커
                                </button>
                                {showStickersFor === d.id && (
                                  <StickerSelector
                                    onSelect={(type) => {
                                      if (currentUser)
                                        addDiarySticker(
                                          d.id,
                                          currentUser.id,
                                          type,
                                        );
                                      setShowStickersFor(null);
                                    }}
                                    onClose={() => setShowStickersFor(null)}
                                  />
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  setShowCommentsFor(
                                    showCommentsFor === d.id ? null : d.id,
                                  )
                                }
                                className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${showCommentsFor === d.id ? "text-pastel-purple" : "text-zinc-400 hover:text-pastel-purple"}`}
                              >
                                <MessageSquare size={14} />{" "}
                                {d.comments?.length || 0}
                              </button>
                              <div className="relative ml-auto">
                                <button
                                  onClick={() => handleAskAI(d)}
                                  className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-pastel-purple group"
                                >
                                  <BrainCircuit
                                    size={14}
                                    className="group-hover:scale-110 transition-transform"
                                  />{" "}
                                  AI 상담
                                </button>
                                <AnimatePresence>
                                  {savedDiaryId === d.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10, x: "-50%" }}
                                      animate={{ opacity: 1, y: 0, x: "-50%" }}
                                      exit={{ opacity: 0, y: 10, x: "-50%" }}
                                      className="absolute bottom-full left-1/2 mb-2 px-3 py-2 bg-pastel-purple text-white text-[10px] font-bold rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none"
                                    >
                                      대시보드 상담 기록에 저장되었습니다.
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-pastel-purple" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                currentUser &&
                                toggleDiaryLike(d.id, currentUser.id)
                              }
                              className={`transition-all hover:scale-110 ${d.reactions?.includes(currentUser?.id || "") ? "text-rose-500" : "text-rose-200 hover:text-rose-300"}`}
                            >
                              <Heart
                                size={16}
                                fill={
                                  d.reactions?.includes(currentUser?.id || "")
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>

                          {showCommentsFor === d.id && (
                            <div className="mt-4 pt-4 border-t border-pastel-sand/30">
                              <CommentSection
                                comments={d.comments || []}
                                users={users}
                                currentUser={currentUser}
                                onAddComment={async (text) => {
                                  if (currentUser) {
                                    await addDiaryComment(d.id, {
                                      userId: currentUser.id,
                                      text,
                                      date: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                    });
                                  }
                                }}
                                onDeleteComment={async (commentId) => {
                                  const newComments = (d.comments || []).filter(
                                    (c) => c.id !== commentId,
                                  );
                                  await updateDiary(d.id, {
                                    comments: newComments,
                                  });
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>

                {/* 일정 섹션 */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon size={14} /> 일정
                  </h4>
                  {schedules.filter((s) => {
                    const isMatch = s.date === selectedDate;
                    const canSee =
                      s.category !== "PRIVATE" || s.userId === currentUser?.id;
                    return isMatch && canSee;
                  }).length === 0 ? (
                    <p className="text-xs text-zinc-300 italic py-4">
                      등록된 일정이 없습니다.
                    </p>
                  ) : (
                    schedules
                      .filter((s) => {
                        const isMatch = s.date === selectedDate;
                        const canSee =
                          s.category !== "PRIVATE" ||
                          s.userId === currentUser?.id;
                        return isMatch && canSee;
                      })
                      .sort((a, b) => (b.time || "").localeCompare(a.time || ""))
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-pastel-sand/20 p-5 rounded-2xl border border-pastel-sand/30"
                        >
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() =>
                                updateSchedule(s.id, {
                                  isCompleted: !s.isCompleted,
                                })
                              }
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${s.isCompleted ? "bg-pastel-purple text-white" : "bg-white text-zinc-200"}`}
                            >
                              {s.isCompleted ? (
                                <Check size={18} />
                              ) : (
                                <Clock size={18} />
                              )}
                            </button>
                            <div>
                              <p
                                className={`text-xs font-bold text-pastel-text ${s.isCompleted ? "line-through opacity-50" : ""}`}
                              >
                                {s.title}
                              </p>
                              {s.time && (
                                <p className="text-[9px] text-zinc-400 font-bold">
                                  {s.time}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingSchedule(s)}
                              className="text-zinc-300 hover:text-pastel-purple transition-colors"
                            >
                              <Settings size={14} />
                            </button>
                            <button
                              onClick={() =>
                                onConfirm(
                                  "일정 삭제",
                                  "정말 삭제하시겠습니까?",
                                  () => deleteSchedule(s.id),
                                )
                              }
                              className="text-zinc-300 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="p-8 bg-pastel-sand/10 border-t border-pastel-sand flex gap-4">
                <button
                  onClick={() => {
                    setIsDateDetailOpen(false);
                    if (selectedDate) onOpenModal(selectedDate);
                  }}
                  className="flex-1 bg-pastel-purple text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:brightness-95 transition-all"
                >
                  새로운 기록 추가
                </button>
                <button
                  onClick={() => setIsDateDetailOpen(false)}
                  className="flex-1 bg-white text-zinc-400 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-pastel-sand hover:bg-pastel-sand/30 transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Counseling Panel (Sidebar style) */}
        <AnimatePresence>
          {showAiPanel && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-white shadow-2xl z-[150] flex flex-col border-l border-zinc-50"
            >
              <div className="p-6 border-b border-zinc-50 flex justify-between items-center bg-pastel-sand/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-pastel-purple shadow-sm">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-pastel-text">
                      AI 마음 상담소
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      1급 심리 상담 전문가
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className={`p-2 rounded-xl transition-colors ${showDebug ? "bg-pastel-purple text-white" : "hover:bg-white text-zinc-300 shadow-sm"}`}
                    title="진단 도구"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="p-2 hover:bg-white rounded-xl transition-colors text-zinc-300 shadow-sm"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {showDebug && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-6 bg-zinc-900 rounded-[2rem] text-zinc-300 font-mono text-[10px] space-y-3 border-4 border-pastel-purple/20"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-pastel-purple font-bold">--- 시스템 진단 모드 ---</span>
                      <span className="px-2 py-0.5 bg-pastel-purple/20 text-pastel-purple rounded-md text-[8px]">ACTIVE</span>
                    </div>
                    <div className="space-y-1.5 capitalize">
                      <p><span className="text-zinc-500">상태:</span> {debugStatus || "대기 중"}</p>
                      <p><span className="text-zinc-500">프로젝트:</span> gen-lang-client-0869534107</p>
                      <p><span className="text-zinc-500">API 키 출처:</span> {localStorage.getItem("DEBUG_GEMINI_API_KEY") ? "브라우저 콘솔(Debug)" : "환경 변수(App)"}</p>
                      <p><span className="text-zinc-500">키 스니펫:</span> {(() => {
                        const k = localStorage.getItem("DEBUG_GEMINI_API_KEY") || "";
                        return k ? `${k.substring(0, 6)}...${k.substring(k.length - 4)}` : "설정되지 않음";
                      })()}</p>
                    </div>
                    <div className="pt-2 text-zinc-500 leading-relaxed">
                      <p className="text-pastel-purple mb-1">💡 해결 팁:</p>
                      <p>1. GCP 콘솔에서 'Generative Language API' 활성화를 확인하세요.</p>
                      <p>2. 프로젝트 결제 수단(Billing)이 유효한지 확인하세요.</p>
                    </div>
                  </motion.div>
                )}

                {isConsulting ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
                    <div className="w-20 h-20 bg-pastel-purple/5 rounded-full flex items-center justify-center">
                      <Sparkles
                        size={40}
                        className="text-pastel-purple animate-bounce"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-pastel-text transition-all duration-500">
                        {loadingMessage}
                      </p>
                      <p className="text-xs text-zinc-400">
                        잠시만 기다려 주세요. 1~2분이 소요될 수 있습니다.
                      </p>
                    </div>

                    {debugStatus?.includes("403") && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] text-left"
                      >
                        <div className="flex items-center gap-3 mb-3 text-rose-500">
                          <AlertCircle size={20} />
                          <span className="font-bold text-sm">권한 거부됨 (403 Forbidden)</span>
                        </div>
                        <ul className="text-[11px] text-rose-400 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                          <li>프로젝트(<span className="font-bold underline text-rose-600">gen-lang-client-0581552181</span>) 설정 확인</li>
                          <li>브라우저 콘솔에서 설정한 키값이 정확한지 확인</li>
                          <li>Google AI Studio에서 API 키가 활성 상태인지 확인</li>
                        </ul>
                      </motion.div>
                    )}
                  </div>
                ) : aiAdvice ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-2 text-pastel-rose">
                      <Heart size={16} fill="currentColor" />
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        전문가 심리 분석 및 조언
                      </span>
                    </div>

                    <div className="prose prose-sm prose-zinc prose-p:leading-relaxed prose-headings:font-black prose-headings:text-pastel-text prose-strong:text-pastel-purple markdown-body">
                      <Markdown>{aiAdvice}</Markdown>
                    </div>

                    <div className="pt-8 border-t border-zinc-50">
                      <div className="p-4 bg-pastel-sand/50 rounded-2xl border border-pastel-lavender/20">
                        <div className="flex items-start gap-3">
                          <MessageSquare
                            size={16}
                            className="text-pastel-purple mt-1 shrink-0"
                          />
                          <p className="text-[11px] leading-relaxed text-zinc-500 font-medium italic">
                            "우울과 무기력은 당신의 잘못이 아닙니다. 이 마음의
                            조각들을 함께 보듬어 나갈 수 있어요."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {editingDiary && (
          <DiaryScheduleForm
            onClose={() => setEditingDiary(null)}
            initialData={editingDiary}
            mode="DIARY"
            onSubmit={async (_, data) => {
              const { updateDiary } = useStore.getState();
              await updateDiary(editingDiary.id, data);
              setEditingDiary(null);
            }}
          />
        )}

        {editingSchedule && (
          <DiaryScheduleForm
            onClose={() => setEditingSchedule(null)}
            initialData={editingSchedule}
            mode="SCHEDULE"
            onSubmit={async (_, data) => {
              await updateSchedule(editingSchedule.id, data);
              setEditingSchedule(null);
            }}
          />
        )}
      </div>
    </>
  );
};
