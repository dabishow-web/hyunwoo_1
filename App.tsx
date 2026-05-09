import React, { useState, useEffect } from 'react';
import { 
  Utensils, Bus, ShoppingBag, Home, Banknote, Coins, Palmtree, HeartPulse, 
  GraduationCap, Coffee, Smartphone, Car, PawPrint, Gift, Scissors, 
  BookOpen, Wine, Music, Plane, Shirt, MoreHorizontal, Zap, CreditCard, Trash2, BookHeart, Calendar, X
} from 'lucide-react';

import { TransactionType, ToastType } from './types';
import { Layout } from './src/components/Layout';
import { TransactionForm } from './src/components/TransactionForm';
import { Toast } from './src/components/Toast';
import { BudgetSettingModal } from './src/components/BudgetSettingModal';
import { CategoryDetailModal } from './src/components/CategoryDetailModal';
import { DiaryScheduleForm } from './src/components/DiaryScheduleForm';
import { Login } from './src/components/Login';
import { CommunitySetup } from './src/components/CommunitySetup';
import { HomeTab } from './src/components/tabs/HomeTab';
import { WalletTab } from './src/components/tabs/WalletTab';
import { DiaryTab } from './src/components/tabs/DiaryTab';
import { AssetManagement } from './src/components/AssetManagement';
import { CounselingHistory } from './src/components/CounselingHistory';
import { RoutineTab } from './src/components/RoutineTab';
import { PsychologicalReportTab } from './src/components/PsychologicalReportTab';
import { RelationshipReportTab } from './src/components/RelationshipReportTab';
import { NoticeTab } from './src/components/NoticeTab';
import { AnimatePresence } from 'motion/react';

import { auth, db, onAuthStateChanged } from './src/firebase';
import { onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useStore } from './src/store';

// --- 아이콘 및 공통 렌더러 ---
export const ICON_MAP: Record<string, React.ElementType> = {
  food: Utensils, transport: Bus, shopping: ShoppingBag, home: Home, salary: Banknote,
  money: Coins, leisure: Palmtree, health: HeartPulse, education: GraduationCap, cafe: Coffee,
  phone: Smartphone, car: Car, pet: PawPrint, gift: Gift, beauty: Scissors,
  book: BookOpen, drink: Wine, culture: Music, travel: Plane, utility: Zap,
  clothes: Shirt, card: CreditCard, other: MoreHorizontal,
  netflix: Plane, youtube: Music, coupang: ShoppingBag, wave: Wine
};

export const renderCategoryIcon = (iconId: string, size: number = 20) => {
  const IconComponent = ICON_MAP[iconId] || ICON_MAP.other;
  return <IconComponent size={size} />;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'WALLET' | 'DIARY' | 'ROUTINE' | 'REPORT' | 'RELATIONSHIP' | 'SETTINGS' | 'NOTICE'>('HOME');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const currentUser = useStore(state => state.currentUser);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const communityId = useStore(state => state.communityId);
  const setCommunityId = useStore(state => state.setCommunityId);
  const syncData = useStore(state => state.syncData);
  const addTransaction = useStore(state => state.addTransaction);
  const addDiary = useStore(state => state.addDiary);
  const addSchedule = useStore(state => state.addSchedule);
  const categories = useStore(state => state.categories);
  const users = useStore(state => state.users);
  const transactions = useStore(state => state.transactions);
  const resetAllData = useStore(state => state.resetAllData);
  const updateUser = useStore(state => state.updateUser);
  const setCategories = useStore(state => state.setCategories);

  useEffect(() => {
    const storedId = localStorage.getItem('communityId');
    if (storedId) setCommunityId(storedId);
  }, [setCommunityId]);

  useEffect(() => {
    if (auth.currentUser && !communityId) {
      const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.communityId) {
            localStorage.setItem('communityId', data.communityId);
            setCommunityId(data.communityId);
          }
        }
      });
      return () => unsub();
    }
  }, [communityId, setCommunityId]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [isCounselingHistoryOpen, setIsCounselingHistoryOpen] = useState(false);
  const [diaryFormMode, setDiaryFormMode] = useState<'DIARY' | 'SCHEDULE'>('DIARY');
  const [isLifeRecordChoiceOpen, setIsLifeRecordChoiceOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<string | null>(null);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'DANGER' | 'INFO';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirmAction = (title: string, message: string, onConfirm: () => void, type: 'DANGER' | 'INFO' = 'DANGER') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsCommunityLoading(true);
        
        // Set up real-time listener for current user document
        unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as any;
            setCurrentUser({ ...userData, id: docSnap.id });
            
            // Sync local history to cloud and vice-versa
            const localHistory = JSON.parse(localStorage.getItem('community_history') || '[]');
            const cloudHistory = userData.joinedCommunities || [];
            const mergedHistory = Array.from(new Set([...cloudHistory, ...localHistory]));
            
            // Update cloud if local has more
            if (mergedHistory.length > cloudHistory.length) {
               updateDoc(doc(db, 'users', user.uid), { joinedCommunities: mergedHistory });
            }
            
            // Update local if cloud has more
            if (mergedHistory.length > localHistory.length) {
              localStorage.setItem('community_history', JSON.stringify(mergedHistory.slice(0, 10)));
            }

            if (userData.communityId) {
              setCommunityId(userData.communityId);
            }
            
            // Update online status if not already true
            if (!userData.isOnline) {
              updateDoc(doc(db, 'users', user.uid), { 
                isOnline: true, 
                lastSeen: new Date().toISOString() 
              });
            }
          } else {
            // Initial user setup if document doesn't exist
            // Try to recover communityId from localStorage or generate a unique one
            const recoveredCommunityId = localStorage.getItem('communityId');
            const defaultCommunityId = recoveredCommunityId || user.uid.substring(0, 8).toUpperCase();
            
            const newUser = {
              id: user.uid,
              name: user.displayName || '익명',
              avatar: user.photoURL || '♥',
              color: '#D4C6F0',
              themeColor: '#FDFBFA',
              communityId: defaultCommunityId,
              joinedCommunities: [defaultCommunityId],
              isOnline: true,
              lastSeen: new Date().toISOString()
            };
            setCurrentUser(newUser);
            setCommunityId(defaultCommunityId);
            localStorage.setItem('communityId', defaultCommunityId);
            setDoc(doc(db, 'users', user.uid), newUser);
          }
          setIsCommunityLoading(false);
          setIsAuthLoading(false);
        }, (error) => {
          console.error("Error syncing user data:", error);
          setIsAuthLoading(false);
          setIsCommunityLoading(false);
        });

        // Handle tab close / visibility change
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            updateDoc(doc(db, 'users', user.uid), { 
              isOnline: false, 
              lastSeen: new Date().toISOString() 
            });
          } else {
            updateDoc(doc(db, 'users', user.uid), { 
              isOnline: true, 
              lastSeen: new Date().toISOString() 
            });
          }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', () => {
          updateDoc(doc(db, 'users', user.uid), { isOnline: false });
        });

      } else {
        if (unsub) unsub();
        setCurrentUser(null);
        setCommunityId(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, [setCurrentUser, setCommunityId]);

  useEffect(() => {
    if (communityId) {
      const unsub = syncData(communityId);
      
      // Initialize categories if they don't exist in Firestore
      const checkAndInitCategories = async () => {
        const { categories: currentCategories } = useStore.getState();
        // If we only have the default hardcoded categories and they haven't been synced yet
        // or if the collection is empty, we should upload them.
        // The syncData will update the state if they exist.
        // We can check if any category has a communityId (which we add when saving to Firestore)
        const hasSynced = currentCategories.some(c => c.communityId === communityId);
        if (!hasSynced) {
          // This is a bit tricky since syncData is async. 
          // Let's wait a bit or check the collection directly.
          const { getDocs, collection, query } = await import('firebase/firestore');
          const snap = await getDocs(query(collection(db, `communities/${communityId}/categories`)));
          if (snap.empty) {
            await setCategories(currentCategories);
          }
        }
      };
      
      checkAndInitCategories();
      return () => unsub();
    }
  }, [communityId, syncData, setCategories]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBFA]">
        <div className="w-12 h-12 border-4 border-pastel-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (!communityId && !isCommunityLoading) {
    return <CommunitySetup onComplete={(id) => {
      localStorage.setItem('communityId', id);
      setCommunityId(id);
    }} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onOpenAddModal={() => setIsQuickAddOpen(true)}
      currentUser={currentUser}
      users={users}
      onUpdateTheme={async (userId, color) => {
        await updateUser(userId, { themeColor: color });
        setToast({ message: '테마 색상이 변경되었습니다.', type: 'SUCCESS' });
      }}
      onSwitchCommunity={async (newId) => {
        if (!currentUser) return;
        confirmAction(
          '공동체 이동',
          `정말 '${newId}' 공동체로 이동하시겠습니까? 이동 후 데이터가 보이지 않는다면 기존 코드를 다시 확인해 주세요.`,
          async () => {
            const updatedJoined = Array.from(new Set([...(currentUser.joinedCommunities || []), newId]));
            await updateUser(currentUser.id, { 
              communityId: newId,
              joinedCommunities: updatedJoined
            });
            setCommunityId(newId);
            localStorage.setItem('communityId', newId);
            setToast({ message: '공동체가 변경되었습니다. 데이터를 불러옵니다...', type: 'SUCCESS' });
          },
          'INFO'
        );
      }}
      onResetData={() => setIsConfirmResetOpen(true)}
      onShowToast={(message, type) => setToast({ message, type })}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <AnimatePresence>
        {isCounselingHistoryOpen && (
          <CounselingHistory onClose={() => setIsCounselingHistoryOpen(false)} />
        )}
      </AnimatePresence>

      {activeTab === 'HOME' && <HomeTab onTabChange={setActiveTab} onOpenCounselingHistory={() => setIsCounselingHistoryOpen(true)} />}
      {activeTab === 'WALLET' && <WalletTab onOpenBudgetModal={() => setIsBudgetModalOpen(true)} onConfirm={confirmAction} onShowToast={(message, type) => setToast({ message, type })} />}
      {activeTab === 'DIARY' && (
        <DiaryTab 
          onOpenModal={(date) => {
            if (date) setPreSelectedDate(date);
            else setPreSelectedDate(null);
            setIsLifeRecordChoiceOpen(true);
          }} 
          onConfirm={confirmAction} 
          onShowToast={(message, type) => setToast({ message, type })} 
        />
      )}
      {activeTab === 'ROUTINE' && <RoutineTab />}
      {activeTab === 'REPORT' && <PsychologicalReportTab />}
      {activeTab === 'RELATIONSHIP' && <RelationshipReportTab />}
      {activeTab === 'NOTICE' && <NoticeTab />}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
           {/* Settings content is handled within Layout.tsx when activeTab is SETTINGS */}
        </div>
      )}

      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="fixed inset-0" onClick={() => setIsQuickAddOpen(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 soft-shadow border border-pastel-lavender/20 relative animate-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-pastel-text mb-8 text-center">무엇을 기록할까요?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-pastel-sand/30 hover:bg-pastel-sand/50 transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-110 transition-transform">
                  <CreditCard size={24} />
                </div>
                <span className="text-xs font-bold text-pastel-text">지출/수입</span>
              </button>
              <button 
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setIsLifeRecordChoiceOpen(true);
                }}
                className="flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-pastel-sand/30 hover:bg-pastel-sand/50 transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pastel-purple shadow-sm group-hover:scale-110 transition-transform">
                  <BookHeart size={24} />
                </div>
                <span className="text-xs font-bold text-pastel-text">일기/일정</span>
              </button>
            </div>
            <button 
              onClick={() => setIsQuickAddOpen(false)}
              className="w-full mt-8 py-4 rounded-2xl text-xs font-bold text-zinc-400 hover:bg-pastel-sand/30 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {isLifeRecordChoiceOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md" onClick={() => setIsLifeRecordChoiceOpen(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl border border-white/20 relative animate-in zoom-in-95 duration-500 overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pastel-lavender/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pastel-purple/5 rounded-full blur-3xl"></div>
            
            <div className="relative text-center mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pastel-purple/60 mb-3 block">New Record</span>
              <h3 className="text-3xl font-black text-pastel-text tracking-tight">어떤 순간을<br />기록할까요?</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
              <button 
                onClick={() => {
                  setDiaryFormMode('DIARY');
                  setIsLifeRecordChoiceOpen(false);
                  setIsDiaryModalOpen(true);
                }}
                className="group flex flex-col items-start gap-6 p-10 rounded-[2.5rem] bg-pastel-sand/20 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-pastel-lavender/20"
              >
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-pastel-purple shadow-sm group-hover:scale-110 transition-all group-hover:rotate-6">
                  <BookHeart size={32} />
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-pastel-text block mb-1">일기 기록</span>
                  <span className="text-[11px] font-semibold text-zinc-400 leading-relaxed block">오늘 하루의 소중한 감정과 이야기를 자유롭게 남겨보세요.</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  setDiaryFormMode('SCHEDULE');
                  setIsLifeRecordChoiceOpen(false);
                  setIsDiaryModalOpen(true);
                }}
                className="group flex flex-col items-start gap-6 p-10 rounded-[2.5rem] bg-pastel-sand/20 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-pastel-lavender/20"
              >
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-110 transition-all group-hover:-rotate-6">
                  <Calendar size={32} />
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-pastel-text block mb-1">일정 예약</span>
                  <span className="text-[11px] font-semibold text-zinc-400 leading-relaxed block">잊지 말아야 할 약속이나 중요한 할 일을 미리 계획하세요.</span>
                </div>
              </button>
            </div>

            <div className="mt-12 flex justify-center">
              <button 
                onClick={() => setIsLifeRecordChoiceOpen(false)}
                className="px-8 py-3 rounded-full text-xs font-black text-zinc-400 hover:text-pastel-text transition-colors flex items-center gap-2"
              >
                나중에 하기 <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <TransactionForm 
          onClose={() => setIsAddModalOpen(false)} 
          onSubmit={async (data) => {
            await addTransaction(data);
            setToast({ message: '거래 내역이 저장되었습니다.', type: 'SUCCESS' });
          }} 
          onShowToast={(message, type) => setToast({ message, type })}
          categories={categories} 
          users={users} 
          currentUser={currentUser} 
        />
      )}
      
      {isDiaryModalOpen && (
        <DiaryScheduleForm 
          mode={diaryFormMode}
          initialDate={preSelectedDate || undefined}
          onClose={() => {
            setIsDiaryModalOpen(false);
            setPreSelectedDate(null);
          }} 
          onSubmit={async (type, data) => {
            if (type === 'DIARY') {
              await addDiary({ ...data, userId: currentUser.id });
              setToast({ message: '일기가 기록되었습니다.', type: 'SUCCESS' });
            } else {
              await addSchedule({ ...data, userId: currentUser.id, isCompleted: false });
              setToast({ message: '일정이 등록되었습니다.', type: 'SUCCESS' });
            }
          }} 
          onShowToast={(message, type) => setToast({ message, type })}
        />
      )}

      {isBudgetModalOpen && (
        <BudgetSettingModal 
          categories={categories}
          users={users}
          transactions={transactions}
          onClose={() => setIsBudgetModalOpen(false)}
          onSave={async (updated) => {
            await setCategories(updated);
            setToast({ message: '예산 설정이 저장되었습니다.', type: 'SUCCESS' });
          }}
          onShowToast={(message, type) => setToast({ message, type })}
        />
      )}

      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 soft-shadow border border-pastel-lavender/20 text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Zap size={32} fill="currentColor" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-pastel-text">데이터 초기화</h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                정말 모든 데이터를 초기화하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsConfirmResetOpen(false)}
                className="flex-1 py-4 rounded-2xl text-xs font-bold text-zinc-400 bg-pastel-sand/50 hover:bg-pastel-sand transition-all"
              >
                취소
              </button>
              <button 
                onClick={async () => {
                  await resetAllData();
                  setIsConfirmResetOpen(false);
                  setToast({ message: '모든 데이터가 초기화되었습니다.', type: 'INFO' });
                }}
                className="flex-1 py-4 rounded-2xl text-xs font-bold text-white bg-rose-400 hover:bg-rose-500 shadow-lg shadow-rose-200 transition-all"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 soft-shadow border border-pastel-lavender/20 text-center space-y-8 animate-in zoom-in duration-300">
            <div className={`w-16 h-16 ${confirmModal.type === 'INFO' ? 'bg-pastel-purple/10 text-pastel-purple' : 'bg-rose-50 text-rose-400'} rounded-full flex items-center justify-center mx-auto shadow-inner`}>
              {confirmModal.type === 'INFO' ? <Zap size={32} /> : <Trash2 size={32} />}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-pastel-text">{confirmModal.title}</h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-4 rounded-2xl text-xs font-bold text-zinc-400 bg-pastel-sand/50 hover:bg-pastel-sand transition-all"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className={`flex-1 py-4 rounded-2xl text-xs font-bold text-white ${confirmModal.type === 'INFO' ? 'bg-pastel-purple hover:bg-pastel-purple/90' : 'bg-rose-400 hover:bg-rose-500'} shadow-lg transition-all`}
              >
                {confirmModal.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
