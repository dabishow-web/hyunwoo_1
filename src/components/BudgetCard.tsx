
import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, User as UserIcon, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { BudgetStatus, Category, User } from '../../types';

interface BudgetCardProps {
  category: Category;
  status: BudgetStatus;
  users: User[];
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ category, status, users }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progressWidth = Math.min(status.percentage, 100);
  const remaining = Math.max(0, status.limit - status.spent);
  const isExceeded = status.spent > status.limit;

  // 예산 상태에 따른 색상 및 텍스트 정의
  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-rose-500'; // 초과
    if (percentage >= 85) return 'bg-rose-400'; // 위험 (DANGER)
    if (percentage >= 60) return 'bg-orange-400'; // 주의 (WARNING)
    return 'bg-emerald-400'; // 안전 (SAFE)
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return '예산 초과';
    if (percentage >= 85) return '위험';
    if (percentage >= 60) return '주의';
    return '안전';
  };

  const getStatusBg = (percentage: number) => {
    if (percentage >= 100) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (percentage >= 85) return 'bg-rose-50 text-rose-500 border-rose-100';
    if (percentage >= 60) return 'bg-orange-50 text-orange-500 border-orange-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 soft-shadow border border-pastel-lavender/20 group hover:border-pastel-purple/30 transition-all flex flex-col h-full">
      {/* 상단: 카테고리 정보와 상태 */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: category.color + '30', color: category.color }}>
            <div className="text-2xl font-bold">●</div> 
          </div>
          <div>
            <h4 className="text-base font-bold text-pastel-text leading-tight">{category.name}</h4>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{category.group}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusBg(status.percentage)}`}>
          {getStatusText(status.percentage)}
        </div>
      </div>
      
      {/* 중앙: 메인 가로 바 그래프 */}
      <div className="space-y-6 flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between items-end px-1">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">지출 현황</span>
            <span className={`text-sm font-bold tabular-nums ${isExceeded ? 'text-rose-500' : 'text-pastel-text'}`}>
              {status.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 w-full bg-pastel-sand/50 rounded-full overflow-hidden border border-pastel-lavender/10">
            <div 
              className={`h-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-full shadow-sm ${getStatusColor(status.percentage)}`}
              style={{ width: `${progressWidth}%` }} 
            >
              <div className="w-full h-full grape-shine opacity-50" />
            </div>
          </div>
        </div>

        {/* 수치 상세 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-pastel-sand/20 p-4 rounded-2xl border border-pastel-sand">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight size={14} className="text-zinc-300" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">사용한 금액</span>
            </div>
            <div className="text-lg font-bold tabular-nums tracking-tighter text-pastel-text">
              {status.spent.toLocaleString()}<span className="text-xs ml-0.5">원</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl border ${isExceeded ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50/30 border-emerald-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight size={14} className={isExceeded ? 'text-rose-300' : 'text-emerald-300'} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isExceeded ? '초과된 금액' : '남은 금액'}
              </span>
            </div>
            <div className={`text-lg font-bold tabular-nums tracking-tighter ${isExceeded ? 'text-rose-600' : 'text-emerald-600'}`}>
              {(isExceeded ? status.spent - status.limit : remaining).toLocaleString()}<span className="text-xs ml-0.5">원</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-2 bg-pastel-sand/10 rounded-2xl border border-dashed border-pastel-lavender/30">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Wallet size={12} /> 총 예산: {category.budgetLimit.toLocaleString()} 원
          </span>
        </div>
      </div>

      {/* 하단: 구성원별 상세 (아코디언) */}
      <div className="mt-8 pt-6 border-t border-pastel-sand">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pastel-purple transition-colors"
        >
          <span className="flex items-center gap-2">구성원별 지출 현황</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {isExpanded && (
          <div className="mt-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {users.map(user => {
              const indStatus = status.individualStatus?.[user.id];
              const hasSpending = indStatus && indStatus.spent > 0;
              const hasLimit = indStatus && indStatus.limit > 0;
              
              if (!hasSpending && !hasLimit) return null;

              const indProgress = hasLimit ? Math.min(indStatus.percentage, 100) : 0;
              
              return (
                <div key={user.id} className="space-y-2 p-4 rounded-[1.5rem] bg-white border border-pastel-sand soft-shadow">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar avatar={user.avatar} name={user.name} color={user.color} />
                      <span className="text-xs font-bold text-pastel-text">{user.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-pastel-text tabular-nums">{indStatus?.spent.toLocaleString()} 원</div>
                    </div>
                  </div>
                  
                  {hasLimit ? (
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-pastel-sand rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 rounded-full ${getStatusColor(indStatus.percentage)}`}
                          style={{ width: `${indProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest">
                        <span className="text-zinc-300">한도 {indStatus.limit.toLocaleString()}</span>
                        <span className={indStatus.percentage >= 100 ? 'text-rose-500' : 'text-zinc-400'}>
                          {indStatus.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                       <span className="text-[8px] font-bold text-zinc-200 uppercase tracking-widest">개인 한도 미설정</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isExceeded && (
        <div className="mt-6 bg-rose-50 rounded-2xl p-4 text-[10px] font-bold text-rose-500 flex items-center gap-3 border border-rose-100 animate-pulse">
          <AlertCircle size={16} />
          <span>공동 예산을 초과했습니다! 지출 관리가 필요해요.</span>
        </div>
      )}
    </div>
  );
};
