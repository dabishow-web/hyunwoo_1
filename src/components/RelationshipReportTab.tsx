
import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  MessageCircle, 
  Heart,
  Brain,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { generateRelationshipReport } from '../services/geminiService';

export const RelationshipReportTab: React.FC = () => {
  const { 
    currentUser, 
    users,
    diaries, 
    counselingRecords, 
    relationshipReports, 
    addRelationshipReport 
  } = useStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("공동체의 역학을 분석 중입니다");
  const [error, setError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const loadingMessages = [
    "우리 사이의 특별한 시너지를 읽어내고 있어요...",
    "공동체 구성원의 정서적 상호작용을 분석 중입니다...",
    "서로에게 주는 긍정적인 트리거를 찾아내고 있습니다...",
    "함께할 때 더 빛나는 순간들을 포착 중입니다...",
    "더 행복한 공동 생활을 위한 맞춤형 팁을 고민 중입니다..."
  ];

  // Auto-select newest report when available
  React.useEffect(() => {
    const latest = relationshipReports[0];
    if (!selectedReportId && latest) {
      setSelectedReportId(latest.id);
    }
    
    // Mark as read if there's a latest report and it's new
    if (currentUser && latest && latest.id !== currentUser.lastViewedRelReportId) {
      useStore.getState().updateUser(currentUser.id, { lastViewedRelReportId: latest.id });
    }
  }, [relationshipReports, selectedReportId, currentUser?.id]);

  const hasEnoughData = diaries.length >= 5 || counselingRecords.length >= 5;

  const handleGenerate = async () => {
    if (!currentUser) return;
    if (!hasEnoughData) return;
    setIsGenerating(true);
    setError(null);
    setLoadingMessage(loadingMessages[0]);

    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = loadingMessages.indexOf(prev);
        return loadingMessages[(currentIndex + 1) % loadingMessages.length];
      });
    }, 3000);

    try {
      const reportData = await generateRelationshipReport(
        diaries,
        counselingRecords,
        users
      );
      
      await addRelationshipReport({
        ...reportData,
        createdAt: new Date().toISOString(),
      });
      // Clear error and force selection of the fresh report that will be at [0]
      setError(null);
      setTimeout(() => {
        const { relationshipReports: latestReports } = useStore.getState();
        if (latestReports.length > 0) {
          setSelectedReportId(latestReports[0].id);
        }
      }, 1500); 
    } catch (err: any) {
      setError(err.message || "리포트 생성 중 문제가 발생했습니다.");
      console.error("Failed to generate relationship report:", err);
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
    }
  };

  const activeReport = relationshipReports.find(r => r.id === selectedReportId) || relationshipReports[0];

  if (!activeReport && !isGenerating) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000">
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-emerald-100 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"
          >
            <Users size={48} className="animate-pulse" />
          </motion.div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-pastel-text tracking-tight">관계 & 시너지 리포트</h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-lg mx-auto">
              공동체 구성원들의 심리 상태와 일상을 분석하여<br />
              서로에게 어떤 긍정적 시너지를 주는지 깊이 있게 분석해 드립니다.
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
              <p className="text-base font-bold text-amber-900">"공동체 데이터가 조금 더 필요해요."</p>
              <p className="text-xs text-amber-700/70 font-medium leading-relaxed px-4">
                구성원들의 일기와 상담 기록이 최소 5개 이상 쌓여야<br/>
                서로의 영향력과 관계 역동성을 정확히 분석할 수 있습니다.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-center gap-4 text-amber-600 font-bold text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} /> 공동체 기록 ({diaries.length + counselingRecords.length}/5)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-indigo-500">
              <Brain size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synergy Analysis</span>
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold text-pastel-text">"우리 사이의 숨겨진 빛을 찾아보세요."</p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed px-4">
                서로가 서로에게 어떤 긍정 트리거가 되는지,<br/>
                함께할 때 더 빛나는 순간들을 AI가 포착해 드립니다.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={handleGenerate}
                className="group bg-indigo-500 text-white px-10 py-5 rounded-[2rem] font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-3 mx-auto"
              >
                관계 리포트 시작하기
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
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
          <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-indigo-500 animate-pulse">
            <Sparkles size={32} />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-pastel-text">공동체의 역학을 분석 중입니다</h2>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-pastel-text tracking-tight">관계 & 시너지 리포트</h2>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
            Community Synergy Analysis
          </p>
        </div>

          <div className="flex gap-2">
            {error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-bold animate-in fade-in slide-in-from-right-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <select 
              className="bg-white border-pastel-lavender/20 rounded-2xl px-4 py-2 text-xs font-bold text-zinc-500 soft-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              value={selectedReportId || ''}
              onChange={(e) => setSelectedReportId(e.target.value)}
            >
            {relationshipReports.map(r => (
              <option key={r.id} value={r.id}>
                {new Date(r.createdAt).toLocaleDateString()} 분석 결과
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            className="p-3 bg-white border border-pastel-lavender/20 rounded-2xl text-indigo-500 soft-shadow hover:scale-105 active:scale-95 transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 space-y-6">
          <div className="flex items-center gap-2 text-indigo-500">
            <Sparkles size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Summary</span>
          </div>
          <p className="text-xl font-bold text-pastel-text leading-tight">
            {activeReport.summary}
          </p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 space-y-6">
          <div className="flex items-center gap-2 text-emerald-500">
            <TrendingUp size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synergy Analysis</span>
          </div>
          <div className="text-sm font-medium text-zinc-500 leading-relaxed whitespace-pre-wrap">
            {activeReport.synergyAnalysis}
          </div>
        </div>

        <div className="bg-indigo-600 text-white p-10 rounded-[3rem] soft-shadow space-y-6">
          <div className="flex items-center gap-2 text-white/80">
            <Heart size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Positive Triggers</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeReport.positiveTriggers.map((t, idx) => (
              <div key={idx} className="flex gap-3 items-center p-4 bg-white/10 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</div>
                <p className="text-xs font-bold leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 space-y-6">
          <div className="flex items-center gap-2 text-amber-500">
            <MessageCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tips for Better Life</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeReport.recommendations.map((rec, idx) => (
              <div key={idx} className="p-6 bg-pastel-sand/20 rounded-2xl border border-pastel-sand/30 flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                <p className="text-xs font-bold text-pastel-text leading-relaxed">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
