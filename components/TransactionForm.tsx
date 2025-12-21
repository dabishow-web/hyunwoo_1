import React, { useState, useRef } from 'react';
import { Camera, MapPin, Loader2, X } from 'lucide-react';
import { TransactionType, Category, User, GeoLocation, UserRole } from '../types';
import { analyzeReceiptImage } from '../services/geminiService';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: Category[];
  users: User[];
  currentUser: User;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSubmit, categories, users, currentUser }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [userId, setUserId] = useState<string>(currentUser.id);
  const [location, setLocation] = useState<GeoLocation | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !description) return;
    onSubmit({ type, amount: parseFloat(amount), categoryId, userId, date, description, location, photoUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border-2 border-black w-full max-w-lg shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-black flex justify-between items-center bg-zinc-50">
          <h2 className="text-xs font-bold uppercase tracking-widest">거래 내역 기록</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-8 flex-1 space-y-8">
          {/* 거래 유형 선택 */}
          <div className="flex bg-zinc-100 p-1 border border-zinc-200">
            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition ${type === TransactionType.EXPENSE ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}>지출</button>
            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition ${type === TransactionType.INCOME ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}>수입</button>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <label className="text-[9px] font-bold uppercase text-zinc-400 mb-1 block">금액 (원)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full text-4xl font-bold border-b border-black outline-none py-2 bg-transparent tabular-nums" placeholder="0" required />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-400 mb-1 block">발생 날짜</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-black p-3 text-xs font-bold outline-none" required />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-400 mb-1 block">카테고리 분류</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-black p-3 text-xs font-bold outline-none appearance-none" required>
                  <option value="">선택해주세요...</option>
                  {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-400 mb-1 block">내용 요약</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-black p-3 text-xs font-bold outline-none" placeholder="어디에 사용하셨나요?" required />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-400 mb-1 block">기록 주체</label>
              <div className="flex gap-2">
                {users.map(u => (
                  <button key={u.id} type="button" onClick={() => setUserId(u.id)} className={`px-4 py-2 border text-[10px] font-bold uppercase transition ${userId === u.id ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-200'}`}>{u.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-black bg-zinc-50">
          <button type="submit" onClick={handleSubmit} className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition">내역 저장하기</button>
        </div>
      </div>
    </div>
  );
};