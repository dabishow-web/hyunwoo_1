import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, X, User as UserIcon, MessageCircle, Heart, CheckCircle2, 
  CreditCard, ExternalLink, ShieldCheck, ChevronDown, Sparkles,
  ArrowRight, Globe, Lock, Pencil, Image as ImageIcon, Save
} from 'lucide-react';
import { auth } from '../firebase'; // Import auth to check email
import { User, SupportMessage } from '../../types';
import { UserAvatar } from './UserAvatar';

interface SupportSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  supportMessages: SupportMessage[];
  onAddSupport: (message: Omit<SupportMessage, 'id'>) => Promise<void>;
  onShowToast: (msg: string, type: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
}

export const SupportSystem: React.FC<SupportSystemProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  supportMessages,
  onAddSupport,
  onShowToast,
  onUpdateUser
}) => {
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT'>('DETAILS');
  const [amount, setAmount] = useState<string>('');
  const [donorName, setDonorName] = useState(currentUser.name);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [introText, setIntroText] = useState('');
  const [savingIntro, setSavingIntro] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const CREATOR_EMAIL = 'dabishow8586@gmail.com';
  const isCreator = auth.currentUser?.email === CREATOR_EMAIL;

  // For this component, we assume the "Partner" is the receiver.
  // In a real app, this might be a specific admin user.
  const receiver = currentUser ? (users.find(u => u.id !== currentUser.id) || currentUser) : null;

  React.useEffect(() => {
    if (receiver) {
      setIntroText(receiver.introText || '지구에 평화가 깃들기를 🌍');
    }
  }, [receiver]);

  if (!isOpen || !currentUser || !receiver) return null;

  const handleSaveIntro = async () => {
    if (!isCreator) {
      onShowToast('제작자만 수정할 수 있습니다.', 'ERROR');
      return;
    }
    setSavingIntro(true);
    try {
      await onUpdateUser(receiver.id, { introText });
      onShowToast('소개 문구가 저장되었습니다.', 'SUCCESS');
      setIsEditingIntro(false);
    } catch (err) {
      onShowToast('소개 문구 저장에 실패했습니다.', 'ERROR');
    } finally {
      setSavingIntro(false);
    }
  };

  const handleImageClick = () => {
    if (isCreator) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isCreator) {
      onShowToast('제작자만 권한이 있습니다.', 'ERROR');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      onShowToast('이미지 크기는 2MB 이하여야 합니다.', 'ERROR');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await onUpdateUser(receiver.id, { profileImageUrl: base64String });
        onShowToast('프로필 이미지가 업데이트되었습니다.', 'SUCCESS');
      } catch (err) {
        onShowToast('이미지 업로드에 실패했습니다.', 'ERROR');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendFeedback = async () => {
    if (!donorName.trim()) {
      onShowToast('이름을 입력해주세요.', 'ERROR');
      return;
    }
    if (!message.trim()) {
      onShowToast('피드백을 입력해주세요.', 'ERROR');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSupport({
        senderId: currentUser.id,
        senderName: donorName,
        receiverId: receiver.id,
        amount: amount ? Number(amount) : undefined,
        message,
        createdAt: new Date().toISOString()
      });
      onShowToast('따뜻한 피드백이 전달되었습니다!', 'SUCCESS');
      setMessage('');
    } catch (err) {
      onShowToast('피드백 전달 중 오류가 발생했습니다.', 'ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-5xl bg-[#F8F9FD] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[70vh] max-h-[90vh]"
      >
        {/* Left Side: Recent Supporters Feed */}
        <div className="flex-1 p-10 bg-white overflow-y-auto custom-scrollbar">
          <div className="space-y-12">
            <header className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-zinc-800 tracking-tight">{receiver.name} 파트너 소개</h2>
                {isCreator && (
                  <button 
                    onClick={() => isEditingIntro ? handleSaveIntro() : setIsEditingIntro(true)}
                    disabled={savingIntro}
                    className="p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:text-pastel-purple transition-colors disabled:opacity-50"
                    title={isEditingIntro ? "저장" : "편집"}
                  >
                    {isEditingIntro ? <Save size={18} /> : <Pencil size={18} />}
                  </button>
                )}
              </div>
              
              <div className="flex items-start gap-4">
                <div className="relative group shrink-0">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div 
                    onClick={handleImageClick}
                    className={`w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-200 border-2 border-dashed border-zinc-200 ${isCreator ? 'group-hover:border-pastel-purple group-hover:text-pastel-purple cursor-pointer' : ''} transition-all overflow-hidden relative`}
                  >
                    {receiver.profileImageUrl ? (
                      <img src={receiver.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} />
                    )}
                    {isCreator && (
                      <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                         <ImageIcon size={20} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  {isEditingIntro ? (
                    <textarea
                      value={introText}
                      onChange={(e) => setIntroText(e.target.value)}
                      className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-pastel-purple/10 outline-none resize-none transition-all"
                      rows={3}
                      placeholder="소개 문구를 입력하세요..."
                    />
                  ) : (
                    <p className="text-zinc-500 font-medium leading-relaxed bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50">
                      {receiver.introText || '지구에 평화가 깃들기를 🌍'}
                    </p>
                  )}
                  <div className="pt-2 flex items-center gap-2">
                    <Globe size={18} className="text-zinc-300" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Global Partner</span>
                  </div>
                </div>
              </div>
            </header>

            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-800">최근 지지자들</h3>
              </div>

              <div className="space-y-8">
                {supportMessages.length > 0 ? (
                  supportMessages.slice(0, 10).map((msg) => (
                    <div key={msg.id} className="group relative flex gap-4">
                      <div className="shrink-0">
                         <div className="w-12 h-12 bg-pastel-lavender/10 rounded-2xl flex items-center justify-center text-pastel-purple ring-4 ring-white">
                            <Coffee size={20} />
                         </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-bold text-zinc-700">
                            <span className="text-pastel-purple">{msg.senderName}</span> 지지자가 되었습니다.
                          </p>
                          <span className="text-[10px] text-zinc-300 font-medium">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {msg.message && (
                          <div className="p-4 bg-zinc-50 rounded-2xl rounded-tl-none border border-zinc-100 inline-block max-w-[90%]">
                            <p className="text-xs text-zinc-600 leading-relaxed font-medium">{msg.message}</p>
                          </div>
                        )}
                        
                        {msg.adminReply && (
                          <div className="flex gap-2">
                             <UserAvatar avatar="" name="Admin" color="#A78BFA" size="sm" />
                            <div className="p-4 bg-pastel-lavender/5 border border-pastel-lavender/10 rounded-2xl rounded-tl-none inline-block max-w-[90%]">
                              <p className="text-xs text-pastel-text leading-relaxed font-medium">{msg.adminReply}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                      <Heart size={32} />
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">첫 번째 지지자가 되어 마음을 전해보세요!</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Right Side: Support Form */}
        <div className="w-full md:w-[400px] bg-[#F8F9FD] p-10 flex flex-col justify-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-zinc-800 tracking-tight">마음 전하기</h3>
              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">Support with Love</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 space-y-6">
              {/* Feedback Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 ml-1">이름</label>
                  <input 
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="이름 또는 @yoursocial"
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[13px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-pastel-purple/10 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 ml-1">관리자에게 피드백 전하기</label>
                  <div className="relative">
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="좋은 말을 해주세요..."
                      rows={3}
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[13px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-pastel-purple/10 transition-all resize-none"
                    />
                    <div className="absolute right-4 bottom-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-zinc-300 shadow-sm">
                      <MessageCircle size={16} />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSendFeedback}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-zinc-900 text-white rounded-3xl font-bold text-[13px] hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? '전달 중...' : <><MessageCircle size={14} /> 피드백 전달하기</>}
                </button>
              </div>

              <div className="relative flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">or 후원하기</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              <div className="space-y-6 text-center">
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <a 
                      href="https://acoffee.shop/d/37f0135c-2765-4b8c-afff-ca1812dfc4c8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-105 transition-transform active:scale-95"
                    >
                        <img src="https://acoffee.shop/img/ko/png/Button_L705.png" alt="Donate Coffee" className="max-w-full" />
                    </a>
                </div>
              </div>

              <div className="p-4 bg-pastel-purple/5 rounded-2xl border border-pastel-purple/10">
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                  모든 후원은 외부 플랫폼(acoffee.shop)을 통해 이루어집니다.
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full py-2 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest hover:text-zinc-500 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
