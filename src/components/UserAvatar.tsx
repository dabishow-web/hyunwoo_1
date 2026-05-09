import React from 'react';

interface UserAvatarProps {
  avatar: string;
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isOnline?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatar, name, color, size = 'md', className = '', isOnline = false 
}) => {
  const isUrl = avatar && (avatar.startsWith('http') || avatar.startsWith('https'));
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-[8px]',
    md: 'w-8 h-8 text-[10px]',
    lg: 'w-12 h-12 text-xs',
    xl: 'w-20 h-20 text-xl',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5 border',
    md: 'w-2 h-2 border-2',
    lg: 'w-3 h-3 border-2',
    xl: 'w-4 h-4 border-2',
  };

  return (
    <div className="relative shrink-0">
      <div 
        className={`rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-sm ${sizeClasses[size]} ${className}`}
        style={{ backgroundColor: color }}
      >
        {isUrl ? (
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          avatar || name.charAt(0) || '♥'
        )}
      </div>
      {isOnline && (
        <div className={`absolute bottom-0 right-0 bg-emerald-500 border-white rounded-full ${dotSizeClasses[size]} animate-pulse`} />
      )}
    </div>
  );
};
