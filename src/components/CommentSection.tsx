import React, { useState } from 'react';
import { Send, MessageSquare, Trash2 } from 'lucide-react';
import { Comment, User } from '../../types';
import { UserAvatar } from './UserAvatar';

interface CommentSectionProps {
  comments: Comment[];
  users: User[];
  currentUser: User | null;
  onAddComment: (text: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  comments, users, currentUser, onAddComment, onDeleteComment 
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} className="text-pastel-purple" />
        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">댓글 ({comments.length})</h4>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {comments.length === 0 ? (
          <p className="text-[10px] text-zinc-300 italic text-center py-4">첫 댓글을 남겨보세요!</p>
        ) : (
          comments.map(comment => {
            const user = users.find(u => u.id === comment.userId);
            return (
              <div key={comment.id} className="flex gap-3 group">
                <UserAvatar 
                  avatar={user?.avatar || ''} 
                  name={user?.name || ''} 
                  color={user?.color || '#ccc'} 
                  size="sm" 
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-pastel-text">{user?.name}</span>
                    <span className="text-[8px] text-zinc-300 tabular-nums">{comment.date}</span>
                  </div>
                  <div className="bg-pastel-sand/30 p-3 rounded-2xl rounded-tl-none relative">
                    <p className="text-xs text-zinc-600 leading-relaxed">{comment.text}</p>
                    {currentUser?.id === comment.userId && onDeleteComment && (
                      <button 
                        onClick={() => onDeleteComment(comment.id)}
                        className="absolute -right-2 -top-2 p-1 bg-white rounded-full shadow-sm text-zinc-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative mt-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="w-full bg-pastel-sand/20 border border-pastel-sand/50 rounded-2xl py-3 pl-4 pr-12 text-xs font-medium focus:outline-none focus:border-pastel-purple/30 transition-all"
        />
        <button 
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-pastel-purple hover:scale-110 transition-all disabled:opacity-30"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
