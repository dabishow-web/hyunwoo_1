import React, { useState, useMemo } from 'react';
import { X, Save, User as UserIcon, Plus, Trash2, Tag, Palette, ChevronRight, AlertCircle, Activity, LayoutPanelLeft } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { Category, TransactionType, User, Transaction } from '../../types';
import { ICON_MAP } from '../../App';

interface BudgetSettingModalProps {
  categories: Category[];
  users: User[];
  transactions: Transaction[];
  onClose: () => void;
  onSave: (updatedCategories: Category[]) => void;
  onShowToast: (message: string, type: 'SUCCESS' | 'ERROR' | 'INFO') => void;
}

export const BudgetSettingModal: React.FC<BudgetSettingModalProps> = ({ 
  categories, users, transactions, onClose, onSave, onShowToast 
}) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categories.find(c => c.type === TransactionType.EXPENSE)?.id || null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeCategory = useMemo(() => 
    localCategories.find(c => c.id === activeCategoryId),
    [localCategories, activeCategoryId]
  );

  const currentSpent = useMemo(() => {
    if (!activeCategory) return 0;
    return transactions
      .filter(t => t.categoryId === activeCategory.id && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [activeCategory, transactions]);

  // 실시간 입력값에 기반한 퍼센트 계산
  const percentage = useMemo(() => {
    if (!activeCategory || activeCategory.budgetLimit <= 0) return 0;
    return (currentSpent / activeCategory.budgetLimit) * 100;
  }, [activeCategory, currentSpent]);

  const getStatusColor = (p: number) => {
    if (p >= 100) return 'text-rose-600 bg-rose-600';
    if (p >= 85) return 'text-rose-500 bg-rose-500';
    if (p >= 60) return 'text-orange-400 bg-orange-400';
    return 'text-emerald-500 bg-emerald-500';
  };

  const getStatusText = (p: number) => {
    if (p >= 100) return '예산 초과';
    if (p >= 85) return '위험';
    if (p >= 60) return '주의';
    return '안전';
  };

  const handleGlobalLimitChange = (id: string, newLimit: string) => {
    // 숫자만 추출하여 실시간 상태 업데이트
    const limit = parseInt(newLimit.replace(/[^0-9]/g, ''), 10) || 0;
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, budgetLimit: limit } : c));
  };

  const handleIndividualLimitChange = (catId: string, userId: string, newLimit: string) => {
    const limit = parseInt(newLimit.replace(/[^0-9]/g, ''), 10) || 0;
    setLocalCategories(prev => prev.map(c => {
      if (c.id !== catId) return c;
      return {
        ...c,
        individualLimits: {
          ...(c.individualLimits || {}),
          [userId]: limit
        }
      };
    }));
  };

  const handleUpdateCategoryField = (id: string, field: keyof Category, value: any) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleAddNewCategory = () => {
    const newId = `c_budget_${Date.now()}`;
    const newCat: Category = {
      id: newId,
      name: '새 예산 항목',
      group: '기타',
      type: TransactionType.EXPENSE,
      budgetLimit: 0,
      color: '#D4C6F0',
      iconId: 'other',
      individualLimits: {}
    };
    setLocalCategories(prev => [...prev, newCat]);
    setActiveCategoryId(newId);
  };

  const handleDeleteCategory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setLocalCategories(prev => prev.filter(c => c.id !== deleteConfirmId));
      if (activeCategoryId === deleteConfirmId) {
        setActiveCategoryId(localCategories.find(c => c.id !== deleteConfirmId)?.id || null);
      }
      setDeleteConfirmId(null);
      onShowToast('항목이 삭제되었습니다.', 'INFO');
    }
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  const expenseCategories = localCategories.filter(c => c.type === TransactionType.EXPENSE);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pastel-sand/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-5xl w-full max-w-5xl shadow-2xl border border-pastel-lavender/30 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-pastel-sand flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-pastel-purple/20 rounded-2xl flex items-center justify-center text-pastel-purple">
                <LayoutPanelLeft size={24} />
             </div>
             <div>
                <h2 className="text-sm font-bold text-pastel-text uppercase tracking-widest">예표 설정</h2>
                <p className="text-[10px] text-zinc-400 mt-1">카테고리별 예산을 계획하고 한도를 설정하세요.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pastel-sand rounded-full transition-colors text-zinc-300">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left List */}
          <div className="w-1/3 border-r border-pastel-sand bg-pastel-sand/10 flex flex-col">
            <div className="p-6 border-b border-pastel-sand/50">
               <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">지출 예산 리스트</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {expenseCategories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => { setActiveCategoryId(cat.id); }}
                  className={`w-full text-left p-6 transition-all border-b border-pastel-sand/50 flex items-center justify-between group cursor-pointer
                    ${activeCategoryId === cat.id ? 'bg-white border-r-4 border-r-pastel-purple shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <div className="flex items-center gap-4 pr-6">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '40', color: cat.color }}>
                       {React.createElement(ICON_MAP[cat.iconId] || ICON_MAP.other, { size: 16 })}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-[11px] font-bold text-pastel-text truncate">{cat.name}</h4>
                      <p className="text-[9px] text-zinc-400 font-bold tabular-nums">한도: {cat.budgetLimit.toLocaleString()}원</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteCategory(e, cat.id)}
                      className="p-2 text-zinc-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={14} className={`transition-all ${activeCategoryId === cat.id ? 'text-pastel-purple translate-x-1' : 'text-zinc-200'}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white/50 border-t border-pastel-sand">
               <button onClick={handleAddNewCategory} className="w-full py-4 text-[10px] font-bold text-pastel-purple uppercase tracking-widest border-2 border-dashed border-pastel-purple/20 rounded-2xl hover:bg-pastel-purple hover:text-white transition-all">
                 + 항목 추가하기
               </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
            {activeCategory ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                {/* 실시간 프리뷰 영역 */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> 예산 상태 실시간 프리뷰
                  </label>
                  <div className="bg-pastel-sand/10 p-8 rounded-4xl border border-pastel-lavender/20 flex flex-col gap-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${getStatusColor(percentage).split(' ')[0]} bg-white shadow-sm`}>
                          {getStatusText(percentage)}
                        </span>
                        <div className="text-4xl font-bold tracking-tighter tabular-nums text-pastel-text mt-2">
                          {percentage.toFixed(1)}% <span className="text-sm font-medium text-zinc-300 ml-1">사용 예정</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-300 uppercase block mb-1">현재 소비액 / 입력 한도</span>
                        <div className="text-base font-bold tabular-nums text-pastel-text">
                          {currentSpent.toLocaleString()} / <span className="text-pastel-purple">{activeCategory.budgetLimit.toLocaleString()}</span> 원
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-5 w-full bg-pastel-sand/50 rounded-full overflow-hidden relative border border-white">
                      <div 
                        className={`h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-full ${getStatusColor(percentage).split(' ')[1]}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        <div className="w-full h-full grape-shine opacity-30" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 입력 폼 */}
                <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">지출 한도 금액</label>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => handleDeleteCategory(e, activeCategory.id)}
                            className="p-3 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-100 transition-all"
                            title="항목 삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="relative border-b-2 border-pastel-sand focus-within:border-pastel-purple transition-colors pb-2 flex-1">
                            <input 
                              type="text" 
                              value={activeCategory.budgetLimit.toLocaleString()} 
                              onChange={(e) => handleGlobalLimitChange(activeCategory.id, e.target.value)}
                              className="w-full text-4xl font-bold text-pastel-text outline-none bg-transparent tabular-nums" 
                              placeholder="0"
                            />
                            <span className="absolute right-0 bottom-2 text-xs font-bold text-zinc-300 uppercase">원</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">카테고리 정보</label>
                        <div className="flex flex-col gap-3">
                           <input 
                             type="text" 
                             value={activeCategory.name}
                             onChange={(e) => handleUpdateCategoryField(activeCategory.id, 'name', e.target.value)}
                             className="w-full p-4 bg-pastel-sand/30 text-sm font-bold rounded-2xl outline-none"
                             placeholder="항목 명칭"
                           />
                           <input 
                             type="text" 
                             value={activeCategory.group}
                             onChange={(e) => handleUpdateCategoryField(activeCategory.id, 'group', e.target.value)}
                             className="w-full p-4 bg-pastel-sand/30 text-sm font-bold rounded-2xl outline-none"
                             placeholder="그룹 명칭"
                           />
                        </div>
                      </div>
                   </div>

                   <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">구성원별 분배</label>
                        <div className="space-y-3">
                          {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-pastel-sand/20 rounded-2xl border border-transparent hover:border-pastel-lavender/30 transition-all">
                              <div className="flex items-center gap-3">
                                <UserAvatar avatar={user.avatar} name={user.name} color={user.color} size="sm" />
                                <span className="text-xs font-bold text-pastel-text">{user.name}</span>
                              </div>
                              <div className="relative w-32">
                                <input 
                                  type="text" 
                                  value={activeCategory.individualLimits?.[user.id]?.toLocaleString() || ''}
                                  onChange={(e) => handleIndividualLimitChange(activeCategory.id, user.id, e.target.value)}
                                  placeholder="미설정"
                                  className="w-full text-right font-bold text-sm bg-transparent outline-none pr-5 tabular-nums"
                                />
                                <span className="absolute right-0 top-0.5 text-[8px] font-bold text-zinc-300">원</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">비주얼 스타일</label>
                        <div className="flex flex-wrap gap-2">
                          {['#F9E2E6', '#F7D1BA', '#FAF3DD', '#D1E8E2', '#E8E4F8', '#D4C6F0', '#E2F0EB'].map(color => (
                            <button
                              key={color}
                              onClick={() => handleUpdateCategoryField(activeCategory.id, 'color', color)}
                              className={`w-9 h-9 rounded-xl border-2 transition-all ${activeCategory.color === color ? 'border-pastel-purple scale-110 shadow-sm' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <LayoutPanelLeft size={64} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">수정할 항목을 선택해주세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-pastel-sand/20 border-t border-pastel-sand flex justify-between items-center">
          <button onClick={onClose} className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-pastel-text transition-colors">닫기</button>
          <button 
            onClick={handleSave} 
            className="bg-pastel-purple text-white px-12 py-5 rounded-3xl font-bold uppercase tracking-[0.2em] shadow-lg hover:brightness-95 active:scale-95 transition-all flex items-center gap-3"
          >
            <Save size={18} /> 최종 설정 저장하기
          </button>
        </div>

        {/* Local Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 soft-shadow border border-pastel-lavender/20 text-center space-y-8 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-pastel-text">항목 삭제</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  이 예산 항목을 정말 삭제할까요?<br/>관련된 모든 예산 설정이 사라집니다.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-4 rounded-2xl text-xs font-bold text-zinc-400 bg-pastel-sand/50 hover:bg-pastel-sand transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-2xl text-xs font-bold text-white bg-rose-400 hover:bg-rose-500 shadow-lg shadow-rose-200 transition-all"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
