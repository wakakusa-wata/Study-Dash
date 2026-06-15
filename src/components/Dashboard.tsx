import { useState, useEffect } from 'react';
import { Task, Goal, Journal, UserProfile, ExamSchedule } from '../types';
import { Sparkles, Calendar, AlertTriangle, CheckCircle2, Trophy, Clock, Target, CalendarDays, Flame, Play, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  tasks: Task[];
  goals: Goal[];
  exams?: ExamSchedule[];
  journals: Journal[];
  userProfile: UserProfile | null;
  accessToken: string | null;
  onUpdateTask: (taskId: string, fields: Partial<Task>) => Promise<void>;
  onTriggerGoogleLogin: () => Promise<void>;
  onLinkGoogleCalendar: () => Promise<void>;
}

export default function Dashboard({
  tasks,
  goals,
  exams = [],
  journals,
  userProfile,
  accessToken,
  onUpdateTask,
  onTriggerGoogleLogin,
  onLinkGoogleCalendar
}: DashboardProps) {
  const [delayedTasks, setDelayedTasks] = useState<Task[]>([]);
  const [aiAdviceForDelayed, setAiAdviceForDelayed] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze delayed/overdue tasks automatically
  useEffect(() => {
    const today = new Date();
    const alerts = tasks.filter(task => {
      if (task.status === 'done') return false;
      if (!task.deadline) return false;

      const deadlineDate = new Date(task.deadline);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Overdue, OR due in less than 2 days but progress is less than 80%
      return diffDays < 0 || (diffDays <= 2 && task.progress < 80);
    });
    setDelayedTasks(alerts);
  }, [tasks]);

  // Request Gemini advisory support for delayed tasks specifically
  const handleDelayedTasksAnalysis = async () => {
    if (delayedTasks.length === 0) return;
    setIsAnalyzing(true);
    setAiAdviceForDelayed(null);
    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: delayedTasks,
          goals,
          journals,
          userName: userProfile?.displayName || '学習者',
        })
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setAiAdviceForDelayed(data.advice);
    } catch (err) {
      console.error(err);
      setAiAdviceForDelayed('分析の取得に失敗しました。時間をおいて再実行してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stats
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const compRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const activeGoalsCount = goals.filter(g => g.status === 'active').length;

  // Filter regular test countdowns (exams)
  // Calculate date differences
  const upcomingExams = exams
    .map(exam => {
      const targetDay = new Date(exam.examDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = targetDay.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...exam, diffDays };
    })
    .filter(exam => exam.diffDays >= 0)
    .sort((a, b) => a.diffDays - b.diffDays);

  const primaryExam = upcomingExams[0];

  return (
    <div className="space-y-6">
      {/* Top Welcome Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-805 p-6 rounded-3xl shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest block mb-1">STUDY COMPASS / ダッシュボード</span>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            お疲れ様です、{userProfile?.displayName || '学習者'} さん！
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            今日の課題の進捗状況と目標へのチャレンジ、定期テストカウントダウンをお届けします。
          </p>
        </div>
      </div>

      {/* Main Grid: Info Cards and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Delay Alert Reminders & Quick ToDos */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Automated Remind Alarm section */}
          {delayedTasks.length > 0 && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-50/50 dark:bg-rose-950/15 border-2 border-rose-200 dark:border-rose-950/50 p-6 rounded-3xl"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-rose-100 dark:bg-rose-900/60 p-2 text-rose-600 dark:text-rose-400 rounded-xl mt-0.5 animate-bounce">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-sm text-rose-900 dark:text-rose-300">
                    🔴 自動検出リマインド: 進捗が遅れている課題 ({delayedTasks.length}件)
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                    期限を超過しているか、期限直前（2日以内）で進捗が低い課題がみつかりました。放置すると学習計画が崩れてしまいます！
                  </p>

                  {/* Delayed tasks cards list */}
                  <div className="mt-4 space-y-2.5">
                    {delayedTasks.map((task) => {
                      const limit = task.deadline ? new Date(task.deadline) : null;
                      const isPast = limit && limit < new Date();
                      return (
                        <div key={task.id} className="p-3.5 bg-white dark:bg-zinc-900 border border-rose-150 dark:border-rose-950/40 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{task.title}</p>
                            <p className="text-[10px] text-rose-500 font-mono mt-0.5">
                              期限: {task.deadline ? new Date(task.deadline).toLocaleDateString('ja-JP') : "？"} 
                              {isPast && " (超過中)"} • 進捗: {task.progress}%
                            </p>
                          </div>
                          
                          {/* Quick progress bumper button */}
                          <button
                            onClick={() => onUpdateTask(task.id, { progress: 100, status: 'done' })}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>完了にする</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Quick Advice for delayed tasks */}
                  <div className="mt-4 pt-3.5 border-t border-rose-150/50 dark:border-rose-950/30">
                    <button
                      onClick={handleDelayedTasksAnalysis}
                      disabled={isAnalyzing}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>{isAnalyzing ? 'AIが克服プランを思考中...' : 'この遅れを解消するAI克服プランを作成'}</span>
                    </button>

                    {aiAdviceForDelayed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 bg-white dark:bg-zinc-950/60 text-xs text-zinc-700 dark:text-zinc-300 p-4 rounded-xl leading-relaxed whitespace-pre-wrap border border-rose-150 select-text font-sans"
                      >
                        {aiAdviceForDelayed}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Active tasks list */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-base mb-4 flex items-center">
              <Play className="h-4.5 w-4.5 text-emerald-500 fill-current mr-2" />
              直近・優先のタスク（今日やること）
            </h3>

            {tasks.filter(t => t.status !== 'done').length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-550 dark:text-emerald-500 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">全てのアクティブな課題を完了しました！</p>
                <p className="text-xs text-zinc-400 mt-1">「課題管理」タブから新しい勉強や課題を登録してみましょう。</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks
                  .filter(t => t.status !== 'done')
                  .sort((a, b) => {
                    const priorityWeight = { high: 3, medium: 2, low: 1 };
                    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
                  })
                  .slice(0, 4)
                  .map((task) => {
                    return (
                      <div
                        key={task.id}
                        className="p-3.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={() => onUpdateTask(task.id, { progress: 100, status: 'done' })}
                            className="w-4 h-4 text-emerald-500 rounded-sm border-zinc-300 dark:border-zinc-700 pointer-events-auto cursor-pointer focus:ring-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{task.title}</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                                  task.priority === 'high'
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50'
                                }`}
                              >
                                {task.priority === 'high' ? '優先：高' : '一般'}
                              </span>
                              {task.deadline && (
                                <span className="text-[10px] text-zinc-440 font-mono">
                                  期限: {new Date(task.deadline).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Fast bumping sliders */}
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono font-bold text-zinc-450">{task.progress}%</span>
                          <button
                            onClick={() => onUpdateTask(task.id, { progress: Math.min(task.progress + 20, 100), status: task.progress + 20 >= 100 ? 'done' : 'doing' })}
                            className="text-[10px] bg-zinc-200/85 hover:bg-zinc-300 dark:bg-zinc-800 hover:dark:bg-zinc-750 font-bold px-2.5 py-1.5 rounded-lg text-zinc-650 dark:text-zinc-305 cursor-pointer"
                          >
                            +20% 進捗
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics overview, Regular Test Countdowns & XP system */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* XP & Level tracking card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-xs relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <Trophy className="w-40 h-40" />
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest block">学習ステータス</span>
                <span className="text-sm font-semibold font-logo tracking-[0.2em] uppercase whitespace-nowrap mt-1 block">STUDY COMPASS</span>
              </div>
              <div className="p-2 bg-white/10 rounded-xl">
                <Flame className="h-5 w-5 text-amber-300 animate-pulse fill-amber-300" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-emerald-50 block">獲得した学習XP</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold font-mono">{userProfile?.xp || 0}</span>
                  <span className="text-xs text-emerald-100">XP</span>
                </div>
              </div>

              {/* Simple computed pseudo level */}
              <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                <span className="text-xs text-emerald-50 block font-semibold">現在のレベル</span>
                <p className="text-sm font-extrabold mt-0.5">Lv.{Math.floor((userProfile?.xp || 0) / 300) + 1}</p>
                <div className="w-full h-1 bg-white/20 rounded-full mt-2 relative overflow-hidden">
                  <div
                    className="h-full bg-amber-300 transition-all duration-500"
                    style={{ width: `${((userProfile?.xp || 0) % 300) / 3}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-emerald-100 mt-1 block font-mono">
                  次のレベルまで残: {300 - ((userProfile?.xp || 0) % 300)} XP
                </span>
              </div>
            </div>
          </div>

          {/* --- PERIOD EXAMS COUNTDOWN (定期テストカウントダウン) --- */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-base flex items-center">
              <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
              定期テストへのカウントダウン
            </h3>

            {!primaryExam ? (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-center">
                <Clock className="h-7 w-7 text-zinc-350 dark:text-zinc-655 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  登録された今後の定期テストはありません。
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">
                  「目標・日程」設定画面からテスト日程を追加してみましょう！
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Nearest Exam high-impact card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950/20 to-indigo-100/50 dark:to-indigo-900/10 border-2 border-indigo-200/50 dark:border-indigo-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-sm">
                      最重要テスト
                    </span>
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                      📅 {new Date(primaryExam.examDate).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate">
                    {primaryExam.title}
                  </h4>

                  <div className="my-3 flex items-baseline justify-center space-x-1.5 py-1.5 bg-white dark:bg-zinc-950/50 rounded-xl border border-indigo-100 dark:border-indigo-950/50 shadow-2xs">
                    <span className="text-xs text-zinc-400 font-semibold block">本番まで</span>
                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                      あ と {primaryExam.diffDays === 0 ? '今 日' : `${primaryExam.diffDays} 日`}
                    </span>
                  </div>

                  {primaryExam.subjects && primaryExam.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {primaryExam.subjects.map((sub, idx) => (
                        <span key={idx} className="text-[10px] bg-indigo-100/40 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-305 px-2 py-0.5 rounded font-medium">
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  {primaryExam.notes && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 select-text border-l-2 border-indigo-300 dark:border-indigo-750 pl-2 leading-relaxed max-w-sm truncate">
                      {primaryExam.notes}
                    </p>
                  )}
                </div>

                {/* Additional list of future exams */}
                {upcomingExams.length > 1 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">今後のその他のテスト</span>
                    {upcomingExams.slice(1, 3).map((exam) => (
                      <div key={exam.id} className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center text-xs">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-semibold text-zinc-750 dark:text-zinc-250 truncate">{exam.title}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{new Date(exam.examDate).toLocaleDateString('ja-JP')}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-500 block font-mono">あと {exam.diffDays} 日</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Core static statistics ring */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-xs">
            <h3 className="font-semibold text-zinc-850 dark:text-zinc-100 text-sm mb-4">目標・課題完了状況</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                <span className="text-xs text-zinc-400 block mb-1">課題全体の消化率</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-200">{compRate}%</span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                <span className="text-xs text-zinc-400 block mb-1">アクティブな定期目標</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{activeGoalsCount}</span>
                  <span className="text-xs text-zinc-400">件</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/15 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/10 flex items-center space-x-2">
              <Target className="h-4 w-4 text-indigo-500" />
              <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold leading-none">
                {compRate >= 80 ? '素晴らしい！高いペースをキープしています。' : 'まずは優先「高」の課題を片付けましょう！'}
              </span>
            </div>
          </div>

          {/* Quick study guidance and calendar indicators */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Google 連携機能
              </span>
              {accessToken && (
                <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded-sm">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>連携完了</span>
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-2 flex items-center">
              <CalendarDays className="h-4 w-4 text-indigo-500 mr-1.5" />
              Google カレンダー自動同期
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              期限のある課題を作成すると、「Googleカレンダーに同期」ボタンから自動的に予定を登録できます。同期漏れや提出忘れを効果的に防ぎます。
            </p>

            {!accessToken ? (
              <button
                onClick={onTriggerGoogleLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-750 font-bold text-white py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Googleアカウントと連携する</span>
              </button>
            ) : (
              <button
                onClick={onLinkGoogleCalendar}
                className="group text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-750 dark:hover:text-indigo-300 font-bold flex items-center space-x-1.5 cursor-pointer hover:underline transition-all"
              >
                <span>同期設定 of tasks tab</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
