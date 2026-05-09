import React from 'react';
import { User } from '../../types';
import { UserAvatar } from './UserAvatar';
import { motion } from 'motion/react';

interface CommunityUserSelectorProps {
  users: User[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
}

export const CommunityUserSelector: React.FC<CommunityUserSelectorProps> = ({
  users,
  selectedUserId,
  onSelect
}) => {
  return (
    <div className="flex items-center gap-4 py-2 overflow-x-auto scrollbar-hide">
      {users.map((user) => (
        <motion.button
          key={user.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(user.id)}
          className={`flex flex-col items-center gap-2 p-2 min-w-[70px] rounded-[1.5rem] transition-all ${
            selectedUserId === user.id
              ? 'bg-white soft-shadow ring-1 ring-pastel-purple/20'
              : 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <UserAvatar 
            avatar={user.avatar} 
            name={user.name} 
            color={user.color} 
            size={selectedUserId === user.id ? 'lg' : 'md'}
            className={selectedUserId === user.id ? 'ring-2 ring-pastel-purple ring-offset-2' : ''}
          />
          <span className={`text-[10px] font-black uppercase tracking-tight ${
            selectedUserId === user.id ? 'text-pastel-text' : 'text-zinc-400'
          }`}>
            {user.name}
          </span>
          {selectedUserId === user.id && (
            <motion.div 
              layoutId="activeUserDot"
              className="w-1 h-1 rounded-full bg-pastel-purple"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
