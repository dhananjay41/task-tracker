'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Task, Status } from '@/types/task';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import TaskModal from '@/components/tasks/TaskModal';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { Search, Filter, Plus } from 'lucide-react';

type ModalState =
  | { mode: 'create'; initialStatus?: Status }
  | { mode: 'edit'; task: Task };

type SortKey = 'newest' | 'priority' | 'due';

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function sortTasks(tasks: Task[], by: SortKey): Task[] {
  const copy = [...tasks];
  if (by === 'priority') {
    return copy.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
  }
  if (by === 'due') {
    return copy.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }
  // newest
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function DashboardPage() {
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [modal, setModal]   = useState<ModalState | null>(null);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    if (user) socket.emit('join', user.id);

    socket.on('task_created', (newTask: Task) => {
      setTasks((prev) => prev.some((t) => t.id === newTask.id) ? prev : [newTask, ...prev]);
    });
    socket.on('task_status_changed', (updated: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    });
    socket.on('task_assigned', (updated: Task) => {
      if (user?.role === 'MEMBER' && updated.assigneeId !== user.id) {
        setTasks((prev) => prev.filter((t) => t.id !== updated.id));
      } else {
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === updated.id);
          return exists ? prev.map((t) => (t.id === updated.id ? updated : t)) : [updated, ...prev];
        });
      }
    });

    return () => { socket.disconnect(); };
  }, [user, fetchTasks]);

  // Called when a task is created or updated inside the modal
  const handleTaskSuccess = (updated: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === updated.id);
      return exists
        ? prev.map((t) => (t.id === updated.id ? updated : t))
        : [updated, ...prev];
    });
  };

  // Called when a task is deleted inside the modal
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const filtered = sortTasks(
    tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()),
    ),
    sortBy,
  );

  const canCreate = ['ADMIN', 'MANAGER'].includes(user?.role ?? '');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Project Board</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Manage and track your team&apos;s progress in real-time.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span>Create New Task</span>
          </button>
        )}
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-900/40 p-3 rounded-3xl border border-slate-800/40 backdrop-blur-sm">
        <div className="flex-1 flex items-center gap-3 px-5 py-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 focus-within:border-blue-500/50 transition-all">
          <Search size={18} className="text-slate-600 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-700"
          />
        </div>
        <div className="flex items-center gap-4 px-5">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">Sort by</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-transparent text-sm font-bold text-slate-300 outline-none cursor-pointer hover:text-white transition-colors scheme-dark"
          >
            <option value="newest">Newest first</option>
            <option value="priority">Priority</option>
            <option value="due">Due Date</option>
          </select>
        </div>
      </div>

      {/* ── Board ── */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-slate-600 font-medium animate-pulse">Synchronizing board...</span>
        </div>
      ) : (
        <KanbanBoard
          tasks={filtered}
          onTaskClick={(task) => setModal({ mode: 'edit', task })}
          onAddTask={(status) => canCreate ? setModal({ mode: 'create', initialStatus: status }) : undefined}
        />
      )}

      {/* ── Modal ── */}
      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.mode === 'edit' ? modal.task : undefined}
          onClose={() => setModal(null)}
          onSuccess={handleTaskSuccess}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
}
