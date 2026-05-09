import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Users, Plus, ArrowRight, Link as LinkIcon } from 'lucide-react';

interface CommunitySetupProps {
  onComplete: (communityId: string) => void;
}

export const CommunitySetup: React.FC<CommunitySetupProps> = ({ onComplete }) => {
  const [communityId, setCommunityId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    if (inviteCode) {
      setCommunityId(inviteCode.toUpperCase());
    }
  }, []);

  const handleCreate = async () => {
    if (!auth.currentUser || isProcessing) return;
    setIsProcessing(true);
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || '익명',
        avatar: auth.currentUser.photoURL || '♥',
        color: '#D4C6F0',
        themeColor: '#FDFBFA',
        communityId: newId
      }, { merge: true });
      
      onComplete(newId);
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, 'users'); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoin = async () => {
    if (!auth.currentUser || !communityId || isProcessing) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || '익명',
        avatar: auth.currentUser.photoURL || '♥',
        color: '#F9E2E6',
        themeColor: '#FFF1E6',
        communityId: communityId
      }, { merge: true });
      
      // Clean up URL params after joining
      window.history.replaceState({}, document.title, window.location.pathname);
      onComplete(communityId);
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, 'users'); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinHistory = async (code: string) => {
    setCommunityId(code);
    // The handleJoin will use the state value, so we need to wait for state update or pass it directly.
    // Better to pass it directly.
    if (!auth.currentUser || isProcessing) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        communityId: code
      }, { merge: true });
      onComplete(code);
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, 'users'); 
    } finally {
      setIsProcessing(false);
    }
  };

  const history = JSON.parse(localStorage.getItem('community_history') || '[]');

  return (
    <div className="min-h-screen bg-[#FDFBFA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-pastel-purple/10 rounded-[2.5rem] flex items-center justify-center text-pastel-purple">
              <Users size={40} />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-pastel-text">공동체 설정</h1>
          <p className="text-zinc-400 font-medium">함께 생활할 파트너를 초대하거나 참여하세요.</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 space-y-10">
          <div className="space-y-6">
            {history.length > 0 && (
              <div className="text-left px-2 mb-2">
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-3 text-center">이전에 사용했던 공간</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {history.map((code: string) => (
                    <button
                      key={code}
                      onClick={() => handleJoinHistory(code)}
                      className="px-4 py-2 bg-pastel-sand/30 rounded-xl text-xs font-bold text-pastel-text hover:bg-pastel-purple hover:text-white transition-all transform hover:scale-105"
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[9px] text-zinc-400 text-center">기존 데이터가 보이지 않는다면 위 코드 중 하나를 선택해 보세요.</p>
              </div>
            )}
            
             <button
              onClick={handleCreate}
              disabled={isProcessing}
              className="w-full flex items-center justify-between gap-4 bg-pastel-purple text-white p-6 rounded-3xl font-bold hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus size={24} />
                )}
                <div className="text-left">
                  <p className="text-lg">새로운 공간 만들기</p>
                  <p className="text-xs text-white/70 font-medium">새로운 코드를 생성하여 파트너를 초대합니다.</p>
                </div>
              </div>
              <ArrowRight size={20} />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-pastel-sand"></div></div>
              <div className="relative flex justify-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest"><span className="bg-white px-4">또는</span></div>
            </div>

            <div className="space-y-4">
              <div className="text-left px-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">초대 코드 입력</p>
                  {new URLSearchParams(window.location.search).get('invite') && (
                    <span className="text-[10px] font-bold text-pastel-purple bg-pastel-purple/10 px-2 py-1 rounded-lg animate-pulse">
                      링크에서 코드를 가져왔습니다
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value.toUpperCase())}
                  placeholder="예: AB12CD"
                  className="w-full bg-pastel-sand/30 border-none p-5 rounded-2xl text-lg font-bold text-pastel-text focus:ring-2 focus:ring-pastel-purple transition-all"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!communityId || isProcessing}
                className="w-full bg-white border-2 border-pastel-purple text-pastel-purple p-5 rounded-3xl font-bold hover:bg-pastel-purple hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-pastel-purple border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>공간 참여하기</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
          <span>Together is Better</span>
        </div>
      </div>
    </div>
  );
};
