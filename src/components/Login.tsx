import React from 'react';
import { signInWithGoogle } from '../firebase';
import { Heart, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FDFBFA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-pastel-purple/10 rounded-[2.5rem] flex items-center justify-center text-pastel-purple animate-pulse">
              <Heart size={40} fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-pastel-text">Co-Life</h1>
          <p className="text-zinc-400 font-medium">우리 둘만의 소중한 일상 관리</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] soft-shadow border border-pastel-lavender/20 space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-pastel-text">환영합니다!</h2>
            <p className="text-sm text-zinc-400">함께하는 삶을 더 즐겁게 만들어보세요.</p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-4 bg-white border border-zinc-200 py-4 rounded-3xl font-bold text-pastel-text hover:bg-zinc-50 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Google로 시작하기
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
          <Sparkles size={12} />
          <span>Shared Harmony & Love</span>
          <Sparkles size={12} />
        </div>
      </div>
    </div>
  );
};
