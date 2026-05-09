
import React from 'react';
import { Transaction, TransactionType, DiaryEntry, ScheduleEntry, User } from '../../types';
import { UserAvatar } from './UserAvatar';
import { BookHeart, Circle } from 'lucide-react';

interface CalendarViewProps {
  currentDate: Date;
  transactions: Transaction[];
  diaries?: DiaryEntry[];
  schedules?: ScheduleEntry[];
  users?: User[];
  onDateClick: (date: string) => void;
  hideFinancials?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  currentDate, 
  transactions, 
  diaries = [], 
  schedules = [],
  users = [],
  onDateClick,
  hideFinancials = false
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  // 일자별 합계 계산 (금융 모드일 때만 사용)
  const dailyStats = !hideFinancials ? transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0 };
    if (t.type === TransactionType.INCOME) acc[t.date].income += t.amount;
    else acc[t.date].expense += t.amount;
    return acc;
  }, {} as Record<string, { income: number; expense: number }>) : {};

  // 일자별 일기 작성자 매핑
  const diaryByDate = diaries.reduce((acc, d) => {
    if (!acc[d.date]) acc[d.date] = [];
    if (!acc[d.date].includes(d.userId)) {
      acc[d.date].push(d.userId);
    }
    return acc;
  }, {} as Record<string, string[]>);

  // 일자별 일정 카운트
  const scheduleByDate = schedules.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, ScheduleEntry[]>);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-[2.5rem] p-8 soft-shadow border border-pastel-lavender/20 animate-in fade-in duration-700">
      <div className="grid grid-cols-7 mb-4">
        {weekDays.map((day, i) => (
          <div key={day} className={`text-center text-[10px] font-bold uppercase tracking-widest ${i === 0 ? 'text-rose-300' : i === 6 ? 'text-pastel-purple' : 'text-zinc-300'}`}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-pastel-sand/30 rounded-2xl overflow-hidden border border-pastel-sand/30">
        {blanks.map(b => (
          <div key={`blank-${b}`} className="bg-white h-24 md:h-32" />
        ))}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const stats = dailyStats[dateStr];
          const authorIds = diaryByDate[dateStr] || [];
          const daySchedules = scheduleByDate[dateStr] || [];
          const isToday = today === dateStr;

          return (
            <div 
              key={day} 
              onClick={() => onDateClick(dateStr)}
              className="bg-white h-24 md:h-32 p-2 flex flex-col items-center gap-1 cursor-pointer hover:bg-pastel-sand/20 transition-colors group relative"
            >
              <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                ${isToday ? 'bg-pastel-purple text-white shadow-md' : 'text-pastel-text group-hover:bg-pastel-sand'}
              `}>
                {day}
              </span>

              {/* 일정 표시 점 */}
              <div className="flex gap-0.5 mb-1 h-1 justify-center">
                 {daySchedules.slice(0, 3).map((s, idx) => (
                    <div key={idx} className={`w-1 h-1 rounded-full ${s.category === 'IMPORTANT' ? 'bg-rose-400' : 'bg-pastel-purple'}`} />
                 ))}
                 {daySchedules.length > 3 && <div className="w-1 h-1 rounded-full bg-zinc-200" />}
              </div>

              {/* 일기 작성자 아이콘 표시 */}
              <div className="flex -space-x-2 mt-1">
                {authorIds.map(uid => {
                  const user = users.find(u => u.id === uid);
                  if (!user) return null;
                  return (
                    <UserAvatar 
                      key={uid}
                      avatar={user.avatar}
                      name={user.name}
                      color={user.color}
                      size="sm"
                      className="border-2 border-white animate-in zoom-in"
                    />
                  );
                })}
              </div>
              
              {!hideFinancials && (
                <div className="flex flex-col items-center gap-0.5 mt-1 w-full overflow-hidden">
                  {stats?.income > 0 && (
                    <div className="bg-pastel-mint/40 text-emerald-700 text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-md font-bold truncate w-full text-center">
                      +{ (stats.income / 10000).toFixed(stats.income >= 10000 ? 1 : 0) }만
                    </div>
                  )}
                  {stats?.expense > 0 && (
                    <div className="bg-pastel-rose/40 text-rose-700 text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-md font-bold truncate w-full text-center">
                      -{ (stats.expense / 10000).toFixed(stats.expense >= 10000 ? 1 : 0) }만
                    </div>
                  )}
                </div>
              )}
              
              {/* 시각적 인디케이터 (하단 점) - 일기 모드에서는 숨김 */}
              {!hideFinancials && (
                <div className="flex gap-1 mt-auto pb-1">
                  {stats?.income > 0 && <div className="w-1 h-1 rounded-full bg-emerald-300" />}
                  {stats?.expense > 0 && <div className="w-1 h-1 rounded-full bg-rose-300" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
