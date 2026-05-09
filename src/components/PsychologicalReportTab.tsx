
import React, { useState } from 'react';
import { 
  ClipboardList, 
  TrendingUp, 
  ArrowRight, 
  Brain, 
  Smile, 
  Frown,
  RefreshCw,
  Calendar,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { generateWeeklyReport } from '../services/geminiService';
import { CommunityUserSelector } from './CommunityUserSelector';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList
} from 'recharts';

export const PsychologicalReportTab: React.FC = () => {
  const { 
    currentUser, 
    users,
    diaries, 
    counselingRecords, 
    psychologicalReports: allReports, 
    addPsychologicalReport,
    updateUser
  } = useStore();
  
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
  const isViewingSelf = selectedUserId === currentUser?.id;

  const targetUser = users.find(u => u.id === selectedUserId) || currentUser;
  
  const myDiaries = diaries.filter(d => d.userId === selectedUserId);
  const myCounselingRecords = counselingRecords.filter(r => r.userId === selectedUserId);
  const psychologicalReports = allReports.filter(r => r.userId === selectedUserId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("심리 데이터를 정밀 분석 중입니다");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const loadingMessages = [
    "마음의 흐름을 읽어내고 있어요...",
    "한 주간의 감정 파동을 그래프로 그리는 중입니다...",
    "핵심 심리 트리거를 분석하고 있습니다...",
    "더 나은 미래를 위한 방향성을 고민 중입니다...",
    "정성 가득한 심리 리포트를 작성하고 있습니다..."
  ];

  // Mark psychological report as read
  React.useEffect(() => {
    const latest = psychologicalReports[0];
    setSelectedReportId(latest?.id || null);
    
    // If viewing self and there's a new report, mark as read
    if (currentUser && isViewingSelf && latest && latest.id !== currentUser.lastViewedPsychReportId) {
      updateUser(currentUser.id, { lastViewedPsychReportId: latest.id });
    }
  }, [selectedUserId, psychologicalReports.length, currentUser?.id, isViewingSelf]);

  const hasEnoughData = myDiaries.length >= 3 || myCounselingRecords.length >= 3;

  const getThemeColorFromScore = (score: number) => {
    if (score >= 80) return '#D4C6F0'; // Pastel Purple
    if (score >= 60) return '#A7F3D0'; // Pastel Emerald
    if (score >= 40) return '#FEF3C7'; // Pastel Amber
    return '#FECDD3'; // Pastel Rose
  };

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
      const reportData = await generateWeeklyReport(
        myCounselingRecords,
        myDiaries,
        currentUser.id,
        currentUser.name
      );
      
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - 7);

      await addPsychologicalReport({
        ...reportData,
        userId: currentUser.id,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        createdAt: now.toISOString(),
      });

      // Update User Theme Color based on the latest report score
      const newTheme = getThemeColorFromScore(reportData.emotionalShift[reportData.emotionalShift.length - 1]?.score || 50);
      await updateUser(currentUser.id, { themeColor: newTheme });

    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
    }
  };

  const activeReport = psychologicalReports.find(r => r.id === selectedReportId) || psychologicalReports[0];

  if (!activeReport && !isGenerating) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000">
        {/* User Selector */}
        <div className="bg-pastel-sand/20 p-4 rounded-[2rem] border border-pastel-sand/50">
          <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-pastel-text/50 uppercase tracking-[0.2em]">Community Members</span>
            <span className="text-[10px] font-bold text-zinc-400 italic">클릭하여 구성원의 주간 리포트 보기</span>
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
            <ClipboardList size={48} className="animate-pulse" />
          </motion.div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-pastel-text tracking-tight">주간 심리 분석 리포트</h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-lg mx-auto">
              당신의 소중한 상담 기록과 일기를 분석하여<br />
              한 주 동안의 마음의 흐름과 변화를 깊이 있게 분석해 드립니다.
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
              <p className="text-base font-bold text-amber-900">
                {isViewingSelf ? '"아직 분석을 위한 데이터가 조금 부족해요."' : `"${targetUser?.name}님의 데이터가 아직 부족해요."`}
              </p>
              <p className="text-xs text-amber-700/70 font-medium leading-relaxed px-4">
                {isViewingSelf 
                  ? '최소 3개 이상의 일기 기록이나 AI 상담 기록이 쌓여야 정밀한 분석이 가능합니다. 오늘의 기분을 기록하거나 AI와 대화를 시작해 보세요!'
                  : '구성원이 더 많은 기록을 남겨야 심리 분석 리포트를 생성할 수 있습니다.'}
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
          <div className="bg-pastel-sand/30 p-10 rounded-[3rem] border border-pastel-sand/50 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-pastel-purple">
              <Brain size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deep Analysis</span>
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold text-pastel-text">
                {isViewingSelf ? '"기록은 스스로를 보는 거울입니다."' : `"${targetUser?.name}님의 마음 거울 보기"`}
              </p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed px-4">
                {isViewingSelf
                  ? '지난 1~2주간의 감정 데이터와 상담 내용을 바탕으로 현재 당신의 마음이 어디로 향하고 있는지 확인해 보세요.'
                  : '구성원의 최근 감정 데이터와 상담 내용을 바탕으로 현재 어떤 마음 상태인지 확인해 보세요.'}
              </p>
            </div>
            <div className="pt-4">
              {isViewingSelf ? (
                <button
                  onClick={handleGenerate}
                  className="group bg-pastel-purple text-white px-10 py-5 rounded-[2rem] font-bold shadow-xl shadow-pastel-purple/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                >
                  첫 리포트 생성하기
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <p className="text-[10px] font-bold text-zinc-400 italic">리포트 생성을 위해 구성원의 더 많은 활동을 기다려주세요.</p>
              )}
            </div>
          </div>
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
            <Sparkles size={32} />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-pastel-text">심리 데이터를 정밀 분석 중입니다</h2>
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* User Selector */}
      <div className="bg-pastel-sand/20 p-4 rounded-[2rem] border border-pastel-sand/50">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-black text-pastel-text/50 uppercase tracking-[0.2em]">Community Members</span>
          <span className="text-[10px] font-bold text-zinc-400 italic">클릭하여 구성원의 주간 리포트 보기</span>
        </div>
        <CommunityUserSelector 
          users={users} 
          selectedUserId={selectedUserId} 
          onSelect={setSelectedUserId} 
        />
      </div>

      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-pastel-text tracking-tight">
            {isViewingSelf ? '나의 심리 변화 리포트' : `${targetUser?.name}님의 심리 변화 리포트`}
          </h2>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
            {new Date(activeReport.startDate).toLocaleDateString()} - {new Date(activeReport.endDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <select 
            className="bg-white border-pastel-lavender/20 rounded-2xl px-4 py-2 text-xs font-bold text-zinc-500 soft-shadow focus:outline-none focus:ring-2 focus:ring-pastel-purple/20 transition-all cursor-pointer"
            value={selectedReportId || ''}
            onChange={(e) => setSelectedReportId(e.target.value)}
          >
            {psychologicalReports.map(r => (
              <option key={r.id} value={r.id}>
                {new Date(r.createdAt).toLocaleDateString()} 리포트
              </option>
            ))}
          </select>
          {isViewingSelf && (
            <button
              onClick={handleGenerate}
              className="p-3 bg-white border border-pastel-lavender/20 rounded-2xl text-pastel-purple soft-shadow hover:scale-105 active:scale-95 transition-all"
              title="새 리포트 생성"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary Card */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-pastel-purple">
              <Sparkles size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Weekly Insight</span>
            </div>
            <p className="text-xl font-bold text-pastel-text leading-tight">
              {activeReport.summary}
            </p>
          </div>

          <div className="h-px bg-pastel-lavender/10"></div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-pastel-text flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              마음의 흐름 (Mental Trend)
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium whitespace-pre-wrap">
              {activeReport.mentalTrend}
            </p>
          </div>
        </div>

        {/* Directionality Card */}
        <div className="bg-pastel-purple text-white p-10 rounded-[3rem] soft-shadow space-y-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
            <Brain size={200} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 text-white/80">
              <ArrowRight size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Future Direction</span>
            </div>
            <h3 className="text-2xl font-black">나아갈 방향</h3>
            <p className="text-sm text-white/90 leading-relaxed font-medium italic">
              "{activeReport.directionality}"
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 space-y-8">
        <h3 className="text-base font-black text-pastel-text flex items-center gap-2">
          <TrendingUp size={18} className="text-pastel-purple" />
          정서적 변화 추이
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeReport.emotionalShift}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4C6F0" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#D4C6F0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 'bold', fill: '#A1A1AA'}}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis 
                hide 
                domain={[0, 100]} 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 rounded-2xl shadow-xl border border-pastel-lavender/20">
                        <p className="text-[10px] font-bold text-zinc-400 mb-1">{payload[0].payload.date}</p>
                        <p className="text-sm font-black text-pastel-purple">{payload[0].value} 점</p>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1">핵심 감정: {payload[0].payload.emotion}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#D4C6F0" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorScore)" 
              >
                <LabelList 
                  dataKey="emotion" 
                  position="top" 
                  offset={10}
                  style={{ fontSize: '10px', fontWeight: 'bold', fill: '#D4C6F0' }}
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-50/50 p-10 rounded-[3rem] border border-emerald-100/50 space-y-6">
          <div className="flex items-center gap-2 text-emerald-500">
            <Smile size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Positive Triggers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeReport.positiveTriggers.map((t, idx) => (
              <span key={idx} className="bg-white px-4 py-2 rounded-2xl text-xs font-bold text-emerald-600 shadow-sm">
                # {t}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-rose-50/50 p-10 rounded-[3rem] border border-rose-100/50 space-y-6">
          <div className="flex items-center gap-2 text-rose-400">
            <Frown size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Negative Triggers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeReport.negativeTriggers.map((t, idx) => (
              <span key={idx} className="bg-white px-4 py-2 rounded-2xl text-xs font-bold text-rose-500 shadow-sm">
                # {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
