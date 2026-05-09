
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ChevronDown, 
  Wallet, 
  Plus, 
  BookHeart, 
  Home, 
  Users,
  Trash2,
  LogOut,
  TrendingUp,
  Sparkles,
  ClipboardList,
  Link as LinkIcon,
  Send,
  Settings,
  X,
  Check,
  ChevronRight,
  Coffee,
  Copy,
  ExternalLink,
  CreditCard,
  Megaphone
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { User } from '../../types';
import { logout, auth, switchGoogleAccount } from '../firebase';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { SupportSystem } from './SupportSystem';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'HOME' | 'WALLET' | 'DIARY' | 'ROUTINE' | 'REPORT' | 'RELATIONSHIP' | 'SETTINGS' | 'NOTICE';
  onTabChange: (tab: 'HOME' | 'WALLET' | 'DIARY' | 'ROUTINE' | 'REPORT' | 'RELATIONSHIP' | 'SETTINGS' | 'NOTICE') => void;
  onOpenAddModal: () => void;
  currentUser: User;
  users: User[];
  onUpdateTheme: (userId: string, color: string) => void;
  onSwitchCommunity: (communityId: string) => void;
  onResetData: () => void;
  onShowToast: (message: string, type: 'SUCCESS' | 'ERROR' | 'INFO') => void;
}

const THEME_COLORS = [
  '#FDFBFA', // Default
  '#F9E2E6', // Rose
  '#E8E4F8', // Lavender
  '#E2F0EB', // Mint
  '#FFF1E6', // Peach
  '#F7F3F0', // Sand
  '#F0F4FF', // Sky
  '#FFF9E6', // Lemon
  '#18181B', // Dark
];

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onTabChange, onOpenAddModal,
  currentUser, users, onUpdateTheme, onSwitchCommunity, onResetData, onShowToast
}) => {
  const { 
    psychologicalReports, 
    relationshipReports, 
    diaries, 
    transactions, 
    lifeRoutines,
    schedules,
    fixedExpenses,
    updateUser,
    supportMessages,
    addSupportMessage
  } = useStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [isManageSidebarOpen, setIsManageSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', (!isSidebarCollapsed).toString());
  };

  const latestPsychReport = currentUser && psychologicalReports.filter(r => r.userId === currentUser.id)[0];
  const latestRelReport = relationshipReports[0];
  const latestDiary = diaries[0];
  const latestTransaction = transactions[0];
  const latestRoutine = lifeRoutines[0];

  const isPsychNew = currentUser && latestPsychReport && latestPsychReport.id !== currentUser.lastViewedPsychReportId;
  const isRelNew = currentUser && latestRelReport && latestRelReport.id !== currentUser.lastViewedRelReportId;
  const isDiaryNew = currentUser && latestDiary && latestDiary.id !== currentUser.lastViewedDiaryId;
  const isWalletNew = currentUser && latestTransaction && latestTransaction.id !== currentUser.lastViewedTransactionId;
  const isRoutineNew = currentUser && latestRoutine && latestRoutine.id !== currentUser.lastViewedRoutineId;
  
  const allActivities = [
    ...diaries.map(d => ({ id: d.id, createdAt: d.createdAt || d.date })),
    ...transactions.map(t => ({ id: t.id, createdAt: t.createdAt || t.date })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latestActivity = allActivities[0];
  const isHomeNew = currentUser && latestActivity && latestActivity.id !== currentUser.lastViewedActivityId;

  // Sync body background color with theme
  React.useEffect(() => {
    const themeColor = currentUser?.themeColor || '#FDFBFA';
    document.body.style.backgroundColor = themeColor;
    return () => {
      document.body.style.backgroundColor = '#FDFBFA';
    };
  }, [currentUser?.themeColor]);

  const ALL_NAV_ITEMS = [
    { id: 'HOME', label: '대시보드', icon: LayoutDashboard, isNew: isHomeNew },
    { id: 'WALLET', label: '가계부', icon: Wallet, isNew: isWalletNew },
    { id: 'DIARY', label: '일기장', icon: BookHeart, isNew: isDiaryNew },
    { id: 'ROUTINE', label: '마음루틴', icon: Sparkles, isNew: isRoutineNew },
    { id: 'REPORT', label: '심리분석', icon: ClipboardList, isNew: isPsychNew },
    { id: 'RELATIONSHIP', label: '관계시너지', icon: Users, isNew: isRelNew },
    { id: 'NOTICE', label: '공지사항', icon: Megaphone },
    { id: 'SETTINGS', label: '초대하기', icon: LinkIcon },
  ];

  const hiddenTabs = currentUser?.hiddenTabs || [];
  const navOrder = currentUser?.navOrder || ALL_NAV_ITEMS.map(i => i.id);
  const navDividers = currentUser?.navDividers || [];
  
  // Sort items based on custom order and include any missing items at the end
  const sortedNavItems = [...ALL_NAV_ITEMS].sort((a, b) => {
    const aIdx = navOrder.indexOf(a.id);
    const bIdx = navOrder.indexOf(b.id);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const navItems = sortedNavItems.filter(item => !hiddenTabs.includes(item.id) || item.id === activeTab || item.id === 'SETTINGS');

  const toggleTabVisibility = async (tabId: string) => {
    if (!currentUser) return;
    const currentHidden = [...(currentUser.hiddenTabs || [])];
    let newHidden: string[];
    if (currentHidden.includes(tabId)) {
      newHidden = currentHidden.filter(id => id !== tabId);
    } else {
      newHidden = [...currentHidden, tabId];
    }
    await updateUser(currentUser.id, { hiddenTabs: newHidden });
  };

  const moveTab = async (tabId: string, direction: 'UP' | 'DOWN') => {
    if (!currentUser) return;
    const currentOrder = [...navOrder];
    const index = currentOrder.indexOf(tabId);
    if (index === -1) return;

    if (direction === 'UP' && index > 0) {
      [currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
    } else if (direction === 'DOWN' && index < currentOrder.length - 1) {
      [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
    }
    await updateUser(currentUser.id, { navOrder: currentOrder });
  };

  const toggleDivider = async (tabId: string) => {
    if (!currentUser) return;
    const currentDividers = [...navDividers];
    let newDividers: string[];
    if (currentDividers.includes(tabId)) {
      newDividers = currentDividers.filter(id => id !== tabId);
    } else {
      newDividers = [...currentDividers, tabId];
    }
    await updateUser(currentUser.id, { navDividers: newDividers });
  };

  const copyInviteLink = () => {
    if (currentUser.communityId) {
      const url = `${window.location.origin}${window.location.pathname}?invite=${currentUser.communityId}`;
      navigator.clipboard.writeText(url);
      onShowToast('초대 링크가 복사되었습니다!', 'INFO');
    }
  };

  if (!currentUser) return null;

  return (
    <div 
      className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-1000 text-pastel-text`}
      style={{ backgroundColor: currentUser?.themeColor || '#FDFBFA' }}
    >
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-pastel-lavender/20"
            >
              <div className="p-10 border-b border-pastel-lavender/10 flex items-center justify-between bg-gradient-to-r from-pastel-purple/5 to-white">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-white rounded-[1.2rem] soft-shadow text-pastel-purple border border-pastel-lavender/20">
                    <Settings size={24} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-pastel-text tracking-tighter">메뉴 관리</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                       <LayoutDashboard size={10} /> 사이드바 노출 설정
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-3 hover:bg-rose-50 hover:text-rose-400 rounded-2xl transition-all duration-300 text-zinc-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-5">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Category Display</p>
                    <span className="text-[9px] font-bold text-pastel-purple bg-pastel-purple/5 px-3 py-1 rounded-full border border-pastel-purple/10">자동 저장됨</span>
                  </div>
                  
                  <div className="grid gap-3.5">
                    {sortedNavItems.filter(i => i.id !== 'SETTINGS').map((item, idx) => {
                      const isHidden = (currentUser.hiddenTabs || []).includes(item.id);
                      const hasDivider = (currentUser.navDividers || []).includes(item.id);
                      return (
                        <div key={item.id} className="space-y-2">
                          <div 
                            className={`flex items-center justify-between p-[1.4rem] rounded-[2rem] border transition-all duration-500 ${isHidden ? 'bg-zinc-50/50 border-zinc-100/50 grayscale opacity-40' : 'bg-white border-pastel-lavender/30 soft-shadow group hover:border-pastel-purple/30 hover:scale-[1.01]'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className="flex flex-col gap-1 pr-2 border-r border-zinc-100">
                                <button 
                                  onClick={() => moveTab(item.id, 'UP')}
                                  disabled={idx === 0}
                                  className={`p-1 hover:text-pastel-purple transition-colors ${idx === 0 ? 'text-zinc-200' : 'text-zinc-300'}`}
                                >
                                  <ChevronDown size={14} className="rotate-180" />
                                </button>
                                <button 
                                  onClick={() => moveTab(item.id, 'DOWN')}
                                  disabled={idx === sortedNavItems.filter(i => i.id !== 'SETTINGS').length - 1}
                                  className={`p-1 hover:text-pastel-purple transition-colors ${idx === sortedNavItems.filter(i => i.id !== 'SETTINGS').length - 1 ? 'text-zinc-200' : 'text-zinc-400'}`}
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                              <div className={`p-3 rounded-2xl transition-all duration-500 scale-110 ${isHidden ? 'bg-zinc-100 text-zinc-300' : 'bg-gradient-to-br from-white to-pastel-lavender/10 text-pastel-purple soft-shadow border border-pastel-lavender/20'}`}>
                                <item.icon size={20} />
                              </div>
                              <div>
                                <p className={`text-[12px] font-bold tracking-tight transition-colors duration-500 ${isHidden ? 'text-zinc-400' : 'text-pastel-text'}`}>{item.label}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[10px] text-zinc-400 font-medium">{isHidden ? '숨김' : '표시 중'}</p>
                                  {!isHidden && (
                                    <button 
                                      onClick={() => toggleDivider(item.id)}
                                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border transition-all ${hasDivider ? 'bg-pastel-purple text-white border-pastel-purple' : 'bg-white text-zinc-300 border-zinc-200'}`}
                                    >
                                      구분선 {hasDivider ? 'ON' : 'OFF'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => toggleTabVisibility(item.id)}
                              className={`relative w-14 h-7 rounded-full transition-all duration-500 flex items-center px-1 ${!isHidden ? 'bg-pastel-purple shadow-lg shadow-pastel-purple/30' : 'bg-zinc-200'}`}
                            >
                              <motion.div 
                                animate={{ x: !isHidden ? 28 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`w-5 h-5 bg-white rounded-full shadow-md z-10`} 
                              />
                              {!isHidden && <Sparkles size={10} className="absolute right-3 text-white/40 animate-pulse" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-pastel-sand/20 to-pastel-sand/60 rounded-[2.5rem] border border-pastel-sand relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 text-pastel-sand opacity-40 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles size={100} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white border border-pastel-sand rounded-xl flex items-center justify-center text-pastel-purple shadow-sm">
                        <Sparkles size={16} />
                      </div>
                      <p className="text-xs font-black text-pastel-text uppercase tracking-widest">Shared Space</p>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold leading-relaxed pr-8">
                      파트너와 함께 공동체를 관리하며<br/>
                      더 투명하고 따뜻한 일상을 만들어보세요.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-10 bg-white border-t border-pastel-lavender/10">
                <button 
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-full py-5 bg-pastel-purple text-white rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-pastel-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  설정 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coffee Support Modal Replacement */}
      <AnimatePresence>
        {isCoffeeModalOpen && (
          <SupportSystem 
            isOpen={isCoffeeModalOpen}
            onClose={() => setIsCoffeeModalOpen(false)}
            currentUser={currentUser}
            users={users}
            supportMessages={supportMessages}
            onAddSupport={addSupportMessage}
            onShowToast={onShowToast}
            onUpdateUser={updateUser}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-white/40 backdrop-blur-md border-r border-pastel-lavender/20 sticky top-0 h-screen z-50 transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}
      >
        <div className={`p-8 flex items-center mb-10 ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-10'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="bg-pastel-purple text-white p-2.5 rounded-2xl shadow-md hover:scale-110 transition-all active:scale-95"
            >
              <Home size={20} />
            </button>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tighter text-pastel-text animate-in fade-in duration-500">Co-Life</h1>
                <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-2 bg-pastel-lavender/10 text-zinc-400 hover:text-pastel-purple rounded-xl transition-all"
                  title="메뉴 관리"
                >
                  <Settings size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 space-y-2 ${isSidebarCollapsed ? 'px-4' : 'px-6'}`}>
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              <button 
                onClick={() => onTabChange(item.id as any)} 
                className={`w-full flex items-center rounded-[1.5rem] tracking-widest transition-all group relative ${isSidebarCollapsed ? 'justify-center p-4' : 'gap-4 px-6 py-4 text-xs font-bold uppercase'} ${activeTab === item.id ? 'bg-pastel-purple text-white shadow-lg shadow-pastel-purple/20' : 'text-zinc-400 hover:bg-white/60 hover:text-pastel-purple'}`}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-zinc-300 group-hover:text-pastel-purple'} />
                {!isSidebarCollapsed && (
                  <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>
                )}
                
                {item.isNew && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`absolute bg-rose-400 text-white rounded-full font-black tracking-normal ${isSidebarCollapsed ? 'top-2 right-2 w-2 h-2 p-0' : 'right-4 top-1/2 -translate-y-1/2 text-[8px] px-1.5 py-0.5'}`}
                  >
                    {!isSidebarCollapsed && 'NEW'}
                  </motion.div>
                )}
              </button>
              {(currentUser.navDividers || []).includes(item.id) && (
                <div className={`h-px bg-pastel-lavender/10 my-4 ${isSidebarCollapsed ? 'mx-2' : 'mx-4'}`}></div>
              )}
            </React.Fragment>
          ))}

          <div className="pt-4 mt-2 border-t border-rose-50">
            <button 
              onClick={() => setIsCoffeeModalOpen(true)}
              className={`w-full flex items-center bg-rose-50/30 rounded-2xl border border-rose-100 transition-all group relative ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-tighter'} text-rose-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 shadow-sm`}
              title={isSidebarCollapsed ? '커피 한 잔 후원' : ''}
            >
              <div className={`shrink-0 flex items-center justify-center ${isSidebarCollapsed ? '' : 'w-6 h-6 bg-rose-100/50 rounded-lg group-hover:bg-rose-100'}`}>
                <Coffee size={16} className="text-rose-300 group-hover:text-rose-400" />
              </div>
              {!isSidebarCollapsed && (
                <span className="animate-in fade-in slide-in-from-left-2 duration-300">커피 한 잔 후원</span>
              )}
            </button>
          </div>
        </nav>

        <div className={`p-6 space-y-6 ${isSidebarCollapsed ? 'items-center' : ''}`}>
          <div className="h-px bg-pastel-lavender/20"></div>
          
          {/* User Profile in Sidebar */}
          <div className="relative flex items-center gap-2">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex-1 flex items-center bg-white rounded-2xl soft-shadow border border-pastel-lavender/30 transition-all hover:border-pastel-purple ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-4 gap-3'}`}
            >
              <UserAvatar avatar={currentUser.avatar} name={currentUser.name} color={currentUser.color} isOnline={currentUser.isOnline} />
              {!isSidebarCollapsed && (
                <>
                  <div className="flex-1 text-left overflow-hidden animate-in fade-in duration-300">
                      <p className="text-xs font-bold truncate">{currentUser.name}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-[8px] text-zinc-400 font-medium truncate shrink-0">{auth.currentUser?.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                       <p className="text-[9px] text-zinc-400 font-bold truncate uppercase tracking-widest">{currentUser.communityId}</p>
                       <div className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                    </div>
                  </div>
                  <ChevronDown size={14} className={`text-zinc-300 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </div>

          <div className="relative">
            {/* Partner Status Section */}
            {!isSidebarCollapsed && (
              <div className="mt-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mb-3 block">파트너 접속 현황</span>
                <div className="flex flex-wrap gap-3">
                  {users.filter(u => u.id !== currentUser.id).map(partner => (
                    <div key={partner.id} className="group relative" title={`${partner.name} (${partner.isOnline ? '접속 중' : '오프라인'})`}>
                      <UserAvatar 
                        avatar={partner.avatar} 
                        name={partner.name} 
                        color={partner.color} 
                        isOnline={partner.isOnline} 
                        size="sm"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-pastel-text text-white text-[8px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {partner.name}
                      </div>
                    </div>
                  ))}
                  {users.length <= 1 && (
                    <p className="text-[9px] text-zinc-300 italic">초대된 파트너가 없습니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className={`absolute left-0 mb-3 bg-white rounded-[2.5rem] p-6 z-20 shadow-2xl border border-pastel-lavender/20 animate-in fade-in slide-in-from-bottom-2 ${isSidebarCollapsed ? 'bottom-20 w-64 translate-x-2' : 'bottom-full w-72'}`}>
                  <div className="space-y-6">
                    <div className="px-1">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-4">계정 관리</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            switchGoogleAccount();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black text-pastel-purple bg-pastel-purple/5 hover:bg-pastel-purple/10 transition-all uppercase tracking-widest shadow-sm shadow-pastel-purple/10"
                        >
                          <Users size={16} className="shrink-0" />
                          <span className="truncate">부계정 전환 / 로그인</span>
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-bold text-zinc-400 hover:bg-zinc-50 transition-all uppercase tracking-widest"
                        >
                          <LogOut size={16} className="shrink-0" />
                          로그아웃
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-50"></div>

                    <div className="px-1">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-4">배경 테마</p>
                      <div className="grid grid-cols-4 gap-2">
                        {THEME_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => onUpdateTheme(currentUser.id, color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${currentUser?.themeColor === color ? 'border-pastel-purple scale-110 shadow-md' : 'border-white shadow-inner'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-zinc-50"></div>

                    <div className="px-1">
                      <button
                        onClick={onResetData}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-bold text-rose-400 hover:bg-rose-50 transition-all uppercase tracking-widest"
                      >
                        <Trash2 size={14} className="shrink-0" />
                        데이터 초기화
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3" onClick={() => onTabChange('HOME')}>
            <div className="bg-pastel-purple text-white p-2 rounded-xl shadow-md">
              <Home size={16} />
            </div>
            <h1 className="text-lg font-bold tracking-tighter text-pastel-text">Co-Life</h1>
          </div>
          <button 
            onClick={() => setIsCoffeeModalOpen(true)}
            className="p-2 bg-rose-50 text-rose-300 rounded-xl"
            title="커피 쏘기 (송금)"
          >
            <Coffee size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex items-center gap-2">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2"
            >
              <UserAvatar avatar={currentUser.avatar} name={currentUser.name} color={currentUser.color} isOnline={currentUser.isOnline} />
              <ChevronDown size={14} className={`text-zinc-300 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] p-4 z-20 shadow-2xl border border-pastel-lavender/20 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-4">
                    <div className="px-2 py-1">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-3">계정 관리</p>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            switchGoogleAccount();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold text-pastel-purple bg-pastel-purple/5 hover:bg-pastel-purple/10 transition-all uppercase tracking-widest"
                        >
                          <Users size={14} />
                          계정 전환
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold text-zinc-400 hover:bg-zinc-50 transition-all uppercase tracking-widest"
                        >
                          <LogOut size={14} />
                          로그아웃
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className={`flex-1 w-full p-6 md:p-12 overflow-y-auto max-h-screen relative transition-all duration-500 ease-in-out`}>
        <div className={`mx-auto ${isSidebarCollapsed ? 'max-w-7xl' : 'max-w-6xl'}`}>
          {activeTab === 'SETTINGS' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="bg-white p-12 rounded-[3.5rem] soft-shadow border border-pastel-lavender/20 text-center space-y-8">
                <div className="w-20 h-20 bg-pastel-purple/10 text-pastel-purple rounded-[2.5rem] flex items-center justify-center mx-auto">
                  <Users size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-pastel-text">공동체 관리</h2>
                  <p className="text-sm text-zinc-400 font-medium">파트너를 초대하거나 다른 공간으로 이동할 수 있습니다.</p>
                </div>

                {/* Invite Section */}
                <div className="bg-pastel-sand/30 p-8 rounded-[2.5rem] border border-pastel-sand/50 relative group">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em] block mb-4">현재 초대 코드</span>
                  <p className="text-4xl font-black tracking-[0.2em] text-pastel-purple tabular-nums">{currentUser.communityId}</p>
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={copyInviteLink}
                      className="p-3 bg-white rounded-2xl soft-shadow text-pastel-purple hover:scale-110 transition-all"
                      title="초대 링크 복사"
                    >
                      <LinkIcon size={18} />
                    </button>
                  </div>
                  <p className="mt-6 text-[10px] text-zinc-400 font-medium">
                    대시보드와 가계부를 함께 공유할 파트너에게 이 코드를 보내주세요.
                  </p>
                </div>

                {/* Switch Community Section */}
                <div className="pt-8 border-t border-pastel-sand/50 space-y-8">
                  <div className="text-left px-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">사용 기록이 있는 공동체</p>
                      <Sparkles size={10} className="text-pastel-purple animate-pulse" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                       {Array.from(new Set([
                         ...(currentUser.joinedCommunities || []),
                         ...JSON.parse(localStorage.getItem('community_history') || '[]')
                       ])).map((code: string) => (
                         <button 
                           key={code}
                           onClick={() => onSwitchCommunity(code)}
                           className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${currentUser.communityId === code ? 'bg-pastel-purple text-white border-pastel-purple shadow-sm shadow-pastel-purple/20' : 'bg-white text-zinc-400 border-zinc-100 hover:border-pastel-purple/30'}`}
                         >
                           {code}
                         </button>
                       ))}
                       {(!currentUser.joinedCommunities || currentUser.joinedCommunities.length === 0) && !localStorage.getItem('community_history') && (
                         <p className="text-[10px] text-zinc-400 italic">기록이 없습니다.</p>
                       )}
                    </div>

                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-3">다른 공동체로 이동 (데이터 복구용)</p>
                    <div className="flex gap-2">
                      <input 
                        id="switch-community-id"
                        type="text" 
                        placeholder="이전 코드 입력"
                        className="flex-1 bg-pastel-sand/20 border-none p-4 rounded-2xl text-sm font-bold text-pastel-text focus:ring-2 focus:ring-pastel-purple transition-all"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.toUpperCase();
                            if (val) {
                              onSwitchCommunity(val);
                            }
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('switch-community-id') as HTMLInputElement;
                          const val = input.value.toUpperCase();
                          if (val) {
                            onSwitchCommunity(val);
                          }
                        }}
                        className="bg-pastel-purple text-white px-6 rounded-2xl font-bold text-xs hover:bg-pastel-purple/90 transition-all"
                      >
                        이동
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between bg-zinc-50 p-4 rounded-2xl border border-dashed border-zinc-200">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 mb-1">데이터 수동 백업</p>
                        <p className="text-[8px] text-zinc-400">현재 공동체의 모든 데이터를 파일로 저장합니다.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const data = {
                            communityId: currentUser.communityId,
                            transactions,
                            diaries,
                            schedules,
                            fixedExpenses,
                            timestamp: new Date().toISOString()
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `colife-backup-${currentUser.communityId}-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                        }}
                        className="p-2 bg-white rounded-xl border border-zinc-100 hover:border-pastel-purple text-zinc-400 hover:text-pastel-purple transition-all"
                      >
                        <Send size={14} className="rotate-90" />
                      </button>
                    </div>
                    <p className="mt-4 text-[10px] text-zinc-400 leading-relaxed">
                      이전에 사용하던 코드를 입력하면 해당 데이터를 불러올 수 있습니다. <br/>
                      데이터가 보이지 않는다면 기존에 사용하던 코드가 맞는지 확인해 주세요.
                    </p>
                  </div>
                </div>

                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 text-left">
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-2">How to join</p>
                    <p className="text-xs text-emerald-700/70 font-medium leading-relaxed">파트너가 로그인 후 '공간 참여하기'에서 이 코드를 입력하면 연결됩니다.</p>
                  </div>
                  <div className="p-6 bg-pastel-purple/5 rounded-3xl border border-pastel-purple/10 text-left">
                    <p className="text-pastel-purple text-[10px] font-bold uppercase tracking-widest mb-2">Shared Data</p>
                    <p className="text-xs text-pastel-purple/70 font-medium leading-relaxed">연결되면 가계부, 일기, 일정을 실시간으로 함께 볼 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
        <nav className="glass rounded-[2.5rem] flex justify-around items-center py-5 soft-shadow border border-white/40">
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              <button 
                onClick={() => onTabChange(item.id as any)} 
                className={`transition-all duration-300 relative ${activeTab === item.id ? 'text-pastel-purple scale-110' : 'text-zinc-300'}`}
              >
                <item.icon size={24} />
                {item.isNew && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-rose-400 rounded-full"
                  />
                )}
              </button>
              {(currentUser.navDividers || []).includes(item.id) && (
                <div className="w-px h-6 bg-pastel-lavender/20 mx-1"></div>
              )}
            </React.Fragment>
          ))}
          <button 
            onClick={() => setIsCoffeeModalOpen(true)}
            className="w-12 h-12 bg-rose-50/50 border border-rose-100 text-rose-300 hover:text-rose-400 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90"
          >
            <Coffee size={24} />
          </button>
        </nav>
      </div>

      {/* Global Add Button */}
      <button 
        onClick={onOpenAddModal}
        className="fixed bottom-10 right-10 md:bottom-12 md:right-12 bg-pastel-purple text-white w-14 h-14 md:w-16 md:h-16 rounded-3xl shadow-xl hover:scale-110 transition-all active:scale-95 z-40 flex items-center justify-center group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>
    </div>
  );
};
