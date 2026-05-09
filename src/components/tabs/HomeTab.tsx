import React from 'react';
import { CreditCard, BookHeart, Calendar as CalendarIcon, Clock, PieChart as PieChartIcon, LayoutPanelLeft, BrainCircuit } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { UserAvatar } from '../UserAvatar';
import { renderCategoryIcon } from '../../../App';
import { useStore } from '../../store';
import { TransactionType } from '../../../types';

interface HomeTabProps {
  onTabChange: (tab: 'HOME' | 'WALLET' | 'DIARY') => void;
  onOpenCounselingHistory: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onTabChange, onOpenCounselingHistory }) => {
  const currentUser = useStore((state) => state.currentUser);
  const transactions = useStore((state) => state.transactions);
  const diaries = useStore((state) => state.diaries);
  const schedules = useStore((state) => state.schedules);
  const users = useStore((state) => state.users);
  const categories = useStore((state) => state.categories);
  const updateUser = useStore((state) => state.updateUser);

  React.useEffect(() => {
    const allActivities = [
      ...diaries.map(d => ({ id: d.id, createdAt: d.createdAt || d.date })),
      ...transactions.map(t => ({ id: t.id, createdAt: t.createdAt || t.date })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const latest = allActivities[0];
    if (currentUser && latest && latest.id !== currentUser.lastViewedActivityId) {
      updateUser(currentUser.id, { lastViewedActivityId: latest.id });
    }
  }, [diaries, transactions, currentUser?.id, updateUser]);

  const monthlyStats = React.useMemo(() => {
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const expense = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const chartData = categories
      .filter(c => c.type === TransactionType.EXPENSE)
      .map(cat => {
        const value = currentMonthTransactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0);
        return { name: cat.name, value, color: cat.color };
      })
      .filter(d => d.value > 0);

    return { expense, income, chartData };
  }, [transactions, categories]);

  const recentDiary = diaries[0];
  const upcomingSchedules = [...schedules]
    .filter(s => !s.isCompleted)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
    .slice(0, 3);

  if (!currentUser) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-8">
         <div className="bg-gradient-to-br from-pastel-purple/10 to-white p-12 rounded-[3.5rem] soft-shadow border border-pastel-lavender/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-pastel-purple/5 opacity-40 group-hover:scale-110 transition-transform"><LayoutPanelLeft size={200} /></div>
            <div className="relative z-10">
              <span className="text-[11px] font-bold text-pastel-purple uppercase tracking-[0.2em] block mb-3">Welcome Home, {currentUser.name}</span>
              <h2 className="text-4xl font-bold tracking-tighter leading-tight">우리가 함께 만드는<br/>소중한 일상</h2>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div 
                   onClick={() => onTabChange('WALLET')}
                   className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white cursor-pointer hover:bg-white transition-all hover:scale-[1.02] soft-shadow"
                 >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">이번 달 가계부</span>
                      <CreditCard size={18} className="text-emerald-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold tracking-tighter tabular-nums text-pastel-text">-{monthlyStats.expense.toLocaleString()}원</p>
                      <p className="text-[10px] font-bold text-emerald-500">+{monthlyStats.income.toLocaleString()}원 수입</p>
                    </div>
                 </div>
                 <div 
                   onClick={() => onTabChange('DIARY')}
                   className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white cursor-pointer hover:bg-white transition-all hover:scale-[1.02] soft-shadow"
                 >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">다가오는 일정</span>
                      <CalendarIcon size={18} className="text-pastel-purple" />
                    </div>
                    <p className="text-2xl font-bold tracking-tighter tabular-nums text-pastel-purple">{upcomingSchedules.length}개의 일정</p>
                    <p className="text-[10px] font-bold text-zinc-400 mt-1">가장 가까운 일정: {upcomingSchedules[0]?.title || '없음'}</p>
                 </div>
                 <div 
                   onClick={() => onTabChange('WALLET')}
                   className="bg-pastel-purple text-white p-8 rounded-[2.5rem] border border-pastel-purple cursor-pointer hover:brightness-95 transition-all hover:scale-[1.02] shadow-xl shadow-pastel-purple/20"
                 >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">AI 자산 관리</span>
                      <BrainCircuit size={18} className="text-white/80" />
                    </div>
                    <p className="text-2xl font-bold tracking-tighter">투자 진단하기</p>
                    <p className="text-[10px] font-bold text-white/60 mt-1">가계부 기반 맞춤 포트폴리오 제안</p>
                 </div>
                 <div 
                   onClick={onOpenCounselingHistory}
                   className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white cursor-pointer hover:bg-white transition-all hover:scale-[1.02] soft-shadow"
                 >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">마음 건강 관리</span>
                      <BrainCircuit size={18} className="text-rose-300" />
                    </div>
                    <p className="text-2xl font-bold tracking-tighter text-pastel-text">상담 기록 확인하기</p>
                    <p className="text-[10px] font-bold text-zinc-400 mt-1">AI 1급 상담사와 나눈 대화 보관함</p>
                 </div>
              </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Wallet Chart Summary */}
         <section className="bg-white p-10 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20 flex flex-col h-[450px]">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-base font-bold flex items-center gap-3"><PieChartIcon size={20} className="text-emerald-300" /> 지출 요약</h3>
               <button onClick={() => onTabChange('WALLET')} className="text-[10px] font-bold text-pastel-purple uppercase tracking-widest hover:underline">통계보기</button>
            </div>
            <div className="flex-1 w-full">
               {monthlyStats.chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                         data={monthlyStats.chartData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={90}
                         paddingAngle={5}
                         dataKey="value"
                         label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                       >
                          {monthlyStats.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <RechartsTooltip 
                         contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                         formatter={(value: number) => `${value.toLocaleString()}원`}
                       />
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-bold uppercase tracking-widest">데이터 없음</div>
               )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
               {monthlyStats.chartData.slice(0, 4).map((d, i) => (
                 <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-bold text-zinc-400 truncate">{d.name}</span>
                 </div>
               ))}
            </div>
         </section>

         {/* Recent Diary */}
         <div className="lg:col-span-2">
            <section className="bg-white p-10 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20 h-[450px] flex flex-col">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-base font-bold flex items-center gap-3"><BookHeart size={20} className="text-pastel-purple" /> 최근 일기</h3>
                  <button onClick={() => onTabChange('DIARY')} className="text-[10px] font-bold text-pastel-purple uppercase tracking-widest hover:underline">전체보기</button>
               </div>
               <div className="flex-1 overflow-hidden">
                  {recentDiary ? (
                    <div className="space-y-6">
                       <div className="flex items-center gap-4">
                          <UserAvatar 
                            avatar={users.find(u => u.id === recentDiary.userId)?.avatar || ''} 
                            name={users.find(u => u.id === recentDiary.userId)?.name || ''} 
                            color={users.find(u => u.id === recentDiary.userId)?.color || '#ccc'} 
                            size="lg"
                          />
                          <div>
                             <p className="text-sm font-bold text-pastel-text">{users.find(u => u.id === recentDiary.userId)?.name}</p>
                             <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">{recentDiary.date}</p>
                          </div>
                       </div>
                       <div className="bg-pastel-sand/20 p-8 rounded-[2.5rem] border border-pastel-sand/30">
                          <h4 className="text-lg font-bold text-pastel-text mb-4">{recentDiary.title}</h4>
                          <p className="text-sm font-medium text-zinc-500 leading-relaxed line-clamp-4">
                             {recentDiary.text.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, "")}
                           </p>
                       </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                      <BookHeart size={48} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">첫 번째 일기를 남겨보세요</p>
                    </div>
                  )}
               </div>
            </section>
         </div>
      </div>

      {/* Schedules Section */}
      <section className="bg-white p-10 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-bold flex items-center gap-3"><CalendarIcon size={20} className="text-emerald-300" /> 예정된 일정</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingSchedules.length === 0 ? (
              <div className="col-span-3 py-10 text-center opacity-20 text-[10px] font-bold uppercase tracking-widest">예정된 일정이 없습니다.</div>
            ) : (
              upcomingSchedules.map(s => (
                <div key={s.id} className="bg-pastel-sand/30 p-6 rounded-[2rem] flex items-center gap-4 hover:bg-pastel-sand/50 transition-colors">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pastel-purple shadow-sm"><Clock size={20} /></div>
                   <div>
                      <p className="text-sm font-bold text-pastel-text line-clamp-1">{s.title}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{s.date} {s.time}</p>
                   </div>
                </div>
              ))
            )}
         </div>
      </section>
    </div>
  );
};
