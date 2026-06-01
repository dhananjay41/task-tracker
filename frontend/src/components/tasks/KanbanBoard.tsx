'use client';

import { Task, Status } from '@/types/task';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

const statuses: Status[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

export default function KanbanBoard({ 
  tasks, 
  onTaskClick, 
  onAddTask 
}: { 
  tasks: Task[], 
  onTaskClick: (task: Task) => void,
  onAddTask: (status: Status) => void
}) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 min-h-[calc(100vh-16rem)] scrollbar-thin scrollbar-thumb-slate-800">
      {statuses.map((status) => (
        <div key={status} className="flex-shrink-0 w-80 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{status.replace('_', ' ')}</h2>
              <span className="text-[10px] font-bold bg-slate-800/50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-800">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            <button 
              onClick={() => onAddTask(status)}
              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
              title="Add task to this column"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex-1 bg-slate-900/20 border border-slate-900/50 rounded-2xl p-2.5 space-y-3">
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ))}
            
            {tasks.filter(t => t.status === status).length === 0 && (
              <div className="h-32 border-2 border-dashed border-slate-800/20 rounded-xl flex flex-col items-center justify-center gap-2">
                <span className="text-slate-700 text-xs font-medium">No tasks</span>
                <button 
                  onClick={() => onAddTask(status)}
                  className="text-[10px] text-blue-500/50 hover:text-blue-500 transition-colors uppercase font-bold"
                >
                  Create New
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
