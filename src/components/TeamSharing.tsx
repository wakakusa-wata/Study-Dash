import React, { useState } from 'react';
import { Team, Task, UserProfile } from '../types';
import { Users, Plus, Check, UserPlus, FileText, LayoutList, Share2, Calendar, CalendarCheck2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TeamSharingProps {
  teams: Team[];
  tasks: Task[];
  users: UserProfile[];
  currentUserEmail: string | null;
  onAddTeam: (name: string, members: string[]) => Promise<void>;
  onAddTaskToTeam: (title: string, priority: 'high' | 'medium' | 'low', deadline: string, teamId: string, personalDeadline?: string) => Promise<void>;
  onUpdateTeamMembers: (teamId: string, members: string[]) => Promise<void>;
  onUpdateTaskProgress: (taskId: string, progress: number, status: 'todo' | 'doing' | 'done') => Promise<void>;
}

export default function TeamSharing({
  teams,
  tasks,
  users,
  currentUserEmail,
  onAddTeam,
  onAddTaskToTeam,
  onUpdateTeamMembers,
  onUpdateTaskProgress
}: TeamSharingProps) {
  const [activeTeamId, setActiveTeamId] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState('');
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [tempMembers, setTempMembers] = useState<string[]>([]);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  // For adding a task to the selected team
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskPersonalDeadline, setNewTaskPersonalDeadline] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Member email listing
  const [inviteEmailInput, setInviteEmailInput] = useState('');

  // Active selected team
  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];

  const handleAddTempMember = () => {
    const email = memberEmailInput.trim();
    if (email && !tempMembers.includes(email)) {
      setTempMembers([...tempMembers, email]);
      setMemberEmailInput('');
    }
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const finalMembers = [...tempMembers, currentUserEmail || ''].filter(Boolean);
    try {
      await onAddTeam(newTeamName, finalMembers);
      setNewTeamName('');
      setTempMembers([]);
      setShowAddTeamModal(false);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      alert('グループの作成に失敗しました。詳細: ' + errMsg);
    }
  };

  const handleAddTaskToActiveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeTeam) return;

    setIsAddingTask(true);
    try {
      await onAddTaskToTeam(newTaskTitle, newTaskPriority, newTaskDeadline, activeTeam.id, newTaskPersonalDeadline);
      setNewTaskTitle('');
      setNewTaskDeadline('');
      setNewTaskPersonalDeadline('');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      alert('共有課題の追加に失敗しました。詳細: ' + errMsg);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleInviteToTeam = async () => {
    if (!activeTeam || !inviteEmailInput.trim()) return;
    const cleanEmail = inviteEmailInput.trim();

    if (activeTeam.members.includes(cleanEmail)) {
      alert('すでにこのメンバーはチームに存在します。');
      return;
    }

    try {
      const updatedMembers = [...activeTeam.members, cleanEmail];
      await onUpdateTeamMembers(activeTeam.id, updatedMembers);
      setInviteEmailInput('');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      alert('メンバーの招待に失敗しました。詳細: ' + errMsg);
    }
  };

  // Filter tasks that are registered to the active team
  const activeTeamTasks = activeTeam
    ? tasks.filter(t => t.teamId === activeTeam.id)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar: Teams select or creation */}
      <div className="lg:col-span-4 space-y-4">
        {/* Teams List */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm flex items-center">
              <Users className="h-4 w-4 mr-1.5 text-indigo-500" />
              参加中の学習グループ
            </h3>
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="新しいグループを作成"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-400">現在、グループがありません。</p>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="mt-2 text-xs text-emerald-500 hover:underline font-semibold"
              >
                新規グループ作成
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {teams.map((t) => {
                const isActive = activeTeam?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTeamId(t.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between pointer-events-auto cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                        : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="truncate max-w-[80%]">{t.name}</span>
                    <span className="text-[10px] font-bold opacity-80">
                      ({t.members.length}人)
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Team Members Box */}
        {activeTeam && (
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 text-xs mb-3">
              メンバー一覧 ({activeTeam.members.length}人)
            </h4>

            {/* Invite input */}
            <div className="flex space-x-1.5 mb-4">
              <input
                type="email"
                placeholder="招待する友達のメール"
                value={inviteEmailInput}
                onChange={(e) => setInviteEmailInput(e.target.value)}
                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-hidden"
              />
              <button
                onClick={handleInviteToTeam}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-0.5 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>追加</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {activeTeam.members.map((email, idx) => {
                // Try and find matched configured user photo
                const matchedUser = users.find(u => u.email === email);
                return (
                  <div key={idx} className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded-lg">
                    {matchedUser?.photoURL ? (
                      <img src={matchedUser.photoURL} className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[9px]">
                        {matchedUser?.displayName?.charAt(0) || email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-zinc-750 dark:text-zinc-200 truncate">
                        {matchedUser?.displayName || email.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">{email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main panel: Team Tasks list and Shared Tasks creation */}
      <div className="lg:col-span-8 space-y-6">
        {activeTeam ? (
          <>
            {/* Create Shared Task Widget */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
                <Share2 className="h-5 w-5" />
                <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-100">「{activeTeam.name}」の共有課題を追加</h3>
              </div>

              <form onSubmit={handleAddTaskToActiveTeam} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">課題のタイトル</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 数学レポートを月曜までに協力して完了させる"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-850 dark:text-zinc-100 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">期限日</label>
                  <input
                    type="date"
                    required
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full max-w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-2 text-zinc-850 dark:text-zinc-100 text-xs focus:outline-hidden block box-border"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">自己目標完了日（任意）</label>
                  <input
                    type="date"
                    value={newTaskPersonalDeadline}
                    onChange={(e) => setNewTaskPersonalDeadline(e.target.value)}
                    className="w-full max-w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-2 text-zinc-850 dark:text-zinc-100 text-xs focus:outline-hidden block box-border"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">優先度</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-2 text-zinc-850 dark:text-zinc-100 text-xs focus:outline-hidden"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isAddingTask}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1 font-semibold"
                    title="チーム課題を追加"
                  >
                    <Plus className="h-4 w-4" />
                    <span>追加</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Shared tasks list */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
              <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-100 mb-4 flex items-center">
                <LayoutList className="h-5 w-5 mr-1.5 text-emerald-500" />
                共有課題一覧 ({activeTeamTasks.length}件)
              </h3>

              {activeTeamTasks.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-zinc-100 dark:border-zinc-850 rounded-2xl">
                  <FileText className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">このグループに共有課題はありません。</p>
                  <p className="text-xs text-zinc-400 mt-1">上のフォームから、メンバーみんなで取り組む課題を作成してみましょう！</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTeamTasks.map((task) => {
                    return (
                      <div key={task.id} className="p-4 bg-zinc-50/75 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850/60 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{task.title}</h4>
                              {(task.googleCalendarEventId || task.googleCalendarPersonalEventId) && (
                                <span 
                                  className="inline-flex items-center space-x-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30"
                                  title="Googleカレンダー同期済み"
                                >
                                  <Calendar className="h-2.5 w-2.5 text-blue-500" />
                                  <span>同期済</span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-zinc-400 mt-1 font-mono">
                              <span className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1 text-rose-400" />
                                期限: {task.deadline ? new Date(task.deadline).toLocaleDateString('ja-JP') : "未設定"}
                              </span>
                              {task.personalDeadline && (
                                <span className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm font-semibold">
                                  <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
                                  自己目標: {new Date(task.personalDeadline).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              task.priority === 'high'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                                : task.priority === 'medium'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-slate-50 text-slate-500 dark:bg-slate-950/20 dark:text-slate-400'
                            }`}
                          >
                            優先度: {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>

                        {/* Interactive sliders or controls inside standard shared task */}
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Progress state */}
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-zinc-500 mb-1">
                              <span>進捗率</span>
                              <span className="font-mono font-bold">{task.progress}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={task.progress}
                              onChange={(e) => {
                                const currentProgress = parseInt(e.target.value, 10);
                                const currentStatus = currentProgress === 100 ? 'done' : currentProgress > 0 ? 'doing' : 'todo';
                                onUpdateTaskProgress(task.id, currentProgress, currentStatus);
                              }}
                              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:bg-zinc-800"
                            />
                          </div>

                          {/* Status Selector */}
                          <div className="flex space-x-1.5">
                            {(['todo', 'doing', 'done'] as const).map((s) => {
                              const isActive = task.status === s;
                              return (
                                <button
                                  key={s}
                                  onClick={() => {
                                    const progressVal = s === 'done' ? 100 : s === 'todo' ? 0 : Math.max(task.progress, 15);
                                    onUpdateTaskProgress(task.id, progressVal, s);
                                  }}
                                  className={`text-[10px] font-bold px-2 py-1.5 rounded-lg transition-colors cursor-pointer capitalize ${
                                    isActive
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  {s === 'todo' ? '未着手' : s === 'doing' ? '進行中' : '完了'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer details (Task owner) */}
                        <div className="flex items-center space-x-2 mt-4 pt-2.5 border-t border-zinc-110 dark:border-zinc-800/40 text-[10px] text-zinc-400">
                          <span>登録者: {task.userName} ({task.userId === matchedUserIdFilter(task.userId) ? '自分' : '他メンバー'})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
            <Users className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium">グループに参加して、仲間と進捗を共有しましょう！</p>
            <p className="text-xs text-zinc-400 mt-1">左のボタンから新規グループを作成できます。</p>
          </div>
        )}
      </div>

      {/* Modal / Dialog for Team Creation */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-md w-full shadow-lg border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-1.5 text-emerald-500" />
              新しい学習グループを作成
            </h3>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">グループ名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 期末試験対策グループ / 大学受験仲間"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">メンバーの追加（メールアドレス）</label>
                <div className="flex space-x-1.5">
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={memberEmailInput}
                    onChange={(e) => setMemberEmailInput(e.target.value)}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-850 dark:text-zinc-100 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddTempMember}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 rounded-xl text-xs font-bold"
                  >
                    追加
                  </button>
                </div>

                {/* Temp added members */}
                {tempMembers.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-[100px] overflow-y-auto bg-zinc-50 dark:bg-zinc-950/60 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    {tempMembers.map((email, i) => (
                      <div key={i} className="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="truncate">{email}</span>
                        <button
                          type="button"
                          onClick={() => setTempMembers(tempMembers.filter(e => e !== email))}
                          className="text-rose-500 hover:underline text-[10px]"
                        >
                          除外
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 text-xs text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-bold cursor-pointer"
                >
                  グループ開設
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper matching userId vs currentUserId safely
  function matchedUserIdFilter(ownerId: string) {
    return ownerId;
  }
}
