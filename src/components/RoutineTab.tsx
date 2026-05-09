
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Brain, 
  Timer, 
  TrendingUp,
  RefreshCw,
  ChevronRight,
  BookOpen,
  PenTool,
  Dna,
  Footprints,
  Flame,
  Coffee,
  Sun,
  Video,
  BookHeart,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { generateWeeklyRoutine } from '../services/geminiService';
import { RoutineTask, RoutineStatus, LifeRoutine } from '../../types';
import { CommunityUserSelector } from './CommunityUserSelector';

const STATUS_CONFIG: Record<RoutineStatus, { label: string, color: string, bg: string, icon: any }> = {
  STABLE: { label: '안정', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  CAUTION: { label: '주의', color: 'text-amber-600', bg: 'bg-amber-50', icon: Circle },
  RECOVERY: { label: '회복 필요', color: 'text-blue-600', bg: 'bg-blue-50', icon: RefreshCw },
  BURNOUT: { label: '번아웃', color: 'text-rose-600', bg: 'bg-rose-50', icon: Brain },
};

const TASK_ICONS: Record<string, any> = {
  READING: BookOpen,
  DIARY: PenTool,
  MEDITATION: Dna,
  WALKING: Footprints,
  RUNNING: Flame,
  BREAKFAST: Coffee,
  WAKEUP: Sun,
  LEARNING: Video,
  OTHER: Timer
};

export const RoutineTab: React.FC = () => {
  const { 
    currentUser, 
    users,
    diaries, 
    counselingRecords, 
    lifeRoutines: allRoutines, 
    addLifeRoutine, 
    toggleRoutineTask,
    updateUser
  } = useStore();

  React.useEffect(() => {
    const latest = allRoutines[0];
    if (currentUser && latest && latest.id !== currentUser.lastViewedRoutineId) {
      updateUser(currentUser.id, { lastViewedRoutineId: latest.id });
    }
  }, [allRoutines, currentUser?.id, updateUser]);

  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
  const isViewingSelf = selectedUserId === currentUser?.id;
  const targetUser = users.find(u => u.id === selectedUserId) || currentUser;

  const myDiaries = diaries.filter(d => d.userId === selectedUserId);
  const myCounselingRecords = counselingRecords.filter(r => r.userId === selectedUserId);
  const lifeRoutines = allRoutines.filter(r => r.userId === selectedUserId);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("AI가 당신의 상태를 분석 중입니다");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [processedRoutineId, setProcessedRoutineId] = useState<string | null>(null);

  const loadingMessages = [
    "최근 기록된 마음의 조각들을 모으고 있어요...",
    "당신의 심리 상담 기록을 분석 중입니다...",
    "회복을 위한 맞춤형 활동들을 선별하고 있습니다...",
    "7일간의 최적화된 회복 루틴을 설계 중입니다...",
    "당신만의 전인적 치유 프로토콜을 완성하고 있습니다..."
  ];

  const hasEnoughData = myDiaries.length >= 3 || myCounselingRecords.length >= 3;

  const activeRoutine = lifeRoutines[0]; // Get the latest one

  const handleGenerate = async () => {
    if (!currentUser) return;
    if (!hasEnoughData) return;
    setIsGenerating(true);
    setLoadingMessage(loadingMessages[0]);

    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = loadingMessages.indexOf(prev);
        return loadingMessages[(currentIndex + 1) % loadingMessages.length];
      });
    }, 3000);

    try {
      const routineData = await generateWeeklyRoutine(
        myCounselingRecords,
        myDiaries,
        currentUser.id,
        currentUser.name
      );
      
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + 7);

      await addLifeRoutine({
        ...routineData as any,
        userId: currentUser.id,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to generate routine:", error);
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
    }
  };

  const calculateProgress = (routine: LifeRoutine) => {
    if (!routine.days || routine.days.length === 0) return 0;
    const totalTasks = routine.days.reduce((acc, day) => acc + day.tasks.length, 0);
    if (totalTasks === 0) return 0;
    const completedTasks = routine.days.reduce((acc, day) => 
      acc + day.tasks.filter(t => t.isCompleted).length, 0);
    return Math.round((completedTasks / totalTasks) * 100) || 0;
  };

  // Auto-regeneration logic when 100% achieved
  useEffect(() => {
    if (!activeRoutine || !isViewingSelf || isGenerating) return;
    
    const progress = calculateProgress(activeRoutine);
    if (progress === 100 && activeRoutine.id !== processedRoutineId) {
      setProcessedRoutineId(activeRoutine.id);
      
      const processCompletion = async () => {
        // Increment achievement count
        const currentCount = currentUser?.routineAchievementCount || 0;
        await useStore.getState().updateUser(currentUser!.id, {
          routineAchievementCount: currentCount + 1
        });
        
        // Brief delay before re-analysis
        setTimeout(() => {
          handleGenerate();
        }, 3000);
      };
      
      processCompletion();
    }
  }, [activeRoutine?.id, diaries.length, counselingRecords.length, isViewingSelf]);

  if (!activeRoutine && !isGenerating) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000">
        {/* User Selector */}
        <div className="bg-pastel-sand/20 p-4 rounded-[2rem] border border-pastel-sand/50">
          <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-pastel-text/50 uppercase tracking-[0.2em]">Community Members</span>
            <span className="text-[10px] font-bold text-zinc-400 italic">클릭하여 구성원의 루틴 보기</span>
          </div>
          <CommunityUserSelector 
            users={users} 
            selectedUserId={selectedUserId} 
            onSelect={setSelectedUserId} 
          />
        </div>

        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-gradient-to-br from-pastel-purple/20 to-pastel-lavender/20 text-pastel-purple rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"
          >
            <Sparkles size={48} className="animate-pulse" />
          </motion.div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-pastel-text tracking-tight">마음 회복 루틴 시스템</h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-lg mx-auto">
              당신의 소중한 기록들을 바탕으로 AI가 마음의 건강을 되찾기 위한<br />
              단계별 맞춤 회복 솔루션을 제안합니다.
            </p>
          </div>
        </div>

        {!hasEnoughData ? (
          <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-amber-500">
              <AlertCircle size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Needed</span>
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold text-amber-900">"맞춤 루틴을 설계하기에 데이터가 조금 부족해요."</p>
              <p className="text-xs text-amber-700/70 font-medium leading-relaxed px-4">
                최소 3개 이상의 기록이 있어야 당신의 현재 상태를 정확히 진단하고<br/>
                효과적인 회복 루틴을 제안할 수 있습니다.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-center gap-4 text-amber-600 font-bold text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} /> 일기 기록 ({myDiaries.length}/3)</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} /> AI 상담 ({myCounselingRecords.length}/3)</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] soft-shadow border border-pastel-lavender/10 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <BookHeart size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-pastel-text">상담 기반 진단</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">당신이 받은 AI 상담 결과와 정서적 상태를 중심적으로 분석합니다.</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] soft-shadow border border-pastel-lavender/10 space-y-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-pastel-text">단계별 회복</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">현재 컨디션에 맞춰 독서, 명상, 운동 등 최적화된 7일 루틴을 설계합니다.</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] soft-shadow border border-pastel-lavender/10 space-y-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                  <RefreshCw size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-pastel-text">지속적인 성장</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">실천 데이터가 쌓일수록 당신의 성향을 더 잘 이해하고 고도화됩니다.</p>
                </div>
              </div>
            </div>

            <div className="bg-pastel-sand/30 p-10 rounded-[3rem] border border-pastel-sand/50 text-center space-y-6">
              <div className="flex items-center justify-center gap-2 text-pastel-purple">
                <PenTool size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data & Growth</span>
              </div>
              <div className="space-y-2">
                <p className="text-base font-bold text-pastel-text">"더 많이 기록할수록, 솔루션은 더 정교해집니다."</p>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed px-4">
                  더 풍성한 일기 기록과 적극적인 AI 상담은 루틴의 정확도를 높이는 핵심입니다.<br/>
                  꾸준한 기록과 상담을 통해 당신만을 위한 특별한 회복 솔루션을 지속적으로 받아보세요.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  className="group bg-pastel-purple text-white px-10 py-5 rounded-[2rem] font-bold shadow-xl shadow-pastel-purple/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                >
                  나만의 루틴 설계 시작하기
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-pastel-purple/10 border-t-pastel-purple rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-pastel-purple animate-pulse">
            <Brain size={32} />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-pastel-text">AI가 당신의 상태를 분석 중입니다</h2>
          <p className="text-xs text-zinc-400 animate-pulse transition-all duration-500">
            {loadingMessage}
          </p>
          <p className="text-[10px] text-zinc-300">
            잠시만 기다려 주세요. 1~2분이 소요될 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  const currentDay = activeRoutine.days[selectedDayIndex];
  const progress = calculateProgress(activeRoutine);
  const StatusIcon = STATUS_CONFIG[activeRoutine.status].icon;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* User Selector */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-pastel-sand/20 p-4 rounded-[2rem] border border-pastel-sand/50">
          <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-pastel-text/50 uppercase tracking-[0.2em]">Community Members</span>
            <span className="text-[10px] font-bold text-zinc-400 italic">클릭하여 구성원의 루틴 보기</span>
          </div>
          <CommunityUserSelector 
            users={users} 
            selectedUserId={selectedUserId} 
            onSelect={setSelectedUserId} 
          />
        </div>

        {/* Achievement Badge */}
        <div className="bg-white p-6 rounded-[2rem] soft-shadow border border-pastel-lavender/20 flex flex-col items-center justify-center min-w-[140px] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 rotate-12 group-hover:rotate-45 transition-transform duration-700">
            <Sparkles size={80} />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 relative z-10">Total Success</span>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-black text-emerald-500">{targetUser?.routineAchievementCount || 0}</span>
            <span className="text-xs font-bold text-emerald-300">주</span>
          </div>
        </div>
      </div>

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] soft-shadow border border-pastel-lavender/20">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_CONFIG[activeRoutine.status].bg} ${STATUS_CONFIG[activeRoutine.status].color}`}>
                  {STATUS_CONFIG[activeRoutine.status].label} 단계
                </span>
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                  Score: {activeRoutine.score}
                </span>
              </div>
              <h2 className="text-xl font-bold text-pastel-text">
                {isViewingSelf ? '현재 나의 상태 진단' : `${targetUser?.name}님의 상태 진단`}
              </h2>
            </div>
            <div className={`p-3 rounded-2xl ${STATUS_CONFIG[activeRoutine.status].bg} ${STATUS_CONFIG[activeRoutine.status].color}`}>
              <StatusIcon size={24} />
            </div>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed italic">
            "{activeRoutine.diagnosis}"
          </p>
        </div>

        <div className="bg-pastel-purple text-white p-8 rounded-[2.5rem] soft-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 group-hover:rotate-12 transition-transform duration-700">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Weekly Progress</span>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black">{progress}</span>
              <span className="text-xl font-bold mb-1">%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {activeRoutine.days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDayIndex(idx)}
            className={`flex-1 min-w-[80px] p-4 rounded-3xl border transition-all ${
              selectedDayIndex === idx 
                ? 'bg-white border-pastel-purple text-pastel-purple soft-shadow ring-2 ring-pastel-purple/5' 
                : 'bg-white/40 border-pastel-lavender/20 text-zinc-400 hover:bg-white/80'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 italic">Day {idx + 1}</p>
            <p className="text-xs font-bold">
              {day.tasks.filter(t => t.isCompleted).length}/{day.tasks.length}
            </p>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {currentDay.tasks.map((task) => {
            const Icon = TASK_ICONS[task.type] || Timer;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => isViewingSelf && toggleRoutineTask(activeRoutine.id, selectedDayIndex, task.id)}
                className={`group p-6 rounded-[2rem] border transition-all ${
                  task.isCompleted 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-white border-pastel-lavender/20 hover:border-pastel-purple hover:soft-shadow'
                } ${isViewingSelf ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl transition-all ${
                    task.isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-pastel-sand text-zinc-400 group-hover:bg-pastel-purple group-hover:text-white'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className={`text-sm font-bold transition-all ${task.isCompleted ? 'text-emerald-700 line-through' : 'text-pastel-text'}`}>
                      {task.title}
                    </h3>
                    <p className={`text-[10px] leading-relaxed ${task.isCompleted ? 'text-emerald-600/70' : 'text-zinc-400'}`}>
                      {task.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {task.isCompleted ? (
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    ) : (
                      <Circle className="text-zinc-200 group-hover:text-pastel-purple" size={20} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Routine Management */}
      <div className="pt-8 flex justify-between items-center px-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Calendar size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {new Date(activeRoutine.startDate).toLocaleDateString()} - {new Date(activeRoutine.endDate).toLocaleDateString()}
          </span>
        </div>
        {isViewingSelf && (
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 text-pastel-purple text-[10px] font-bold uppercase tracking-widest hover:underline"
          >
            <RefreshCw size={14} />
            새로운 루틴 설계하기
          </button>
        )}
      </div>
    </div>
  );
};
