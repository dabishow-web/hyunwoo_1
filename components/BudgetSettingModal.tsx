import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Category, TransactionType } from '../types';

interface BudgetSettingModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (updatedCategories: Category[]) => void;
}

export const BudgetSettingModal: React.FC<BudgetSettingModalProps> = ({ categories, onClose, onSave }) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  const handleChange = (id: string, newLimit: string) => {
    const limit = parseInt(newLimit.replace(/[^0-9]/g, ''), 10) || 0;
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, budgetLimit: limit } : c));
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  const expenseCategories = localCategories.filter(c => c.type === TransactionType.EXPENSE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border-2 border-black w-full max-w-lg shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-black flex justify-between items-center bg-zinc-50">
          <h2 className="text-xs font-bold uppercase tracking-widest">예산 한도 구성</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-8 flex-1 space-y-6">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
            각 카테고리별 월간 지출 한도를 설정하십시오. 한도 근접 시 모니터링 색상이 변경됩니다.
          </p>
          <div className="space-y-4">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">{cat.name}</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={cat.budgetLimit.toLocaleString()}
                      onChange={(e) => handleChange(cat.id, e.target.value)}
                      className="w-full border border-black p-3 text-xs font-bold outline-none text-right pr-8 tabular-nums focus:bg-zinc-50 transition"
                    />
                    <span className="absolute right-3 top-3 text-[10px] font-bold text-zinc-400">원</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-black bg-zinc-50">
          <button
            onClick={handleSave}
            className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition"
          >
            <Save size={16} />
            구성 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};