import React from 'react';
import { X, Calendar, User as UserIcon, MessageSquare, Heart } from 'lucide-react';
import { Transaction, Category, User, TransactionType, Comment } from '../../types';
import { UserAvatar } from './UserAvatar';
import { CommentSection } from './CommentSection';
import { renderCategoryIcon } from '../../App';

interface CategoryDetailModalProps {
  category: Category;
  transactions: Transaction[];
  users: User[];
  currentUser: User | null;
  onClose: () => void;
  onToggleLike: (id: string, userId: string) => Promise<void>;
  onAddComment: (id: string, comment: Omit<Comment, 'id'>) => Promise<void>;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({ 
  category, transactions, users, currentUser, onClose, onToggleLike, onAddComment, onUpdateTransaction 
}) => {
  const [showCommentsFor, setShowCommentsFor] = React.useState<string | null>(null);
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pastel-sand/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-5xl w-full max-w-2xl shadow-2xl border border-pastel-lavender/30 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-pastel-sand flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: category.color + '40', color: category.color }}>
              {renderCategoryIcon(category.iconId, 28)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-pastel-text">{category.name} 상세 내역</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                총 {transactions.length}건 | 합계 {totalAmount.toLocaleString()}원
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pastel-sand rounded-full transition-colors text-zinc-300">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8 flex-1 space-y-4 custom-scrollbar bg-pastel-sand/10">
          {transactions.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <p className="text-sm font-bold uppercase tracking-widest">내역이 없습니다.</p>
            </div>
          ) : (
            transactions.map(t => {
              const user = users.find(u => u.id === t.userId);
              return (
                <React.Fragment key={t.id}>
                  <div className="bg-white p-5 rounded-3xl soft-shadow border border-pastel-lavender/10 flex items-center justify-between group transition-all hover:scale-[1.01]">
                  <div className="flex items-center gap-4">
                    <UserAvatar avatar={user?.avatar || ''} name={user?.name || ''} color={user?.color || '#ccc'} size="md" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-zinc-300 tabular-nums">{t.date}</span>
                        <span className="text-[9px] font-bold text-zinc-400 bg-pastel-sand px-2 py-0.5 rounded-full">{user?.name}</span>
                      </div>
                      <p className="text-sm font-medium text-pastel-text/90">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold tabular-nums tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-500/80' : 'text-pastel-text'}`}>
                      {t.type === TransactionType.INCOME ? '+' : ''} {t.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-1">
                      <button 
                        onClick={() => currentUser && onToggleLike(t.id, currentUser.id)}
                        className={`flex items-center gap-1 text-[10px] font-bold transition-all hover:scale-110 ${t.likes?.includes(currentUser?.id || '') ? 'text-rose-500' : 'text-zinc-300 hover:text-rose-300'}`}
                      >
                        <Heart size={12} fill={t.likes?.includes(currentUser?.id || '') ? 'currentColor' : 'none'} />
                        {t.likes?.length || 0}
                      </button>
                      <button 
                        onClick={() => setShowCommentsFor(showCommentsFor === t.id ? null : t.id)}
                        className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${showCommentsFor === t.id ? 'text-pastel-purple' : 'text-zinc-300 hover:text-pastel-purple'}`}
                      >
                        <MessageSquare size={12} />
                        {t.comments?.length || 0}
                      </button>
                    </div>
                  </div>
                </div>
                {showCommentsFor === t.id && (
                  <div className="bg-white p-6 rounded-3xl border border-pastel-lavender/10 animate-in slide-in-from-top-2">
                    <CommentSection 
                      comments={t.comments || []}
                      users={users}
                      currentUser={currentUser}
                      onAddComment={async (text) => {
                        if (currentUser) {
                          await onAddComment(t.id, {
                            userId: currentUser.id,
                            text,
                            date: new Date().toISOString().split('T')[0]
                          });
                        }
                      }}
                      onDeleteComment={async (commentId) => {
                        const newComments = (t.comments || []).filter(c => c.id !== commentId);
                        await onUpdateTransaction(t.id, { comments: newComments });
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-pastel-sand text-center">
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-pastel-sand text-pastel-text text-xs font-bold rounded-2xl hover:bg-pastel-lavender/30 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};