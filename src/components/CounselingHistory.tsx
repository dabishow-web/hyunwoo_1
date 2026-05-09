
import React from 'react';
import { 
  BrainCircuit, Calendar, Trash2, ChevronRight, MessageSquare, Heart, Quote, X
} from 'lucide-react';
import { useStore } from '../store';
import { CounselingRecord } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { UserAvatar } from './UserAvatar';

interface CounselingHistoryProps {
  onClose: () => void;
}

export const CounselingHistory: React.FC<CounselingHistoryProps> = ({ onClose }) => {
  const currentUser = useStore(state => state.currentUser);
  const counselingRecords = useStore(state => state.counselingRecords);
  const deleteCounselingRecord = useStore(state => state.deleteCounselingRecord);
  const users = useStore(state => state.users);

  const [selectedRecord, setSelectedRecord] = React.useState<CounselingRecord | null>(null);

  const getUserData = (userId: string) => users.find(u => u.id === userId) || { name: '알 수 없음', avatar: '?', color: '#ccc' };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-t-[3rem] md:rounded-[3.5rem] shadow-2xl border border-white/20 relative animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: List (Hidden on mobile if a record is selected) */}
        <div className={`w-full md:w-80 border-r border-pastel-sand/50 flex flex-col bg-pastel-sand/5 overflow-hidden ${selectedRecord ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 md:p-8 border-b border-pastel-sand/50">
            <h3 className="text-lg md:text-xl font-black text-pastel-text flex items-center gap-2">
              <BrainCircuit size={24} className="text-pastel-purple" />
              상담 기록함
            </h3>
            <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">심층 심리 분석 히스토리</p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-3">
            {counselingRecords.length === 0 ? (
              <div className="py-20 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest">저장된 상담 기록이 없습니다.</div>
            ) : (
              [...counselingRecords]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(record => {
                  const user = getUserData(record.userId);
                  return (
                    <button 
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={`w-full p-5 md:p-6 rounded-2xl md:rounded-3xl text-left transition-all border ${selectedRecord?.id === record.id ? 'bg-white border-pastel-purple shadow-lg scale-[1.02]' : 'bg-transparent border-transparent hover:bg-white/50 opacity-70 hover:opacity-100'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-pastel-purple" />
                          <span className="text-[10px] font-bold text-zinc-400">{record.date}</span>
                        </div>
                        <UserAvatar avatar={user.avatar} name={user.name} color={user.color || '#F0F0F5'} size="sm" />
                      </div>
                      <p className="text-xs font-bold text-pastel-text line-clamp-1 mb-1">{record.diaryText.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '')}</p>
                      <span className="text-[9px] font-bold text-pastel-purple uppercase tracking-tight">상담 분석 결과 보기</span>
                    </button>
                  );
                })
            )}
          </div>
        </div>

        {/* Right Side: Detail (Full screen on mobile if selected) */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${selectedRecord ? 'flex' : 'hidden md:flex'}`}>
          <div className="absolute top-4 md:top-8 right-4 md:right-8 flex items-center gap-2 z-10">
            {selectedRecord && (
              <button 
                onClick={() => setSelectedRecord(null)}
                className="md:hidden p-3 hover:bg-pastel-sand rounded-2xl transition-colors text-zinc-400"
                title="목록으로 이동"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-3 hover:bg-pastel-sand rounded-2xl transition-colors text-zinc-300"
            >
              <X size={24} />
            </button>
          </div>

          {selectedRecord ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-16 space-y-10 md:space-y-12">
              <div className="space-y-4 pt-8 md:pt-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Heart size={12} /> 전문 심리 분석 리포트
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-pastel-text tracking-tight">{selectedRecord.date} 상담 기록</h2>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-[11px] font-bold text-zinc-400">
                  <span className="text-pastel-purple font-black">상담 대상: {getUserData(selectedRecord.userId).name}</span>
                  <span>상담 일시: {new Date(selectedRecord.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Quote size={14} className="text-pastel-purple" /> 분석의 바탕이 된 기록
                </h4>
                <div 
                  className="p-6 md:p-8 bg-pastel-sand/20 rounded-[2rem] md:rounded-[2.5rem] border border-pastel-sand/50 text-sm font-medium leading-relaxed italic text-zinc-500 prose prose-sm max-w-none shadow-inner overflow-x-hidden"
                  dangerouslySetInnerHTML={{ __html: selectedRecord.diaryText }}
                />
              </div>

              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h4 className="text-[10px] font-black text-pastel-purple uppercase tracking-[0.2em] flex items-center gap-2">
                   <BrainCircuit size={16} /> 전인적 치유 마스터의 조언
                </h4>
                <div className="prose prose-sm prose-zinc prose-p:leading-relaxed prose-headings:font-black prose-headings:text-pastel-text prose-strong:text-pastel-purple markdown-body">
                  <Markdown>{selectedRecord.aiAdvice}</Markdown>
                </div>
              </div>

              <div className="pt-10 md:pt-12 border-t border-pastel-sand/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="p-4 bg-pastel-sand/30 rounded-2xl flex items-center gap-3 w-full md:w-auto">
                   <MessageSquare size={16} className="text-pastel-purple shrink-0" />
                   <p className="text-[9px] md:text-[10px] font-medium text-zinc-400 italic">"과거의 기억은 바꿀 수 없지만, 그 기억에 대한 오늘의 해석은 바꿀 수 있습니다."</p>
                 </div>
                 <button 
                  onClick={() => {
                    if (window.confirm('이 상담 기록을 삭제하시겠습니까?')) {
                      deleteCounselingRecord(selectedRecord.id);
                      setSelectedRecord(null);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 text-rose-400 hover:bg-rose-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all w-full md:w-auto justify-center"
                >
                  <Trash2 size={14} /> 기록 삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
               <div className="w-24 h-24 bg-pastel-purple/5 rounded-[2.5rem] flex items-center justify-center text-pastel-purple/20">
                  <BrainCircuit size={64} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black text-pastel-text">상담 기록을 선택해주세요</h3>
                  <p className="text-sm font-medium text-zinc-400">왼쪽 리스트에서 과거 AI와 나누었던 상담 내역을 확인하고<br/>당신의 마음 성장을 되새겨보세요.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
