import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { Plus, Calendar, AlertTriangle, Trash2, CalendarCheck2, ToggleLeft, ToggleRight, Check, ListTodo, AlertCircle, ArrowUpDown, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';

interface TasksListProps {
  tasks: Task[];
  accessToken: string | null;
  isGuest?: boolean;
  onAddTask: (title: string, priority: TaskPriority, deadline: string, description: string, personalDeadline?: string) => Promise<void>;
  onUpdateTask: (taskId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSyncTaskToGoogleCalendar: (task: Task, isManual?: boolean) => Promise<void>;
}

type SortOption = 'none' | 'priority-desc' | 'priority-asc';

const priorityWeights: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export default function TasksList({
  tasks,
  accessToken,
  isGuest = false,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSyncTaskToGoogleCalendar
}: TasksListProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [personalDeadline, setPersonalDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('none');

  // Edit task state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDeadline, setEditDeadline] = useState('');
  const [editPersonalDeadline, setEditPersonalDeadline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDeadline(task.deadline || '');
    setEditPersonalDeadline(task.personalDeadline || '');
    setEditDescription(task.description || '');
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim() || !editDeadline) return;

    setIsUpdating(true);
    try {
      await onUpdateTask(editingTask.id, {
        title: editTitle,
        priority: editPriority,
        deadline: editDeadline,
        personalDeadline: editPersonalDeadline || '',
        description: editDescription
      });
      setEditingTask(null);
    } catch (err: any) {
      console.error(err);
      alert('課題の更新に失敗しました。詳細: ' + (err?.message || String(err)));
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter local standard tasks (not team tasks)
  const personalTasks = tasks.filter(t => !t.teamId);

  // Sort tasks based on selected option
  const sortedTasks = [...personalTasks].sort((a, b) => {
    if (sortBy === 'priority-desc') {
      return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    }
    if (sortBy === 'priority-asc') {
      return (priorityWeights[a.priority] || 0) - (priorityWeights[b.priority] || 0);
    }
    return 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    setIsSubmitting(true);
    try {
      await onAddTask(title, priority, deadline, description, personalDeadline);
      setTitle('');
      setDescription('');
      setDeadline('');
      setPersonalDeadline('');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      alert('課題の追加に失敗しました。詳細: ' + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncToCalendar = async (task: Task) => {
    if (isGuest) {
      alert('ゲストモード（匿名ログイン）では、Googleカレンダーとの同期機能はサポートされていません。この機能を利用するには、画面右上メニューから一度ログアウトし、Googleアカウントでログインし直してください。');
      return;
    }

    const confirmSync = window.confirm(`課題 「${task.title}」 をGoogleカレンダー（全日予定）に追加同期しますか？`);
    if (!confirmSync) return;

    setSyncingTaskId(task.id);
    try {
      await onSyncTaskToGoogleCalendar(task, true);
      alert('Googleカレンダーとの同期に成功しました！');
    } catch (err: any) {
      alert('同期に失敗しました。詳細: ' + err.message);
    } finally {
      setSyncingTaskId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Create Task Form */}
      <div className="lg:col-span-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-4">
            <Plus className="h-5 w-5" />
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">やるべき課題を追加</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">課題タイトル</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 英語の課題プリントを完了する"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">優先度</label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-805'
                    }`}
                  >
                    {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">提出期限日</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full max-w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 block box-border"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>自分的な完了期限（任意）</span>
                <span className="text-[10px] text-emerald-500 font-normal">いつまでに終わらせるか</span>
              </label>
              <input
                type="date"
                value={personalDeadline}
                onChange={(e) => setPersonalDeadline(e.target.value)}
                className="w-full max-w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 block box-border"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">詳細・メモ（任意）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="関連書籍、出題ページ番号など..."
                rows={3}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? '登録しています...' : '課題を登録する'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Tasks List and Grid */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100 flex items-center">
              <ListTodo className="h-5 w-5 mr-1.5 text-emerald-500" />
              現在の課題リスト ({personalTasks.length}件)
            </h3>

            {/* Sort Control */}
            <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-200/20 dark:border-zinc-800/40">
              <ArrowUpDown className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-zinc-400 whitespace-nowrap">
                重要度順:
              </span>
              <select
                id="priority-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-zinc-700 dark:text-zinc-300 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="none">標準 (登録順)</option>
                <option value="priority-desc">高い順 (高 → 低)</option>
                <option value="priority-asc">低い順 (低 → 高)</option>
              </select>
            </div>
          </div>

          {personalTasks.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <ListTodo className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">現在、登録されている個人課題はありません。</p>
              <p className="text-xs text-zinc-400 mt-1">左のフォームから課題を追加して学習管理を始めましょう！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTasks.map((task) => {
                const dateLimit = task.deadline ? new Date(task.deadline) : null;
                const isOverdue = dateLimit && dateLimit < new Date() && task.status !== 'done';

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      task.status === 'done'
                        ? 'bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-150 dark:border-zinc-850'
                        : isOverdue
                        ? 'bg-rose-50/20 border-rose-200 dark:border-rose-950/40 dark:bg-rose-950/10'
                        : 'bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h4
                            className={`font-semibold text-sm ${
                              task.status === 'done'
                                ? 'line-through text-zinc-400'
                                : 'text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              task.priority === 'high'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                                : task.priority === 'medium'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-slate-50 text-slate-500 dark:bg-slate-950/20 dark:text-slate-400'
                            }`}
                          >
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </span>
                          {(task.googleCalendarEventId || task.googleCalendarPersonalEventId) && (
                            <span 
                              className="inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30"
                              title="Googleカレンダー同期済み"
                            >
                              <Calendar className="h-3 w-3 text-blue-500" />
                              <span>カレンダー同期済</span>
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 l-relaxed leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                            <span className={`flex items-center bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-md border ${task.googleCalendarEventId ? 'border-blue-200 dark:border-blue-900/30 bg-blue-50/10' : 'border-zinc-150 dark:border-zinc-800'}`}>
                              <Calendar className={`h-3.5 w-3.5 mr-1 ${task.googleCalendarEventId ? 'text-blue-500' : 'text-rose-400'}`} />
                              提出期限: <span className="font-semibold text-zinc-700 dark:text-zinc-300 ml-1">{task.deadline ? new Date(task.deadline).toLocaleDateString("ja-JP") : "未設定"}</span>
                              {task.googleCalendarEventId && (
                                <span className="ml-1 px-1 bg-blue-100 dark:bg-blue-900/50 text-[8px] text-blue-700 dark:text-blue-300 rounded font-sans font-bold flex items-center gap-0.5" title="提出期限カレンダー同期完了">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                  <span>同期</span>
                                </span>
                              )}
                            </span>

                            {task.personalDeadline && (
                              <span className={`flex items-center px-2 py-0.5 rounded-md border ${task.googleCalendarPersonalEventId ? 'bg-blue-50/10 border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-105/50 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                                <CalendarCheck2 className={`h-3.5 w-3.5 mr-1 ${task.googleCalendarPersonalEventId ? 'text-blue-500' : ''}`} />
                                自己完了目標: <span className="font-semibold ml-1">{new Date(task.personalDeadline).toLocaleDateString("ja-JP")}</span>
                                {task.googleCalendarPersonalEventId && (
                                  <span className="ml-1 px-1 bg-blue-100 dark:bg-blue-900/50 text-[8px] text-blue-700 dark:text-blue-300 rounded font-sans font-bold flex items-center gap-0.5" title="自己完了目標カレンダー同期完了">
                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    <span>同期</span>
                                  </span>
                                )}
                              </span>
                            )}

                            {isOverdue && (
                              <span className="flex items-center text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-sm">
                                <AlertCircle className="h-3 w-3 mr-0.5" />
                                遅れ！提出期限超過
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Google Calendar sync state or trigers */}
                      <div className="flex items-center space-x-2">
                        {(task.googleCalendarEventId || task.googleCalendarPersonalEventId) ? (
                          <div className="flex items-center space-x-1.5">
                            <div className="flex items-center space-x-1 text-[10px] bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 py-1.5 px-2 rounded-lg border border-blue-100/30 dark:border-blue-900/40">
                              <CalendarCheck2 className="h-3.5 w-3.5 text-blue-500" />
                              <span className="font-semibold">同期済</span>
                            </div>
                            <button
                              onClick={() => handleSyncToCalendar(task)}
                              disabled={syncingTaskId !== null}
                              className="flex items-center space-x-1 text-[10px] bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 py-1.5 px-2 rounded-lg border border-zinc-200 dark:border-zinc-805 transition-colors cursor-pointer font-medium"
                              title="Googleカレンダーの同期内容を更新（再同期）"
                            >
                              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{syncingTaskId === task.id ? '同期中...' : '再同期'}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSyncToCalendar(task)}
                            disabled={syncingTaskId !== null}
                            className="flex items-center space-x-1 text-[10px] bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-405 py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-805 transition-colors cursor-pointer font-medium"
                            title="Googleカレンダーに同期"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{syncingTaskId === task.id ? '同期中...' : 'カレンダー同期'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="課題を編集"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="課題を削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* State status selector */}
                      <div className="flex space-x-1.5">
                        {(['todo', 'doing', 'done'] as TaskStatus[]).map((s) => {
                          const isActive = task.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => {
                                const progressVal = s === 'done' ? 100 : s === 'todo' ? 0 : Math.max(task.progress, 15);
                                onUpdateTask(task.id, { status: s, progress: progressVal });
                              }}
                              className={`text-[10px] font-bold px-2 py-1.5 rounded-lg transition-colors cursor-pointer capitalize ${
                                isActive
                                  ? 'bg-emerald-400 text-zinc-900 font-bold'
                                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                              }`}
                            >
                              {s === 'todo' ? '未着手' : s === 'doing' ? '進行中' : '完了'}
                            </button>
                          );
                        })}
                      </div>

                      {/* Slider element */}
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                          <span>進捗率</span>
                          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{task.progress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={task.progress}
                          onChange={(e) => {
                            const prog = parseInt(e.target.value, 10);
                            const stat: TaskStatus = prog === 100 ? 'done' : prog > 0 ? 'doing' : 'todo';
                            onUpdateTask(task.id, { progress: prog, status: stat });
                          }}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:bg-zinc-850"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={handleCloseEdit}
          />
          
          {/* Modal content */}
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xl relative z-10 overflow-hidden transform transition-all p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
                <Edit3 className="h-5 w-5 mr-2 text-emerald-500" />
                課題を編集する
              </h3>
              <button 
                onClick={handleCloseEdit}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                キャンセル
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">課題タイトル</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">優先度</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        editPriority === p
                          ? p === 'high'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : p === 'medium'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">提出期限日</label>
                  <input
                    type="date"
                    required
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 block"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    自分目標期限（任意）
                  </label>
                  <input
                    type="date"
                    value={editPersonalDeadline}
                    onChange={(e) => setEditPersonalDeadline(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 block"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">詳細・メモ（任意）</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>{isUpdating ? '保存中...' : '変更を保存'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
