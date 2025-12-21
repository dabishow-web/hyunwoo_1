import React, { useState } from 'react';
import { LayoutDashboard, PlusCircle, PieChart, ChevronDown, ClipboardList, Briefcase } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'DASHBOARD' | 'BUDGET' | 'HISTORY' | 'SUMMARY';
  onTabChange: (tab: 'DASHBOARD' | 'BUDGET' | 'HISTORY' | 'SUMMARY') => void;
  onOpenAddModal: () => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onTabChange, onOpenAddModal,
  currentUser, users, onSwitchUser
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20 md:pb-0">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-black sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onTabChange('DASHBOARD')}
        >
          <div className="bg-black text-white p-2">
            <Briefcase size={18} />
          </div>
          <h1 className="text-lg font-bold uppercase tracking-tighter">공동 가계부 시스템</h1>
        </div>

        <div className="flex items-center gap-6">
          {/* 데스크톱 내비게이션 */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => onTabChange('DASHBOARD')} className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${activeTab === 'DASHBOARD' ? 'underline' : ''}`}>대시보드</button>
            <button onClick={() => onTabChange('HISTORY')} className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${activeTab === 'HISTORY' ? 'underline' : ''}`}>거래내역</button>
            <button onClick={() => onTabChange('BUDGET')} className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${activeTab === 'BUDGET' ? 'underline' : ''}`}>예산한도</button>
          </nav>

          <div className="h-6 w-px bg-zinc-200 hidden md:block"></div>

          <button
            onClick={() => onTabChange('SUMMARY')}
            className={`p-2 transition ${activeTab === 'SUMMARY' ? 'bg-black text-white' : 'text-black hover:bg-zinc-100 border border-transparent hover:border-black'}`}
            title="종합 보고서"
          >
            <ClipboardList size={20} />
          </button>

          {/* 사용자 프로필 */}
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-1.5 pr-4 hover:border-black transition"
            >
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.name[0]}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">{currentUser.name}</span>
              <ChevronDown size={12} className="text-zinc-400" />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-black p-1 z-20 shadow-xl">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition ${currentUser.id === u.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-12">
        {children}
      </main>

      {/* 모바일 하단 내비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black flex justify-around py-4 z-40 safe-area-pb">
        <button onClick={() => onTabChange('DASHBOARD')} className={activeTab === 'DASHBOARD' ? 'text-black' : 'text-zinc-300'}><LayoutDashboard size={24} /></button>
        <button onClick={() => onTabChange('HISTORY')} className={activeTab === 'HISTORY' ? 'text-black' : 'text-zinc-300'}><ClipboardList size={24} /></button>
        <button onClick={() => onTabChange('BUDGET')} className={activeTab === 'BUDGET' ? 'text-black' : 'text-zinc-300'}><PieChart size={24} /></button>
      </nav>

      {/* 부유식 추가 버튼 */}
      <button 
        onClick={onOpenAddModal}
        className="fixed bottom-10 right-10 bg-black text-white p-4 shadow-2xl hover:scale-110 transition active:scale-95 z-40 group"
      >
        <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};