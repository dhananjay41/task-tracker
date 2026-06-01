import { Task, Priority } from '@/types/task';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  HIGH: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function TaskCard({ task, onClick }: { task: Task, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:border-slate-700"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
          priorityColors[task.priority]
        )}>
          {task.priority}
        </span>
      </div>
      
      <h3 className="text-white font-medium mb-2 line-clamp-2 leading-tight">{task.title}</h3>
      <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
      
      <div className="flex items-center justify-between text-slate-500 pt-3 border-t border-slate-800/50">
        <div className="flex items-center gap-1.5 text-xs">
          <Clock size={14} className="text-slate-600" />
          <span>{task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700" title={task.assignee.email}>
              <span className="text-[10px] text-white uppercase">{task.assignee.email.charAt(0)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
