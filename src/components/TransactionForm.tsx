import React, { useState, useMemo } from 'react';
import { X, Calendar, Tag, FileText, User as UserIcon, MapPin, Image as ImageIcon, Trash2 } from 'lucide-react';
import { TransactionType, Category, User, Transaction, ToastType } from '../../types';
import { renderCategoryIcon } from '../../App';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (id: string) => void;
  onShowToast?: (message: string, type: ToastType) => void;
  categories: Category[];
  users: User[];
  currentUser: User;
  initialDate?: string;
  initialData?: Transaction;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onClose, onSubmit, onDelete, onShowToast, categories, users, currentUser, initialDate, initialData 
}) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId || '');
  const [date, setDate] = useState<string>(initialData?.date || initialDate || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [userId, setUserId] = useState<string>(initialData?.userId || currentUser.id);
  const [photoUrl, setPhotoUrl] = useState<string>(initialData?.photoUrl || '');
  const [location, setLocation] = useState<string>(initialData?.location?.address || '');
  const [isSaving, setIsSaving] = useState(false);

  const groupedOptions = useMemo<Record<string, Category[]>>(() => {
    const filtered = categories.filter(c => c.type === type);
    const groups: Record<string, Category[]> = {};
    filtered.forEach(cat => {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    });
    return groups;
  }, [categories, type]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPhotoUrl(base64);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      onShowToast?.('올바른 금액을 입력해주세요.', 'ERROR');
      return;
    }
    if (!categoryId) {
      onShowToast?.('카테고리를 선택해주세요.', 'ERROR');
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({ 
        type, 
        amount: parseFloat(amount), 
        categoryId, 
        userId, 
        date, 
        description: description || '지출 내역',
        photoUrl,
        location: location ? { lat: 0, lng: 0, address: location } : undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      onShowToast?.(message, 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pastel-sand/60 backdrop-blur-md animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="bg-white rounded-5xl w-full max-w-lg shadow-2xl border border-pastel-lavender/30 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-pastel-sand flex justify-between items-center bg-white/50">
          <div>
            <h2 className="text-sm font-bold text-pastel-text uppercase tracking-widest">
              {initialData ? '기록 수정하기' : '기억하고 싶은 기록'}
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1">
              {initialData ? '기존 기록을 수정하거나 삭제할 수 있습니다.' : '오늘의 소중한 소비와 수입을 남겨주세요.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pastel-sand rounded-full transition-colors text-zinc-300">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-10 flex-1 space-y-10 custom-scrollbar">
          {/* 사진 첨부 버튼 */}
          <div className="relative group">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
            <label 
              htmlFor="photo-upload"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl border-2 border-dashed bg-pastel-mint/10 border-pastel-mint/40 hover:bg-pastel-mint/20 transition-all cursor-pointer"
            >
              <ImageIcon size={20} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700/70 uppercase tracking-widest">
                {photoUrl ? '사진 변경하기' : '사진 첨부하기'}
              </span>
            </label>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-pastel-sand/50 p-1.5 rounded-3xl border border-pastel-lavender/10">
            <button 
              type="button" 
              onClick={() => setType(TransactionType.EXPENSE)} 
              className={`flex-1 py-3 rounded-2xl text-[11px] font-bold uppercase transition-all
                ${type === TransactionType.EXPENSE ? 'bg-white text-rose-400 shadow-sm' : 'text-zinc-400'}`}
            >
              지출
            </button>
            <button 
              type="button" 
              onClick={() => setType(TransactionType.INCOME)} 
              className={`flex-1 py-3 rounded-2xl text-[11px] font-bold uppercase transition-all
                ${type === TransactionType.INCOME ? 'bg-white text-emerald-500 shadow-sm' : 'text-zinc-400'}`}
            >
              수입
            </button>
          </div>

          <div className="space-y-8">
            {/* Amount */}
            <div className="text-center">
              <label className="text-[10px] font-bold uppercase text-zinc-300 mb-3 block tracking-widest">거래 금액</label>
              <div className="relative inline-block w-full">
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="w-full text-5xl font-bold text-pastel-text text-center outline-none bg-transparent tabular-nums placeholder:text-pastel-sand" 
                  placeholder="0" 
                  required 
                />
                <span className="block mt-2 text-xs font-bold text-zinc-300">KRW</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-300 tracking-widest">
                  <Calendar size={12} /> 날짜
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full py-3 px-5 text-xs font-bold" 
                  required 
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-300 tracking-widest">
                  <Tag size={12} /> 분류
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 pointer-events-none">
                    {selectedCategory ? (
                      <div style={{ color: selectedCategory.color }}>
                        {renderCategoryIcon(selectedCategory.iconId, 16)}
                      </div>
                    ) : <Tag size={16} className="text-zinc-200" />}
                  </div>
                  <select 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)} 
                    className="w-full py-3 pl-12 pr-10 text-xs font-bold appearance-none" 
                    required
                  >
                    <option value="">선택해주세요</option>
                    {(Object.entries(groupedOptions) as [string, Category[]][]).map(([group, cats]) => (
                      <optgroup key={group} label={group} className="text-[10px]">
                        {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-300 tracking-widest">
                <FileText size={12} /> 상세 내용 (선택)
              </label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full py-4 px-5 text-sm font-medium" 
                placeholder="지출 내역을 간단히 적어주세요 (예: 커피, 저녁 식사)" 
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-300 tracking-widest">
                <MapPin size={12} /> 장소 (선택)
              </label>
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                className="w-full py-4 px-5 text-sm font-medium" 
                placeholder="장소 이름을 입력해주세요" 
              />
            </div>

            {/* Photo Preview */}
            {photoUrl && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-300 tracking-widest">
                  <ImageIcon size={12} /> 첨부된 사진
                </label>
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-pastel-lavender/30">
                  <img src={photoUrl} alt="Receipt" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* User Selector */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-300 tracking-widest">
                <UserIcon size={12} /> 기록하는 사람
              </label>
              <div className="flex gap-3">
                {users.map(u => (
                  <button 
                    key={u.id} 
                    type="button" 
                    onClick={() => setUserId(u.id)} 
                    className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-bold transition-all border
                      ${userId === u.id ? 'bg-white border-pastel-purple text-pastel-purple shadow-sm ring-4 ring-pastel-purple/5' : 'bg-pastel-sand/30 border-transparent text-zinc-300'}`}
                  >
                    <span className="mr-2" style={{ color: u.color }}>●</span>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-10 bg-pastel-sand/20 border-t border-pastel-sand flex gap-4">
          {initialData && onDelete && (
            <button 
              type="button" 
              onClick={() => {
                onDelete(initialData.id);
                onClose();
              }} 
              className="flex-1 bg-white text-rose-400 py-5 rounded-3xl font-bold uppercase tracking-[0.2em] shadow-lg border border-rose-100 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> 삭제
            </button>
          )}
          <button 
            type="submit" 
            className={`${initialData ? 'flex-[2]' : 'w-full'} bg-pastel-purple text-white py-5 rounded-3xl font-bold uppercase tracking-[0.2em] shadow-lg hover:brightness-95 active:scale-95 transition-all`}
          >
            {initialData ? '수정 완료' : '기록 저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
};