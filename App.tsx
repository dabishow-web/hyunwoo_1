import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { 
  MapPin, Image as ImageIcon, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Settings, ArrowLeft, ClipboardList, Utensils, Bus, ShoppingBag, 
  Home, Banknote, Coins, Palmtree, HeartPulse, GraduationCap, Coffee, BarChart3,
  ArrowUpDown, MoreHorizontal, User as UserIcon, X
} from 'lucide-react';

import { Transaction, User, Category, TransactionType, UserRole, BudgetStatus } from './types';
import { Layout } from './components/Layout';
import { TransactionForm } from './components/TransactionForm';
import { BudgetCard } from './components/BudgetCard';
import { BudgetSettingModal } from './components/BudgetSettingModal';
import { Toast, ToastType } from './components/Toast';

// --- 모의 데이터 (한국어) ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: '관리자', avatar: '관', role: UserRole.ADMIN, color: '#000000' },
  { id: 'u2', name: '사용자', avatar: '사', role: UserRole.MEMBER, color: '#71717a' },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: '식비', type: TransactionType.EXPENSE, budgetLimit: 500000, color: '#FF0000' }, // 색상 변경: Vibrant Red (#FF0000)
  { id: 'c2', name: '교통', type: TransactionType.EXPENSE, budgetLimit: 150000, color: '#000000' },
  { id: 'c3', name: '쇼핑', type: TransactionType.EXPENSE, budgetLimit: 300000, color: '#000000' },
  { id: 'c4', name: '주거/통신', type: TransactionType.EXPENSE, budgetLimit: 600000, color: '#000000' },
  { id: 'c7', name: '카페/간식', type: TransactionType.EXPENSE, budgetLimit: 100000, color: '#000000' },
  { id: 'c8', name: '문화/여가', type: TransactionType.EXPENSE, budgetLimit: 200000, color: '#000000' },
  { id: 'c9', name: '의료/건강', type: TransactionType.EXPENSE, budgetLimit: 100000, color: '#000000' },
  { id: 'c10', name: '교육/학습', type: TransactionType.EXPENSE, budgetLimit: 200000, color: '#000000' },
  { id: 'c5', name: '급여', type: TransactionType.INCOME, budgetLimit: 0, color: '#000000' },
  { id: 'c6', name: '기타수입', type: TransactionType.INCOME, budgetLimit: 0, color: '#000000' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: TransactionType.INCOME, amount: 3500000, categoryId: 'c5', userId: 'u1', date: '2023-10-01', description: '10월 정기 급여' },
  { id: 't2', type: TransactionType.EXPENSE, amount: 12000, categoryId: 'c1', userId: 'u1', date: '2023-10-02', description: '점심 식사' },
  { id: 't3', type: TransactionType.EXPENSE, amount: 55000, categoryId: 'c3', userId: 'u2', date: '2023-10-03', description: '생활용품 구매' },
  { id: 't4', type: TransactionType.EXPENSE, amount: 12500, categoryId: 'c2', userId: 'u2', date: '2023-10-04', description: '택시비' },
  { id: 't5', type: TransactionType.EXPENSE, amount: 320000, categoryId: 'c4', userId: 'u1', date: '2023-10-05', description: '월세 납부' },
  { id: 't6', type: TransactionType.EXPENSE, amount: 480000, categoryId: 'c1', userId: 'u1', date: '2023-10-10', description: '가족 외식' },
  { id: 't7', type: TransactionType.EXPENSE, amount: 4500, categoryId: 'c7', userId: 'u2', date: '2023-10-11', description: '스타벅스' },
];

// --- 헬퍼: 아이콘 매핑 ---
const getCategoryIcon = (categoryName: string, size: number = 20) => {
  const name = categoryName.toUpperCase();
  if (name.includes('MEAL') || name.includes('식비')) return <Utensils size={size} />;
  if (name.includes('TRANSPORT') || name.includes('교통')) return <Bus size={size} />;
  if (name.includes('SHOPPING') || name.includes('쇼핑')) return <ShoppingBag size={size} />;
  if (name.includes('HOUSE') || name.includes('주거')) return <Home size={size} />;
  if (name.includes('SALARY') || name.includes('급여')) return <Banknote size={size} />;
  if (name.includes('BONUS') || name.includes('수입')) return <Coins size={size} />;
  if (name.includes('CAFE') || name.includes('카페')) return <Coffee size={size} />;
  if (name.includes('LEISURE') || name.includes('여가')) return <Palmtree size={size} />;
  if (name.includes('HEALTH') || name.includes('의료')) return <HeartPulse size={size} />;
  if (name.includes('EDUCATION') || name.includes('교육')) return <GraduationCap size={size} />;
  return <MoreHorizontal size={size} />;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'BUDGET' | 'HISTORY' | 'SUMMARY'>('DASHBOARD');
  const [users] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'JOINT' | 'INDIVIDUAL'>('JOINT');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [selectedChartCategoryId, setSelectedChartCategoryId] = useState<string | null>(null);
  const [summarySortOrder, setSummarySortOrder] = useState<'DESC' | 'ASC'>('DESC');
  
  const [historyDate, setHistoryDate] = useState(new Date('2023-10-01'));
  const [calendarType, setCalendarType] = useState<'EXPENSE' | 'INCOME' | 'BALANCE'>('EXPENSE');
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const filteredTransactions = useMemo(() => {
    if (viewMode === 'JOINT') return transactions;
    return transactions.filter(t => t.userId === selectedUserId);
  }, [transactions, viewMode, selectedUserId]);

  const monthlyTransactions = useMemo(() => {
    const targetYear = historyDate.getFullYear();
    const targetMonth = historyDate.getMonth();
    return filteredTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
  }, [filteredTransactions, historyDate]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    monthlyTransactions.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [monthlyTransactions]);

  const totalIncome = useMemo(() => monthlyTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0), [monthlyTransactions]);
  const totalExpense = useMemo(() => monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0), [monthlyTransactions]);

  const chartData = useMemo(() => {
    const data = categories
      .filter(c => c.type === TransactionType.EXPENSE)
      .map(cat => {
         const val = monthlyTransactions
           .filter(t => t.categoryId === cat.id)
           .reduce((sum, t) => sum + t.amount, 0);
         
         const limit = viewMode === 'JOINT' ? cat.budgetLimit : (cat.budgetLimit / 2);
         const percentage = limit > 0 ? (val / limit) * 100 : 0;
         
         let displayColor = '#e5e5e5'; 
         if (cat.color !== '#000000') {
            displayColor = cat.color;
         } else {
            if (percentage >= 100) displayColor = '#000000'; 
            else if (percentage >= 90) displayColor = '#262626'; 
            else if (percentage >= 70) displayColor = '#737373'; 
         }
         
         return { 
           id: cat.id, 
           name: cat.name, 
           value: val, 
           color: displayColor,
         };
      })
      .filter(d => d.value > 0);
      
    return data.sort((a, b) => {
      return summarySortOrder === 'DESC' ? b.value - a.value : a.value - b.value;
    });
  }, [categories, monthlyTransactions, viewMode, summarySortOrder]);

  const handlePrevMonth = () => { setHistoryDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)); setSelectedCalendarDateKey(null); };
  const handleNextMonth = () => { setHistoryDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)); setSelectedCalendarDateKey(null); };

  const handleAddTransaction = (newTx: any) => {
    const tx: Transaction = { ...newTx, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [tx, ...prev]);
  };

  // --- 캘린더 생성 로직 ---
  const calendarCells = useMemo(() => {
    const year = historyDate.getFullYear();
    const month = historyDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));
    return cells;
  }, [historyDate]);

  const dailyAggregates = useMemo(() => {
    const aggregates: Record<string, number> = {};
    monthlyTransactions.forEach(tx => {
      const key = tx.date;
      if (!aggregates[key]) aggregates[key] = 0;
      
      if (calendarType === 'INCOME' && tx.type === TransactionType.INCOME) {
        aggregates[key] += tx.amount;
      } else if (calendarType === 'EXPENSE' && tx.type === TransactionType.EXPENSE) {
        aggregates[key] += tx.amount;
      } else if (calendarType === 'BALANCE') {
        aggregates[key] += (tx.type === TransactionType.INCOME ? tx.amount : -tx.amount);
      }
    });
    return aggregates;
  }, [monthlyTransactions, calendarType]);

  const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateTransactions = useMemo(() => {
    if (!selectedCalendarDateKey) return [];
    return monthlyTransactions.filter(tx => {
      if (tx.date !== selectedCalendarDateKey) return false;
      if (calendarType === 'INCOME') return tx.type === TransactionType.INCOME;
      if (calendarType === 'EXPENSE') return tx.type === TransactionType.EXPENSE;
      return true; // BALANCE shows both
    });
  }, [selectedCalendarDateKey, monthlyTransactions, calendarType]);

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onOpenAddModal={() => setIsAddModalOpen(true)}
      currentUser={currentUser}
      users={users}
      onSwitchUser={setCurrentUser}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* 관리 모드 컨트롤 */}
      {activeTab !== 'SUMMARY' && (
        <div className="mb-10 flex flex-col md:flex-row gap-6 items-center justify-between border-b border-black pb-4">
          <div className="flex bg-white border border-black p-0.5">
            <button 
              onClick={() => setViewMode('JOINT')}
              className={`px-6 py-1 text-xs font-bold uppercase transition ${viewMode === 'JOINT' ? 'bg-black text-white' : 'text-black hover:bg-zinc-100'}`}
            >
              공동 관리
            </button>
            <button 
              onClick={() => setViewMode('INDIVIDUAL')}
              className={`px-6 py-1 text-xs font-bold uppercase transition ${viewMode === 'INDIVIDUAL' ? 'bg-black text-white' : 'text-black hover:bg-zinc-100'}`}
            >
              개인 관리
            </button>
          </div>

          {viewMode === 'INDIVIDUAL' && (
             <div className="flex gap-1">
               {users.map(u => (
                 <button 
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`px-4 py-1 border text-[10px] font-bold uppercase tracking-widest transition ${selectedUserId === u.id ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-200'}`}
                 >
                   {u.name}
                 </button>
               ))}
             </div>
          )}
        </div>
      )}

      {/* 대시보드 */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-12">
          {/* 통계 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border border-black bg-white">
            <div className="p-8">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">총 잔액</span>
              <div className="text-3xl font-bold mt-2 tabular-nums">
                {(totalIncome - totalExpense).toLocaleString()}
              </div>
            </div>
            <div className="p-8">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">이번 달 수입</span>
              <div className="text-3xl font-bold mt-2 tabular-nums">
                + {totalIncome.toLocaleString()}
              </div>
            </div>
            <div className="p-8">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">이번 달 지출</span>
              <div className="text-3xl font-bold mt-2 tabular-nums">
                - {totalExpense.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 메인 차트 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-black bg-white">
             {/* 수평 막대 차트 */}
             <div className="p-8 border-b lg:border-b-0 lg:border-r border-black">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <BarChart3 size={16} /> 카테고리별 예산 사용률
                   </h3>
                   <button onClick={() => setIsBudgetEditOpen(true)} className="p-1 hover:bg-zinc-100 border border-transparent hover:border-black transition">
                      <Settings size={14} />
                   </button>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                      barSize={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#fafafa' }}
                        contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '0px', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val: number) => [`${val.toLocaleString()} 원`, '지출']}
                      />
                      <Bar dataKey="value">
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* 범례 */}
                <div className="flex gap-4 mt-8 justify-center border-t border-zinc-100 pt-4">
                  {['안전', '주의', '위험', '초과'].map((label, idx) => (
                    <div key={label} className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-400">
                      <div className="w-2 h-2" style={{ backgroundColor: ['#e5e5e5', '#737373', '#262626', '#000000'][idx] }}></div>
                      {label}
                    </div>
                  ))}
                </div>
             </div>

             {/* 요약 리스트 사이드 */}
             <div className="p-8 bg-zinc-50">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">지출 요약 리스트</h4>
                  <button 
                    onClick={() => setSummarySortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                    className="flex items-center gap-2 text-[10px] font-bold hover:text-black transition uppercase bg-white border border-zinc-200 px-3 py-1"
                  >
                     <ArrowUpDown size={12} /> {summarySortOrder === 'DESC' ? '높은순' : '낮은순'}
                  </button>
                </div>

                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {chartData.map((d, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedChartCategoryId(d.id)}
                      className="flex items-center justify-between p-4 bg-white border border-zinc-200 hover:border-black cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-4" style={{ backgroundColor: d.color }}></div>
                        <span className="text-xs font-bold tracking-tight uppercase group-hover:pl-1 transition-all">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums">{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                  {chartData.length === 0 && <p className="text-[10px] text-zinc-400 text-center py-20 uppercase">기록된 내역이 없습니다</p>}
                </div>
             </div>
          </div>

          {/* 카테고리 그리드 현황 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <ClipboardList size={16} /> 카테고리별 상세 현황
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-black border border-black">
              {categories
                .filter(c => c.type === TransactionType.EXPENSE)
                .map(cat => {
                  const amount = monthlyTransactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0);
                  const isSpecificColor = cat.color !== '#000000';
                  return (
                    <div key={cat.id} className="bg-white p-6 h-32 flex flex-col justify-between hover:bg-zinc-50 transition">
                       <div className="flex items-start justify-between">
                          <div 
                            className="p-2 border border-zinc-100 transition-colors"
                            style={{ backgroundColor: isSpecificColor ? cat.color + '20' : '#f4f4f5' }} 
                          >
                            <div style={{ color: isSpecificColor ? cat.color : '#000000' }}>
                              {getCategoryIcon(cat.name, 16)}
                            </div>
                          </div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase truncate max-w-[60px]" title={cat.name}>{cat.name}</p>
                       </div>
                       <div>
                          <p className="text-lg font-bold tabular-nums truncate">{amount.toLocaleString()}</p>
                       </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 일간 현황 캘린더 */}
          <div className="border border-black bg-white overflow-hidden">
            <div className="p-8 border-b border-black flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-50">
               <div className="flex items-center gap-3">
                  <div className="bg-black text-white p-2">
                    <CalendarIcon size={18} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">일간 통합 장부</h3>
               </div>

               <div className="flex items-center gap-4 border border-black bg-white p-1">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-zinc-100 transition"><ChevronLeft size={16} /></button>
                  <span className="text-xs font-bold uppercase tabular-nums min-w-[100px] text-center">{historyDate.getFullYear()}. {historyDate.getMonth() + 1}</span>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-zinc-100 transition"><ChevronRight size={16} /></button>
               </div>

               <div className="flex bg-white border border-black p-0.5">
                  <button onClick={() => { setCalendarType('INCOME'); setSelectedCalendarDateKey(null); }} className={`px-4 py-1 text-[10px] font-bold uppercase transition ${calendarType === 'INCOME' ? 'bg-black text-white' : 'text-black hover:bg-zinc-100'}`}>수입</button>
                  <button onClick={() => { setCalendarType('EXPENSE'); setSelectedCalendarDateKey(null); }} className={`px-4 py-1 text-[10px] font-bold uppercase transition ${calendarType === 'EXPENSE' ? 'bg-black text-white' : 'text-black hover:bg-zinc-100'}`}>지출</button>
                  <button onClick={() => { setCalendarType('BALANCE'); setSelectedCalendarDateKey(null); }} className={`px-4 py-1 text-[10px] font-bold uppercase transition ${calendarType === 'BALANCE' ? 'bg-black text-white' : 'text-black hover:bg-zinc-100'}`}>잔액</button>
               </div>
            </div>

            <div className="grid grid-cols-7 border-collapse">
               {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                 <div key={day} className="p-4 border-r border-b border-black last:border-r-0 bg-zinc-100 text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">
                   {day}
                 </div>
               ))}
               {calendarCells.map((date, idx) => {
                 if (!date) return <div key={`empty-${idx}`} className="h-24 border-r border-b border-black last:border-r-0 bg-zinc-50"></div>;
                 
                 const dateKey = toDateKey(date);
                 const amount = dailyAggregates[dateKey] || 0;
                 const isPositive = amount > 0;
                 const isNegative = amount < 0;
                 const isSelected = selectedCalendarDateKey === dateKey;

                 return (
                   <div 
                     key={dateKey} 
                     onClick={() => setSelectedCalendarDateKey(isSelected ? null : dateKey)}
                     className={`h-24 p-3 border-r border-b border-black last:border-r-0 flex flex-col justify-between cursor-pointer transition group ${isSelected ? 'bg-black text-white' : 'hover:bg-zinc-50'}`}
                   >
                      <span className={`text-[10px] font-bold transition ${isSelected ? 'text-zinc-400' : 'text-zinc-400 group-hover:text-black'}`}>{date.getDate()}</span>
                      {amount !== 0 && (
                        <div className="text-right">
                           <p className={`text-[10px] font-bold tabular-nums truncate ${isSelected ? 'text-white' : (calendarType === 'BALANCE' ? (isPositive ? 'text-black underline' : isNegative ? 'text-zinc-400' : 'text-black') : 'text-black')}`}>
                             {isPositive && calendarType !== 'EXPENSE' ? '+' : ''}{amount.toLocaleString()}
                           </p>
                        </div>
                      )}
                   </div>
                 );
               })}
            </div>

            {/* 날짜 클릭 시 상세 내역 표시 패널 */}
            {selectedCalendarDateKey && (
              <div className="border-t border-black bg-white animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest">{selectedCalendarDateKey.replace(/-/g, '. ')} 상세 현황</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">({calendarType === 'INCOME' ? '수입' : calendarType === 'EXPENSE' ? '지출' : '전체'})</span>
                  </div>
                  <button onClick={() => setSelectedCalendarDateKey(null)} className="p-1 hover:bg-zinc-200 transition"><X size={16} /></button>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {selectedDateTransactions.length > 0 ? selectedDateTransactions.map(tx => (
                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition">
                       <div className="flex items-center gap-6">
                          <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center bg-white">
                            {getCategoryIcon(categories.find(c => c.id === tx.categoryId)?.name || '', 18)}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase">{tx.description}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase">{categories.find(c => c.id === tx.categoryId)?.name}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-sm font-bold tabular-nums ${tx.type === TransactionType.INCOME ? 'text-black underline' : ''}`}>
                            {tx.type === TransactionType.INCOME ? '+' : '-'}{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-[9px] font-bold uppercase text-zinc-300">{users.find(u => u.id === tx.userId)?.name}</p>
                       </div>
                    </div>
                  )) : (
                    <div className="p-20 text-center text-[10px] font-bold text-zinc-300 uppercase">해당 조건의 거래 내역이 없습니다</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 내역 탭 */}
      {activeTab === 'HISTORY' && (
        <div className="border border-black bg-white">
          <div className="p-6 border-b border-black flex items-center justify-between bg-zinc-50">
            <h2 className="text-sm font-bold uppercase tracking-widest">상세 거래 로그</h2>
            <div className="flex items-center gap-4">
              <button onClick={handlePrevMonth} className="hover:bg-zinc-200 p-1"><ChevronLeft size={16}/></button>
              <span className="text-xs font-bold uppercase">{historyDate.getFullYear()}. {historyDate.getMonth()+1}</span>
              <button onClick={handleNextMonth} className="hover:bg-zinc-200 p-1"><ChevronRight size={16}/></button>
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
             {Object.keys(groupedHistory).length > 0 ? Object.keys(groupedHistory).sort((a,b) => b.localeCompare(a)).map(dateStr => (
               <div key={dateStr}>
                  <div className="bg-zinc-50 px-6 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter border-y border-zinc-100">
                    {dateStr}
                  </div>
                  {groupedHistory[dateStr].map(tx => (
                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition">
                       <div className="flex items-center gap-6">
                          <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center bg-white">
                            {getCategoryIcon(categories.find(c => c.id === tx.categoryId)?.name || '', 18)}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase">{tx.description}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase">{categories.find(c => c.id === tx.categoryId)?.name}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-sm font-bold tabular-nums ${tx.type === TransactionType.INCOME ? 'text-black underline' : ''}`}>
                            {tx.type === TransactionType.INCOME ? '+' : '-'}{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-[9px] font-bold uppercase text-zinc-300">{users.find(u => u.id === tx.userId)?.name}</p>
                       </div>
                    </div>
                  ))}
               </div>
             )) : (
               <div className="p-20 text-center text-[10px] font-bold text-zinc-300 uppercase">기록된 내역이 없습니다</div>
             )}
          </div>
        </div>
      )}

      {/* 종합 보고서 탭 */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-12">
           <div className="p-12 border-2 border-black bg-white flex flex-col items-center text-center">
              <ClipboardList size={48} className="mb-6" />
              <h1 className="text-4xl font-bold uppercase tracking-tighter mb-2">월간 재무 보고서</h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{historyDate.getFullYear()} . {historyDate.getMonth() + 1}</p>
              
              <div className="grid grid-cols-2 gap-12 mt-12 w-full max-w-2xl border-t border-black pt-12">
                 <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-2">총 수입 합계</span>
                    <span className="text-3xl font-bold tabular-nums">{totalIncome.toLocaleString()}</span>
                 </div>
                 <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-2">총 지출 합계</span>
                    <span className="text-3xl font-bold tabular-nums">{totalExpense.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 모달 섹션 */}
      {isAddModalOpen && (
        <TransactionForm 
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTransaction}
          categories={categories}
          users={users}
          currentUser={currentUser}
        />
      )}
      {isBudgetEditOpen && (
        <BudgetSettingModal 
          categories={categories}
          onClose={() => setIsBudgetEditOpen(false)}
          onSave={(updated) => setCategories(updated)}
        />
      )}
    </Layout>
  );
};

export default App;