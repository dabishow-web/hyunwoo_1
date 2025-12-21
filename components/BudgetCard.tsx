import React from 'react';
import { AlertCircle } from 'lucide-react';
import { BudgetStatus, Category } from '../types';

interface BudgetCardProps {
  category: Category;
  status: BudgetStatus;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ category, status }) => {
  const isAlert = status.status === 'DANGER' || status.status === 'EXCEEDED';
  const progressWidth = Math.min(status.percentage, 100);
  const isSpecificColor = category.color !== '#000000';
  
  // Progress bar background styling
  const getProgressStyles = () => {
    if (isSpecificColor) {
      return { backgroundColor: category.color };
    }
    
    if (status.status === 'EXCEEDED') return { backgroundColor: '#000000' };
    if (status.status === 'DANGER') return { backgroundColor: '#262626' };
    if (status.status === 'WARNING') return { backgroundColor: '#a3a3a3' };
    return { backgroundColor: '#e5e5e5' };
  };

  return (
    <div className="bg-white border border-black p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: isSpecificColor ? category.color : 'inherit' }}>{category.name}</h4>
          <p className="text-[9px] font-bold text-zinc-400 uppercase">한도: {category.budgetLimit.toLocaleString()} 원</p>
        </div>
        {isAlert && <div className="bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">경고</div>}
      </div>
      
      <div className="space-y-2">
        <div className="h-1 w-full bg-zinc-100 overflow-hidden">
          <div 
            className="h-full transition-all duration-700" 
            style={{ width: `${progressWidth}%`, ...getProgressStyles() }} 
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold tabular-nums">
           <span>{status.spent.toLocaleString()} / {category.budgetLimit.toLocaleString()}</span>
           <span className={status.status === 'EXCEEDED' ? 'text-black underline font-black' : 'text-zinc-400'}>{status.percentage.toFixed(0)}%</span>
        </div>
      </div>

      {status.status === 'EXCEEDED' && (
        <div className="bg-zinc-50 border border-black p-3 text-[9px] font-bold uppercase flex items-center gap-2">
          <AlertCircle size={12} />
          <span>차액: {Math.abs(status.limit - status.spent).toLocaleString()} 원 예산 초과</span>
        </div>
      )}
    </div>
  );
};