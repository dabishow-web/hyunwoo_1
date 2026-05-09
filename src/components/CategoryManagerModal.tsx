import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Palette, Type as FontIcon, Layout } from 'lucide-react';
import { Category, TransactionType } from '../../types';
import { ICON_MAP } from '../../App';

interface CategoryManagerModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (updatedCategories: Category[]) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ categories, onClose, onSave }) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [activeType, setActiveType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [editingIconId, setEditingIconId] = useState<string | null>(null);

  const handleUpdate = (id: string, field: keyof Category, value: any) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleAdd = () => {
    const newId = `c_new_${Date.now()}`;
    const newCat: Category = {
      id: newId,
      name: '새 분류',
      group: activeType === TransactionType.EXPENSE ? '기타' : '수입',
      type: activeType,
      budgetLimit: 0,
      color: '#D4C6F0',
      iconId: 'other'
    };
    setLocalCategories([...localCategories, newCat]);
  };

  const handleDelete = (id: string) => {
    setLocalCategories(prev => prev.filter(c => c.id !== id));
  };

  const currentCats = localCategories.filter(c => c.type === activeType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pastel-sand/60 backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-5xl w-full max-w-3xl shadow-2xl border border-pastel-lavender/30 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-pastel-sand flex justify-between items-center bg-white/50">
          <div>
            <h2 className="text-sm font-bold text-pastel-text uppercase tracking-widest">분류 정하기</h2>
            <p className="text-[10px] text-zinc-400 mt-1">우리만의 특별한 소비 카테고리를 만들어보세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pastel-sand rounded-full transition-colors text-zinc-300">
            <X size={24} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-pastel-sand p-2 bg-pastel-sand/20">
          <button 
            onClick={() => setActiveType(TransactionType.EXPENSE)} 
            className={`flex-1 py-3 rounded-2xl text-[11px] font-bold uppercase transition-all
              ${activeType === TransactionType.EXPENSE ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-300 hover:text-zinc-500'}`}
          >
            지출 카테고리
          </button>
          <button 
            onClick={() => setActiveType(TransactionType.INCOME)} 
            className={`flex-1 py-3 rounded-2xl text-[11px] font-bold uppercase transition-all
              ${activeType === TransactionType.INCOME ? 'bg-white text-pastel-purple shadow-sm' : 'text-zinc-300 hover:text-zinc-500'}`}
          >
            수입 카테고리
          </button>
        </div>

        <div className="overflow-y-auto p-8 flex-1 space-y-6 custom-scrollbar bg-pastel-sand/5">
          <div className="flex justify-between items-center px-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">총 {currentCats.length}개의 분류</span>
            <button 
              onClick={handleAdd} 
              className="flex items-center gap-2 bg-pastel-purple text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase hover:brightness-95 transition-all shadow-md"
            >
              <Plus size={16} /> 분류 추가하기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCats.map(cat => (
              <div key={cat.id} className="bg-white border border-pastel-lavender/20 p-5 rounded-3xl soft-shadow group hover:border-pastel-purple/30 transition-all">
                <div className="flex items-start gap-4">
                  {/* Icon Picker Trigger */}
                  <div className="relative">
                    <button 
                      onClick={() => setEditingIconId(editingIconId === cat.id ? null : cat.id)}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-pastel-sand/50"
                      style={{ color: cat.color }}
                    >
                      {React.createElement(ICON_MAP[cat.iconId] || ICON_MAP.other, { size: 22 })}
                    </button>
                    
                    {editingIconId === cat.id && (
                      <div className="absolute left-0 top-full mt-3 w-64 bg-white rounded-3xl p-4 z-20 shadow-2xl border border-pastel-lavender/20 animate-in fade-in zoom-in">
                        <p className="text-[9px] font-bold text-zinc-300 uppercase mb-3 px-1">아이콘 선택</p>
                        <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                          {Object.keys(ICON_MAP).map(key => (
                            <button 
                              key={key} 
                              onClick={() => { handleUpdate(cat.id, 'iconId', key); setEditingIconId(null); }}
                              className={`p-2.5 rounded-xl hover:bg-pastel-sand transition-all flex items-center justify-center
                                ${cat.iconId === key ? 'bg-pastel-sand ring-1 ring-pastel-purple' : ''}`}
                            >
                              {React.createElement(ICON_MAP[key], { size: 16, className: 'text-pastel-text/60' })}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette size={12} className="text-zinc-200" />
                        <input 
                          type="color" 
                          value={cat.color} 
                          onChange={(e) => handleUpdate(cat.id, 'color', e.target.value)}
                          className="w-6 h-6 cursor-pointer border-none bg-transparent rounded-full overflow-hidden"
                        />
                      </div>
                      <button onClick={() => handleDelete(cat.id)} className="text-zinc-200 hover:text-rose-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-pastel-sand pb-1">
                        <Layout size={12} className="text-zinc-200" />
                        <input 
                          type="text" 
                          value={cat.group} 
                          onChange={(e) => handleUpdate(cat.id, 'group', e.target.value)}
                          placeholder="그룹명 (예: 식비)"
                          className="w-full text-[10px] font-bold outline-none bg-transparent uppercase tracking-wider"
                        />
                      </div>
                      <div className="flex items-center gap-2 border-b border-pastel-sand pb-1">
                        <FontIcon size={12} className="text-zinc-200" />
                        <input 
                          type="text" 
                          value={cat.name} 
                          onChange={(e) => handleUpdate(cat.id, 'name', e.target.value)}
                          placeholder="분류명"
                          className="w-full text-xs font-bold outline-none bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-10 bg-pastel-sand/20 border-t border-pastel-sand">
          <button 
            onClick={() => { onSave(localCategories); onClose(); }} 
            className="w-full bg-pastel-purple text-white py-5 rounded-3xl font-bold uppercase tracking-[0.2em] shadow-lg hover:brightness-95 transition-all flex items-center justify-center gap-3"
          >
            <Save size={18} /> 설정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};