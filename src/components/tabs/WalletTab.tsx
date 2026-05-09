import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, List, PieChart as PieChartIcon, LayoutPanelLeft, CreditCard, Trash2, Settings, BarChart3, Repeat, MapPin, Image as ImageIcon, Heart, MessageSquare, TrendingUp,
  ExternalLink, Copy, Coffee
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList
} from 'recharts';
import { renderCategoryIcon } from '../../../App';
import { TransactionType, Category, BudgetStatus, FixedExpense, Transaction, Comment, ToastType } from '../../../types';
import { CalendarView } from '../CalendarView';
import { BudgetCard } from '../BudgetCard';
import { CategoryDetailModal } from '../CategoryDetailModal';
import { TransactionForm } from '../TransactionForm';
import { CommentSection } from '../CommentSection';
import { useStore } from '../../store';
import { AssetManagement } from '../AssetManagement';
import { motion, AnimatePresence } from 'motion/react';

interface WalletTabProps {
  onOpenBudgetModal: () => void;
  onConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onShowToast?: (message: string, type: ToastType) => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({ onOpenBudgetModal, onConfirm, onShowToast }) => {
  const [walletSubTab, setWalletSubTab] = useState<'SUMMARY' | 'LIST' | 'BUDGET' | 'STATS' | 'FIXED' | 'ASSET'>('SUMMARY');
  const [historyDate, setHistoryDate] = useState(new Date());
  const [selectedWalletDate, setSelectedWalletDate] = useState<string | null>(null);
  const [selectedSummaryCategory, setSelectedSummaryCategory] = useState<Category | null>(null);
  const [isAddingFromCalendar, setIsAddingFromCalendar] = useState(false);

  const transactions = useStore(state => state.transactions);
  const categories = useStore(state => state.categories);
  const users = useStore(state => state.users);
  const currentUser = useStore(state => state.currentUser);
  const fixedExpenses = useStore(state => state.fixedExpenses);
  const deleteTransaction = useStore(state => state.deleteTransaction);
  const updateTransaction = useStore(state => state.updateTransaction);
  const addTransaction = useStore(state => state.addTransaction);
  const deleteFixedExpense = useStore(state => state.deleteFixedExpense);
  const toggleTransactionLike = useStore(state => state.toggleTransactionLike);
  const addTransactionComment = useStore(state => state.addTransactionComment);
  const updateUser = useStore(state => state.updateUser);

  React.useEffect(() => {
    const latest = transactions[0];
    if (currentUser && latest && latest.id !== currentUser.lastViewedTransactionId) {
      updateUser(currentUser.id, { lastViewedTransactionId: latest.id });
    }
  }, [transactions, currentUser?.id, updateUser]);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [showRemitFor, setShowRemitFor] = useState<string | null>(null);

  const changeMonth = (offset: number) => {
    setHistoryDate(new Date(historyDate.getFullYear(), historyDate.getMonth() + offset, 1));
    setSelectedWalletDate(null);
  };

  const filteredTransactions = useMemo(() => {
    const targetYear = historyDate.getFullYear();
    const targetMonth = historyDate.getMonth();
    return transactions.filter(t => {
      const d = new Date(t.date);
      const isCorrectMonth = d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      if (!selectedWalletDate) return isCorrectMonth;
      return isCorrectMonth && t.date === selectedWalletDate;
    });
  }, [transactions, historyDate, selectedWalletDate]);

  const handleDateClick = (date: string) => {
    setSelectedWalletDate(date);
    const hasTransactions = transactions.some(t => t.date === date);
    if (!hasTransactions) {
      setIsAddingFromCalendar(true);
    }
  };

  const monthlyTotals = useMemo(() => {
    const targetYear = historyDate.getFullYear();
    const targetMonth = historyDate.getMonth();
    const monthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    return {
      expense: monthTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
      income: monthTrans.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0)
    };
  }, [transactions, historyDate]);

  const chartData = useMemo(() => {
    const targetYear = historyDate.getFullYear();
    const targetMonth = historyDate.getMonth();
    const monthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth && t.type === TransactionType.EXPENSE;
    });

    const data = categories
      .filter(c => c.type === TransactionType.EXPENSE)
      .map(cat => {
        const value = monthTrans.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0);
        return { name: cat.name, value, color: cat.color };
      })
      .filter(d => d.value > 0);

    return data;
  }, [transactions, categories, historyDate]);

  const budgetStatuses = useMemo(() => {
    return categories.filter(c => c.type === TransactionType.EXPENSE).map(cat => {
      const catTransactions = transactions.filter(t => t.categoryId === cat.id);
      const spent = catTransactions.reduce((sum, t) => sum + t.amount, 0);
      const limit = cat.budgetLimit || 1;
      const percentage = (spent / limit) * 100;
      return { 
        categoryId: cat.id, 
        spent, 
        limit, 
        percentage,
        status: percentage >= 100 ? 'EXCEEDED' : percentage >= 85 ? 'DANGER' : percentage >= 60 ? 'WARNING' : 'SAFE'
      } as BudgetStatus;
    });
  }, [categories, transactions]);

  const [isAddingFixed, setIsAddingFixed] = useState(false);
  const [fixedDesc, setFixedDesc] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedDay, setFixedDay] = useState('1');
  const [fixedCatId, setFixedCatId] = useState('');

  const addFixedExpense = useStore(state => state.addFixedExpense);

  const handleAddFixed = () => {
    if (!fixedDesc || !fixedAmount || !fixedCatId) return;
    addFixedExpense({
      description: fixedDesc,
      amount: parseFloat(fixedAmount),
      dayOfMonth: parseInt(fixedDay),
      categoryId: fixedCatId,
      userId: currentUser?.id || ''
    });
    setIsAddingFixed(false);
    setFixedDesc('');
    setFixedAmount('');
    setFixedDay('1');
    setFixedCatId('');
  };

  return (
    <>
      <div className="space-y-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-20">
          <div className="flex bg-pastel-sand p-1.5 rounded-3xl soft-shadow w-fit overflow-x-auto max-w-full no-scrollbar relative z-20">
            {[
              { id: 'SUMMARY', label: '요약', icon: LayoutPanelLeft },
              { id: 'LIST', label: '내역', icon: List },
              { id: 'STATS', label: '통계', icon: BarChart3 },
              { id: 'BUDGET', label: '예산', icon: PieChartIcon },
              { id: 'FIXED', label: '고정 지출', icon: Repeat },
              { id: 'ASSET', label: '자산 관리', icon: TrendingUp }
            ].map(t => (
              <button key={t.id} onClick={() => setWalletSubTab(t.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${walletSubTab === t.id ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-400 hover:text-zinc-500'}`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-3xl soft-shadow border border-pastel-lavender/30">
             <button onClick={() => changeMonth(-1)} className="text-zinc-300 hover:text-pastel-purple transition-colors"><ChevronLeft size={20} /></button>
             <span className="text-xs font-bold text-pastel-text uppercase tracking-widest min-w-[100px] text-center">
               {historyDate.getFullYear()}년 {historyDate.getMonth() + 1}월
             </span>
             <button onClick={() => changeMonth(1)} className="text-zinc-300 hover:text-pastel-purple transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        {walletSubTab === 'SUMMARY' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">총 지출</span>
                    <p className="text-3xl font-bold tracking-tighter tabular-nums text-rose-400">-{monthlyTotals.expense.toLocaleString()}원</p>
                  </div>
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400 shadow-inner">
                    <CreditCard size={24} />
                  </div>
               </div>
               <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">총 수입</span>
                    <p className="text-3xl font-bold tracking-tighter tabular-nums text-emerald-500">+{monthlyTotals.income.toLocaleString()}원</p>
                  </div>
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                    <PieChartIcon size={24} />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {categories.filter(c => c.type === TransactionType.EXPENSE).map(cat => {
                  const sum = transactions.filter(t => {
                    const d = new Date(t.date);
                    return t.categoryId === cat.id && d.getFullYear() === historyDate.getFullYear() && d.getMonth() === historyDate.getMonth();
                  }).reduce((s, t) => s + t.amount, 0);
                  return (
                    <button 
                      key={cat.id} 
                      onClick={() => setSelectedSummaryCategory(cat)} 
                      className={`bg-white p-10 rounded-[3rem] soft-shadow border transition-all text-left flex flex-col group relative overflow-hidden ${selectedSummaryCategory?.id === cat.id ? 'border-pastel-purple ring-2 ring-pastel-purple/10' : 'border-pastel-lavender/20 hover:scale-[1.02]'}`}
                    >
                       <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">{renderCategoryIcon(cat.iconId, 80)}</div>
                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner" style={{ backgroundColor: cat.color + '40', color: cat.color }}>{renderCategoryIcon(cat.iconId, 24)}</div>
                       <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{cat.name}</h4>
                       <p className="text-3xl font-bold tracking-tighter tabular-nums">{sum.toLocaleString()}원</p>
                    </button>
                  );
               })}
            </div>
          </div>
        )}

        {walletSubTab === 'LIST' && (
          <div className="space-y-8">
             <CalendarView 
               currentDate={historyDate} 
               transactions={transactions} 
               onDateClick={handleDateClick} 
             />

             <div className="bg-white rounded-[3.5rem] p-10 soft-shadow border border-pastel-lavender/20 relative z-10">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-base font-bold text-pastel-text flex items-center gap-3">
                     <List size={20} className="text-pastel-purple" /> 
                     {selectedWalletDate ? `${selectedWalletDate} 상세 내역` : '월간 전체 내역'}
                   </h3>
                   <div className="flex gap-3">
                     {selectedWalletDate && (
                       <>
                         <button 
                           onClick={() => setIsAddingFromCalendar(true)} 
                           className="text-[10px] font-bold text-white bg-pastel-purple uppercase tracking-widest px-4 py-2 rounded-xl hover:brightness-95 transition-all shadow-sm"
                         >
                           내역 추가
                         </button>
                         <button onClick={() => setSelectedWalletDate(null)} className="text-[10px] font-bold text-pastel-purple uppercase tracking-widest border border-pastel-purple/20 px-4 py-2 rounded-xl hover:bg-pastel-purple/5 transition-all">전체 내역 보기</button>
                       </>
                     )}
                   </div>
                </div>
                <div className="space-y-10">
                  {filteredTransactions.length === 0 ? (
                    <div className="py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">기록된 내역이 없습니다.</div>
                  ) : (
                    filteredTransactions.map(t => {
                      const cat = categories.find(c => c.id === t.categoryId);
                      const user = users.find(u => u.id === t.userId);
                      return (
                        <React.Fragment key={t.id}>
                          <div 
                            className="w-full flex items-center justify-between group p-4 rounded-2xl transition-all border border-transparent hover:border-pastel-lavender/20 text-left"
                          >
                             <div 
                               className="flex items-center gap-6 cursor-pointer flex-1"
                               onClick={() => setEditingTransaction(t)}
                             >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: cat?.color + '40', color: cat?.color }}>{renderCategoryIcon(cat?.iconId || 'other', 20)}</div>
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{t.date}</span>
                                      <span className="text-[9px] font-bold text-pastel-purple uppercase bg-pastel-purple/5 px-2 rounded-full">{user?.name}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-pastel-text">{t.description}</p>
                                      {t.photoUrl && <ImageIcon size={14} className="text-pastel-purple/40" />}
                                      {t.location && <MapPin size={14} className="text-emerald-400/40" />}
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <p 
                                  className={`text-lg font-bold tabular-nums tracking-tighter cursor-pointer ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-pastel-text'}`}
                                  onClick={() => setEditingTransaction(t)}
                                >
                                   {t.type === TransactionType.INCOME ? '+' : '-'} {t.amount.toLocaleString()}
                                </p>
                                <div className="flex flex-col items-end gap-1">
                                  <button 
                                    onClick={() => {
                                      if (currentUser) toggleTransactionLike(t.id, currentUser.id);
                                    }}
                                    className={`transition-all hover:scale-110 ${t.likes?.includes(currentUser?.id || '') ? 'text-rose-500' : 'text-rose-200 hover:text-rose-300'}`}
                                    title="좋아요"
                                  >
                                    <Heart size={16} fill={t.likes?.includes(currentUser?.id || '') ? 'currentColor' : 'none'} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setShowCommentsFor(showCommentsFor === t.id ? null : t.id);
                                    }}
                                    className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${showCommentsFor === t.id ? 'text-pastel-purple' : 'text-zinc-300 hover:text-pastel-purple'}`}
                                    title="댓글 보기/작성"
                                  >
                                    <MessageSquare size={12} /> {t.comments?.length || 0}
                                  </button>
                                  {t.type === TransactionType.EXPENSE && t.userId !== currentUser?.id && (user?.bankName || user?.kakaoPayLink) && (
                                    <button 
                                      onClick={() => setShowRemitFor(showRemitFor === t.id ? null : t.id)}
                                      className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors mt-0.5 ${showRemitFor === t.id ? 'text-rose-400' : 'text-rose-200 hover:text-rose-400'}`}
                                      title="정산하기"
                                    >
                                      <Coffee size={12} /> 정산
                                    </button>
                                  )}
                                </div>
                             </div>
                          </div>
                          <AnimatePresence>
                            {showRemitFor === t.id && user && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mx-4 mb-4 p-6 bg-rose-50/50 rounded-3xl border border-rose-100/30">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-400 shadow-sm border border-rose-50">
                                         <Coffee size={20} />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-pastel-text">{user.name}님에게 정산하기</p>
                                        <p className="text-[9px] text-zinc-400 font-medium">{user.bankName} {user.accountNumber}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {user.accountNumber && (
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(user.accountNumber!);
                                            onShowToast?.('계좌번호가 복사되었습니다.', 'INFO');
                                          }}
                                          className="flex-1 sm:flex-none px-4 py-2.5 bg-white rounded-xl text-[9px] font-bold text-zinc-500 shadow-sm border border-rose-100 flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors"
                                        >
                                          <Copy size={12} /> 계좌 복사
                                        </button>
                                      )}
                                      {user.kakaoPayLink && (
                                        <a 
                                          href={user.kakaoPayLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 sm:flex-none px-4 py-2.5 bg-[#FEE500] text-[#191919] rounded-xl text-[9px] font-bold shadow-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all"
                                        >
                                          <ExternalLink size={12} /> 카카오 송금
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {showCommentsFor === t.id && (
                            <div className="mt-4 p-6 bg-white rounded-3xl border border-pastel-lavender/20 animate-in slide-in-from-top-2">
                              <CommentSection 
                                comments={t.comments || []}
                                users={users}
                                currentUser={currentUser}
                                onAddComment={async (text) => {
                                  if (currentUser) {
                                    await addTransactionComment(t.id, {
                                      userId: currentUser.id,
                                      text,
                                      date: new Date().toISOString().split('T')[0]
                                    });
                                  }
                                }}
                                onDeleteComment={async (commentId) => {
                                  const newComments = (t.comments || []).filter(c => c.id !== commentId);
                                  await updateTransaction(t.id, { comments: newComments });
                                }}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </div>
             </div>
          </div>
        )}

        {walletSubTab === 'STATS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
             <section className="bg-white p-10 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20">
                <h3 className="text-base font-bold mb-10 flex items-center gap-3"><PieChartIcon size={20} className="text-pastel-purple" /> 카테고리별 지출</h3>
                <div className="h-[350px] w-full">
                   {chartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                             data={chartData}
                             cx="50%"
                             cy="50%"
                             innerRadius={80}
                             outerRadius={120}
                             paddingAngle={8}
                             dataKey="value"
                             label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                           >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <RechartsTooltip 
                             contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                             formatter={(value: number) => `${value.toLocaleString()}원`}
                           />
                           <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        </PieChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-bold uppercase tracking-widest">데이터가 부족합니다.</div>
                   )}
                </div>
             </section>

             <section className="bg-white p-10 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20">
                <h3 className="text-base font-bold mb-10 flex items-center gap-3"><BarChart3 size={20} className="text-emerald-300" /> 지출 상위</h3>
                <div className="h-[350px] w-full">
                   {chartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[...chartData].sort((a, b) => b.value - a.value).slice(0, 5)} layout="vertical" margin={{ left: 20, right: 30 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                           <XAxis type="number" hide />
                           <YAxis 
                             dataKey="name" 
                             type="category" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                             width={80} 
                           />
                           <RechartsTooltip 
                             cursor={{ fill: 'transparent' }}
                             contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                             formatter={(value: number) => `${value.toLocaleString()}원`}
                           />
                           <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-bold uppercase tracking-widest">데이터가 부족합니다.</div>
                   )}
                </div>
             </section>
          </div>
        )}

        {walletSubTab === 'BUDGET' && (
          <div className="space-y-8 animate-in slide-in-from-top-4">
            <div className="flex justify-end px-2">
              <button 
                onClick={onOpenBudgetModal}
                className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl text-[10px] font-bold text-pastel-purple uppercase tracking-widest soft-shadow border border-pastel-lavender/30 hover:border-pastel-purple transition-all"
              >
                <Settings size={14} /> 예산 계획 수정하기
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {budgetStatuses.map(status => (
                  <BudgetCard key={status.categoryId} category={categories.find(c => c.id === status.categoryId)!} status={status} users={users} />
               ))}
            </div>
          </div>
        )}

        {walletSubTab === 'FIXED' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
             <section className="bg-white p-10 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-base font-bold flex items-center gap-3"><Repeat size={20} className="text-pastel-purple" /> 고정 지출 목록</h3>
                   <button 
                     onClick={() => setIsAddingFixed(!isAddingFixed)}
                     className="text-[10px] font-bold text-pastel-purple uppercase tracking-widest border border-pastel-purple/20 px-4 py-2 rounded-xl hover:bg-pastel-purple/5 transition-all"
                   >
                     {isAddingFixed ? '취소' : '추가하기'}
                   </button>
                </div>

                {isAddingFixed && (
                  <div className="mb-10 p-8 bg-pastel-sand/20 rounded-[2.5rem] border border-pastel-sand/50 space-y-6 animate-in slide-in-from-top-2">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">설명</label>
                           <input type="text" value={fixedDesc} onChange={e => setFixedDesc(e.target.value)} className="w-full py-3 px-4 text-xs font-bold" placeholder="예: 월세" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">금액</label>
                           <input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} className="w-full py-3 px-4 text-xs font-bold" placeholder="0" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">결제일 (1-31)</label>
                           <input type="number" min="1" max="31" value={fixedDay} onChange={e => setFixedDay(e.target.value)} className="w-full py-3 px-4 text-xs font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">카테고리</label>
                           <select value={fixedCatId} onChange={e => setFixedCatId(e.target.value)} className="w-full py-3 px-4 text-xs font-bold appearance-none">
                              <option value="">선택</option>
                              {categories.filter(c => c.type === TransactionType.EXPENSE).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                        </div>
                     </div>
                     <button onClick={handleAddFixed} className="w-full bg-pastel-purple text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:brightness-95 transition-all">저장하기</button>
                  </div>
                )}

                <div className="space-y-6">
                   {fixedExpenses.length === 0 ? (
                     <div className="py-20 text-center opacity-20 text-[10px] font-bold uppercase tracking-widest">등록된 고정 지출이 없습니다.</div>
                   ) : (
                     fixedExpenses.map(f => {
                       const cat = categories.find(c => c.id === f.categoryId);
                       return (
                         <div key={f.id} className="bg-pastel-sand/20 p-6 rounded-[2rem] flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pastel-purple shadow-sm">{renderCategoryIcon(cat?.iconId || 'other', 20)}</div>
                               <div>
                                  <p className="text-sm font-bold text-pastel-text">{f.description}</p>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">매달 {f.dayOfMonth}일</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <p className="text-base font-bold tabular-nums tracking-tighter">{f.amount.toLocaleString()}원</p>
                               <button 
                                 onClick={() => onConfirm('고정 지출 삭제', '이 고정 지출 항목을 삭제하시겠습니까?', () => deleteFixedExpense(f.id))}
                                 className="text-zinc-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                       );
                     })
                   )}
                </div>
             </section>

             <section className="bg-white p-10 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20">
                <h3 className="text-base font-bold mb-10 flex items-center gap-3"><CreditCard size={20} className="text-emerald-300" /> 고정 지출이란?</h3>
                <div className="space-y-6 text-sm text-zinc-500 font-medium leading-relaxed">
                   <p>월세, 공과금, 통신비 등 매달 정기적으로 발생하는 지출을 미리 등록해두세요.</p>
                   <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50">
                      <p className="text-emerald-600 text-xs font-bold mb-2">💡 팁</p>
                      <p className="text-xs">등록된 고정 지출은 가계부 입력 시 '고정 지출 불러오기' 기능을 통해 간편하게 입력할 수 있습니다.</p>
                   </div>
                   <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mt-10">향후 업데이트 예정</p>
                   <p className="text-xs">지정된 날짜에 자동으로 가계부에 기록되는 기능이 곧 추가될 예정입니다.</p>
                </div>
             </section>
          </div>
        )}

        {walletSubTab === 'ASSET' && (
          <div className="animate-in slide-in-from-top-4">
            <AssetManagement />
          </div>
        )}
      </div>

      {selectedSummaryCategory && (
        <CategoryDetailModal 
          category={selectedSummaryCategory}
          transactions={transactions.filter(t => {
            const d = new Date(t.date);
            return t.categoryId === selectedSummaryCategory.id && d.getFullYear() === historyDate.getFullYear() && d.getMonth() === historyDate.getMonth();
          })}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedSummaryCategory(null)}
          onToggleLike={toggleTransactionLike}
          onAddComment={addTransactionComment}
          onUpdateTransaction={updateTransaction}
        />
      )}

      {isAddingFromCalendar && selectedWalletDate && currentUser && (
        <TransactionForm 
          onClose={() => setIsAddingFromCalendar(false)}
          onSubmit={addTransaction}
          onShowToast={onShowToast}
          categories={categories}
          users={users}
          currentUser={currentUser}
          initialDate={selectedWalletDate}
        />
      )}

      {editingTransaction && currentUser && (
        <TransactionForm 
          onClose={() => setEditingTransaction(null)}
          onSubmit={(data) => updateTransaction(editingTransaction.id, data)}
          onDelete={(id) => onConfirm(
            '거래 내역 삭제', 
            '이 거래 내역을 정말 삭제하시겠습니까?', 
            () => deleteTransaction(id)
          )}
          onShowToast={onShowToast}
          categories={categories}
          users={users}
          currentUser={currentUser}
          initialData={editingTransaction}
        />
      )}
    </>
  );
};
