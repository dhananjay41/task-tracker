'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { Task, Status, Priority, User } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { Trash2, ChevronRight } from 'lucide-react';

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

const priorityStyles: Record<Priority, { active: string; idle: string }> = {
  LOW:    { active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', idle: 'bg-slate-800/40 text-slate-500 border-slate-700 hover:text-slate-300' },
  MEDIUM: { active: 'bg-amber-500/15 text-amber-400 border-amber-500/30',     idle: 'bg-slate-800/40 text-slate-500 border-slate-700 hover:text-slate-300' },
  HIGH:   { active: 'bg-rose-500/15 text-rose-400 border-rose-500/30',        idle: 'bg-slate-800/40 text-slate-500 border-slate-700 hover:text-slate-300' },
};

const statusStyles: Record<Status, string> = {
  TODO:        'bg-slate-500/20 text-slate-400 border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_REVIEW:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DONE:        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCKED:     'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

// Valid next statuses from each state
const TRANSITIONS: Record<Status, Status[]> = {
  TODO:        ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED'],
  IN_REVIEW:   ['DONE', 'BLOCKED'],
  DONE:        [],
  BLOCKED:     ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
};

interface TaskModalProps {
  mode: 'create' | 'edit';
  task?: Task;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskModal({ mode, task, onClose, onSuccess, onDelete }: TaskModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role ?? '');

  // Form state
  const [title, setTitle]           = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority]     = useState<Priority>(task?.priority ?? 'MEDIUM');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
  const [dueDate, setDueDate]       = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
  );

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data.users)).catch(() => {});
  }, []);

  // ─── Create / Edit submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (mode === 'create' && isAdminOrManager && !assigneeId) {
      setError('Please select an assignee');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const { data } = await api.post('/tasks', {
          title,
          description: description || undefined,
          priority,
          assigneeId,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
        onSuccess(data);
      } else if (task) {
        const body: Record<string, unknown> = { title, description, priority };
        if (isAdminOrManager) {
          body.assigneeId = assigneeId;
          body.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
        }
        const { data } = await api.put(`/tasks/${task.id}`, body);
        onSuccess(data);
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Something went wrong');
      setLoading(false);
    }
  };

  // ─── Quick status transition ────────────────────────────────────────────
  const handleStatusChange = async (newStatus: Status) => {
    if (!task) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status: newStatus });
      onSuccess(data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Status change failed');
      setLoading(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!task || !confirm('Delete this task? This cannot be undone.')) return;
    setLoading(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      onDelete?.(task.id);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Delete failed');
      setLoading(false);
    }
  };

  const label = (s: Status) => s.replace(/_/g, ' ');

  return (
    <Modal
      title={mode === 'create' ? 'Create New Task' : 'Edit Task'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Title ── */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Title <span className="text-blue-400">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={mode === 'edit' && !isAdminOrManager}
            placeholder="Task title..."
            className="w-full bg-slate-950/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 transition-colors disabled:opacity-50 disabled:cursor-default"
          />
        </div>

        {/* ── Description ── */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={mode === 'edit' && !isAdminOrManager}
            rows={3}
            placeholder="Describe the task..."
            className="w-full bg-slate-950/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 transition-colors resize-none disabled:opacity-50 disabled:cursor-default"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* ── Priority ── */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={mode === 'edit' && !isAdminOrManager}
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all disabled:opacity-40 disabled:cursor-default ${
                    priority === p ? priorityStyles[p].active : priorityStyles[p].idle
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ── Due Date ── */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={mode === 'edit' && !isAdminOrManager}
              className="w-full bg-slate-950/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 transition-colors scheme-dark disabled:opacity-50 disabled:cursor-default"
            />
          </div>
        </div>

        {/* ── Assignee (ADMIN / MANAGER only) ── */}
        {isAdminOrManager && (
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Assignee {mode === 'create' && <span className="text-blue-400">*</span>}
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              required={mode === 'create'}
              className="w-full bg-slate-950/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 transition-colors scheme-dark"
            >
              <option value="" disabled hidden>Select assignee...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Status transitions (edit mode only) ── */}
        {mode === 'edit' && task && (
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase border ${statusStyles[task.status]}`}>
                {label(task.status)}
              </span>
              {TRANSITIONS[task.status].length > 0 && (
                <>
                  <ChevronRight size={14} className="text-slate-600 shrink-0" />
                  {TRANSITIONS[task.status].map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={loading}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase border transition-all hover:scale-105 active:scale-95 disabled:opacity-40 ${statusStyles[s]}`}
                    >
                      {label(s)}
                    </button>
                  ))}
                </>
              )}
              {task.status === 'DONE' && (
                <span className="text-xs text-slate-600 italic">Task is complete</span>
              )}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center gap-3 pt-1">
          {mode === 'edit' && isAdminOrManager && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              title="Delete task"
              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-40"
            >
              <Trash2 size={15} />
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
