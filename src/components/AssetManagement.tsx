
import React, { useState } from 'react';
import { 
  PiggyBank, TrendingUp, Landmark, ShieldCheck, Target, ArrowRight, ArrowLeft, 
  ChevronRight, BrainCircuit, Wallet, PieChart, CheckCircle2, AlertCircle, Sparkles, Loader2, RefreshCcw
} from 'lucide-react';
import { useStore } from '../store';
import { AssetSurvey, TransactionType } from '../../types';
import { analyzeAssets } from '../services/assetManagementService';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Markdown from 'react-markdown';

export const AssetManagement: React.FC = () => {
  const { 
    assetSurvey, setAssetSurvey, assetAnalysis, setAssetAnalysis, resetAssetSurvey,
    transactions, categories
  } = useStore();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 'STEP1', title: '기초 자산', icon: Landmark, description: '현재 보유하신 총자산과 부채 규모를 파악합니다.' },
    { id: 'STEP2', title: '현금 흐름', icon: Wallet, description: '가계부 데이터를 기반으로 월간 수지 및 비정기 지출을 분석합니다.' },
    { id: 'STEP3', title: '투자 성향', icon: ShieldCheck, description: '사용자님의 위험 감내 수준과 투자 경험을 확인합니다.' },
    { id: 'STEP4', title: '재무 목표', icon: Target, description: '이루고 싶은 목표와 달성 시점을 설정합니다.' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === assetSurvey.status);
  
  const handleNext = () => {
    if (assetSurvey.status === 'IDLE') setAssetSurvey({ status: 'STEP1' });
    else if (assetSurvey.status === 'STEP1') setAssetSurvey({ status: 'STEP2' });
    else if (assetSurvey.status === 'STEP2') setAssetSurvey({ status: 'STEP3' });
    else if (assetSurvey.status === 'STEP3') setAssetSurvey({ status: 'STEP4' });
    else if (assetSurvey.status === 'STEP4') handleAnalyze();
  };

  const handlePrev = () => {
    if (assetSurvey.status === 'STEP1') setAssetSurvey({ status: 'IDLE' });
    else if (assetSurvey.status === 'STEP2') setAssetSurvey({ status: 'STEP1' });
    else if (assetSurvey.status === 'STEP3') setAssetSurvey({ status: 'STEP2' });
    else if (assetSurvey.status === 'STEP4') setAssetSurvey({ status: 'STEP3' });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAssetSurvey({ status: 'ANALYSIS' });

    try {
      // 가계부 요약 생성
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyTrans = transactions.filter(t => t.date.startsWith(currentMonth));
      
      const summary = categories.map(cat => {
        const total = monthlyTrans
          .filter(t => t.categoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return `${cat.name}: ${total.toLocaleString()}원`;
      }).join(', ');

      const analysis = await analyzeAssets(assetSurvey, summary);
      setAssetAnalysis(analysis);
      setAssetSurvey({ status: 'COMPLETED' });
    } catch (err) {
      console.error(err);
      setError("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setAssetSurvey({ status: 'STEP4' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const COLORS = ['#D4C6F0', '#F7D1BA', '#A7E8BD', '#F9E2E6', '#B2D8E5'];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-pastel-lavender/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-purple/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pastel-purple/10 text-pastel-purple rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
             <BrainCircuit size={12} /> AI Asset Manager
          </div>
          <h2 className="text-3xl font-black text-pastel-text tracking-tight mb-2">프리미엄 AI 자산관리</h2>
          <p className="text-sm font-medium text-zinc-400">15년 경력 CFP의 전문성과 AI의 데이터 분석이 만났습니다.</p>
        </div>
        {(assetSurvey.status === 'COMPLETED' || assetSurvey.status === 'ANALYSIS') && (
          <button 
            onClick={resetAssetSurvey}
            className="flex items-center gap-2 px-6 py-3 bg-pastel-sand/30 hover:bg-pastel-sand/50 text-zinc-400 rounded-2xl text-xs font-bold transition-all relative z-10"
          >
            <RefreshCcw size={14} /> 처음부터 다시하기
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {assetSurvey.status === 'IDLE' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-pastel-lavender/10 text-center space-y-10"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-pastel-purple/20 to-pastel-rose/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-pastel-purple shadow-inner">
               <TrendingUp size={48} />
            </div>
            <div className="space-y-4 max-w-lg mx-auto">
              <h3 className="text-2xl font-black text-pastel-text">당신만의 투자 로드맵을 그려보세요</h3>
              <p className="text-sm leading-relaxed text-zinc-400 font-medium italic">
                "가계부 데이터를 바탕으로 불필요한 지출을 찾고, 목돈을 모을 수 있는 최적의 자산 배분 전략을 3분 만에 차트로 보여드립니다."
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {steps.map((s, idx) => (
                <div key={s.id} className="p-6 bg-pastel-sand/20 rounded-3xl border border-transparent hover:border-pastel-lavender/20 transition-all flex flex-col items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-pastel-purple">
                    <s.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-pastel-text uppercase tracking-widest">{idx + 1}. {s.title}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="w-full max-w-sm mx-auto bg-pastel-purple text-white py-5 rounded-[2rem] font-bold uppercase tracking-[0.2em] shadow-lg shadow-pastel-purple/20 hover:brightness-95 transition-all flex items-center justify-center gap-3"
            >
              진단 시작하기 <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {assetSurvey.status.startsWith('STEP') && (
          <motion.div 
            key="survey"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3.5rem] shadow-2xl border border-pastel-lavender/10 overflow-hidden flex flex-col min-h-[600px]"
          >
            {/* Survey Progress */}
            <div className="flex bg-pastel-sand/20 border-b border-pastel-lavender/10">
              {steps.map((s, idx) => (
                <div 
                  key={s.id} 
                  className={`flex-1 p-6 text-center border-r border-pastel-lavender/10 last:border-0 transition-colors ${currentStepIndex >= idx ? 'bg-white' : 'opacity-40'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-[10px] font-black ${currentStepIndex >= idx ? 'bg-pastel-purple text-white' : 'bg-pastel-sand text-zinc-400'}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${currentStepIndex >= idx ? 'text-pastel-purple' : 'text-zinc-400'}`}>{s.title}</span>
                </div>
              ))}
            </div>

            <div className="p-12 flex-1 space-y-12">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-pastel-text flex items-center gap-3">
                  <span className="p-2 bg-pastel-purple/10 text-pastel-purple rounded-xl">
                    {steps[currentStepIndex].icon && React.createElement(steps[currentStepIndex].icon, { size: 24 })}
                  </span>
                  {steps[currentStepIndex].title}
                </h3>
                <p className="text-sm font-medium text-zinc-400">{steps[currentStepIndex].description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {assetSurvey.status === 'STEP1' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">예적금 (현금성)</label>
                      <input type="number" value={assetSurvey.step1.savings} onChange={e => setAssetSurvey({ step1: { ...assetSurvey.step1, savings: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">주식/펀드/채권</label>
                      <input type="number" value={assetSurvey.step1.stocks} onChange={e => setAssetSurvey({ step1: { ...assetSurvey.step1, stocks: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">부동산 (자가/전세)</label>
                      <input type="number" value={assetSurvey.step1.realEstate} onChange={e => setAssetSurvey({ step1: { ...assetSurvey.step1, realEstate: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">총 부채 (대출/카드)</label>
                      <input type="number" value={assetSurvey.step1.debt} onChange={e => setAssetSurvey({ step1: { ...assetSurvey.step1, debt: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold border-rose-100 border outline-none" />
                    </div>
                  </>
                )}

                {assetSurvey.status === 'STEP2' && (
                  <div className="col-span-2 space-y-8">
                    <div className="p-8 bg-pastel-purple/5 rounded-[2rem] border border-pastel-lavender/30">
                       <p className="text-xs font-bold text-pastel-purple leading-relaxed">💡 가계부 데이터를 기반으로 이번 달 지출 내역을 분석하고 있습니다. 아래에는 가계부에 잡히지 않거나 예측되는 추가 비정기 지출(연간 세금, 경조사비 등)을 입력해 주세요.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">월평균 비정기 지출 (수선비, 보험료, 세금 등)</label>
                      <input type="number" value={assetSurvey.step2.irregularExpenses} onChange={e => setAssetSurvey({ step2: { irregularExpenses: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                  </div>
                )}

                {assetSurvey.status === 'STEP3' && (
                  <>
                    <div className="col-span-2 space-y-4">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">투자 성향 (Risk Tolerance)</label>
                      <div className="flex gap-4">
                        {[
                          { id: 'CONSERVATIVE', label: '안정형', desc: '원금 보존이 최우선입니다.' },
                          { id: 'MODERATE', label: '중립형', desc: '적절한 성장을 기대합니다.' },
                          { id: 'AGGRESSIVE', label: '공격형', desc: '높은 수익을 추구합니다.' }
                        ].map(r => (
                          <button 
                            key={r.id}
                            onClick={() => setAssetSurvey({ step3: { ...assetSurvey.step3, riskTolerance: r.id as any }})}
                            className={`flex-1 p-6 rounded-3xl text-left transition-all border ${assetSurvey.step3.riskTolerance === r.id ? 'bg-white border-pastel-purple shadow-lg' : 'bg-pastel-sand/20 border-transparent opacity-60'}`}
                          >
                             <span className="text-sm font-black text-pastel-text block mb-1">{r.label}</span>
                             <span className="text-[10px] font-bold text-zinc-400">{r.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">투자 경험 (보유 종목, 기간 등)</label>
                      <input type="text" value={assetSurvey.step3.experience} onChange={e => setAssetSurvey({ step3: { ...assetSurvey.step3, experience: e.target.value }})} placeholder="예: 주식 3년, 비트코인 1년" className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">목표 수익률 (%)</label>
                      <input type="number" value={assetSurvey.step3.targetReturn} onChange={e => setAssetSurvey({ step3: { ...assetSurvey.step3, targetReturn: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                  </>
                )}

                {assetSurvey.status === 'STEP4' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">재무 목표</label>
                      <input type="text" value={assetSurvey.step4.goal} onChange={e => setAssetSurvey({ step4: { ...assetSurvey.step4, goal: e.target.value }})} placeholder="예: 3년 뒤 아파트 입주금 마련" className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">필요 금액 (원)</label>
                      <input type="number" value={assetSurvey.step4.targetAmount} onChange={e => setAssetSurvey({ step4: { ...assetSurvey.step4, targetAmount: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">목표 기간 (개월)</label>
                      <input type="number" value={assetSurvey.step4.period} onChange={e => setAssetSurvey({ step4: { ...assetSurvey.step4, period: Number(e.target.value) }})} className="w-full p-6 bg-pastel-sand/20 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-10 border-t border-pastel-lavender/10 flex justify-between gap-4">
              <button 
                onClick={handlePrev}
                className="px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-pastel-sand/30 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={16} /> 이전
              </button>
              <button 
                onClick={handleNext}
                className="px-12 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest bg-pastel-purple text-white shadow-lg hover:brightness-95 transition-all flex items-center gap-2"
              >
                {assetSurvey.status === 'STEP4' ? '분석 시작' : '다음 단계'} <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {assetSurvey.status === 'ANALYSIS' && (
          <motion.div 
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-20 rounded-[4rem] shadow-2xl border border-pastel-lavender/10 text-center space-y-12"
          >
             <div className="relative inline-block">
                <div className="w-32 h-32 bg-pastel-purple/10 rounded-full flex items-center justify-center text-pastel-purple">
                   <Loader2 size={64} className="animate-spin text-pastel-purple/40" />
                   <Sparkles size={32} className="absolute inset-0 m-auto animate-pulse" />
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-2xl font-black text-pastel-text">AI 부의 지도를 그리는 중입니다...</h3>
                <p className="text-sm font-medium text-zinc-400 max-w-sm mx-auto">사용자님의 가계부 지출 패턴과 자산 현황을 분석하여 <br/>최적화된 포트폴리오를 구성하고 있습니다.</p>
             </div>
             <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-pastel-purple rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-pastel-purple rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-pastel-purple rounded-full animate-bounce"></div>
             </div>
          </motion.div>
        )}

        {assetSurvey.status === 'COMPLETED' && assetAnalysis && (
          <motion.div 
            key="completed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pastel-lavender/20 flex flex-col items-center gap-3">
                 <div className="w-12 h-12 bg-pastel-sand/30 rounded-2xl flex items-center justify-center text-pastel-purple">
                    <TrendingUp size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-black uppercase text-zinc-300 tracking-widest mb-1">순자산 (Net Worth)</p>
                    <p className="text-lg font-black text-pastel-text">{(assetAnalysis.netWorth / 10000).toLocaleString()}만원</p>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pastel-lavender/20 flex flex-col items-center gap-3">
                 <div className="w-12 h-12 bg-pastel-purple/10 rounded-2xl flex items-center justify-center text-pastel-purple">
                    <TrendingUp size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-black uppercase text-zinc-300 tracking-widest mb-1">재무 점수 (Score)</p>
                    <p className="text-lg font-black text-pastel-text">{assetAnalysis.healthScore} / 5</p>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pastel-lavender/20 flex flex-col items-center gap-3">
                 <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400">
                    <PieChart size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-black uppercase text-zinc-300 tracking-widest mb-1">절감 목표액 (Saved)</p>
                    <p className="text-lg font-black text-rose-400">{(assetAnalysis.reducibleExpenses / 10000).toLocaleString()}만원</p>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pastel-lavender/20 flex flex-col items-center gap-3">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-400">
                    <TrendingUp size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-black uppercase text-zinc-300 tracking-widest mb-1">추가 투자 (Inv.)</p>
                    <p className="text-lg font-black text-emerald-400">{(assetAnalysis.additionalInvestment / 10000).toLocaleString()}만원</p>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Asset Allocation Chart */}
              <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] shadow-xl border border-pastel-lavender/10 flex flex-col space-y-10">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black text-pastel-text flex items-center gap-3">
                      <PieChart size={20} className="text-pastel-purple" /> 추천 자산 배분
                   </h3>
                   <span className="text-[10px] font-bold text-zinc-400 bg-pastel-sand/30 px-3 py-1 rounded-full uppercase">Optimal Portfolio</span>
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={assetAnalysis.recommendedAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={140}
                        paddingAngle={5}
                        dataKey="percentage"
                        nameKey="category"
                      >
                        {assetAnalysis.recommendedAllocation.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {assetAnalysis.recommendedAllocation.map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-pastel-sand/20 border border-transparent hover:border-pastel-lavender/20 flex flex-col gap-1 items-center transition-all">
                       <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                       <span className="text-[10px] font-black text-zinc-400 truncate w-full text-center">{item.category}</span>
                       <span className="text-sm font-black text-pastel-text">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Advice & Action Plans */}
              <div className="flex flex-col gap-8">
                 {/* AI Message */}
                 <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-pastel-lavender/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-pastel-purple/10 pointer-events-none group-hover:scale-110 transition-transform">
                       <BrainCircuit size={80} />
                    </div>
                    <div className="relative space-y-6">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-pastel-purple" />
                        <span className="text-[10px] font-black uppercase text-pastel-purple tracking-widest">CFP AI Advisor</span>
                      </div>
                      <div className="prose prose-sm leading-relaxed text-pastel-text prose-p:mb-4 prose-strong:text-pastel-purple prose-ul:list-disc prose-ul:pl-4 markdown-body">
                        <Markdown>{assetAnalysis.aiAdvice}</Markdown>
                      </div>
                    </div>
                 </div>

                 {/* Action Plans */}
                 <div className="bg-pastel-purple p-10 rounded-[3rem] shadow-xl shadow-pastel-purple/20 text-white space-y-8">
                    <h4 className="text-base font-black flex items-center gap-3">
                       <CheckCircle2 size={20} /> 실천 액션 플랜
                    </h4>
                    <div className="space-y-4">
                      {assetAnalysis.actionPlans.map((plan, idx) => (
                        <div key={idx} className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 space-y-2">
                           <span className="inline-block px-2 py-0.5 bg-white text-pastel-purple rounded-md text-[9px] font-black mb-1">ACTION {idx + 1}</span>
                           <h5 className="text-xs font-black">{plan.title}</h5>
                           <p className="text-[10px] font-medium text-white/70 leading-relaxed">{plan.description}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="max-w-sm mx-auto p-6 bg-rose-50 text-rose-500 rounded-3xl flex items-center gap-3 border border-rose-100 shadow-sm animate-in shake duration-500">
           <AlertCircle size={20} />
           <p className="text-xs font-bold">{error}</p>
        </div>
      )}
    </div>
  );
};
