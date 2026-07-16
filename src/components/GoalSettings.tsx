import React, { useState } from 'react';
import { Goal, UserProfile, ExamSchedule } from '../types';
import { Target, Plus, CheckCircle2, TrendingUp, X, Sparkles, Calendar, BookOpen, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface GoalSettingsProps {
  goals: Goal[];
  exams?: ExamSchedule[];
  userProfile: UserProfile | null;
  onAddGoal: (title: string, startDate: string, endDate: string) => Promise<void>;
  onToggleGoalStatus: (goalId: string, currentStatus: 'active' | 'completed' | 'failed') => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onUpdateWeeklyGoal: (minutes: number) => Promise<void>;
  onAddExam?: (title: string, examDate: string, subjects: string[], notes: string) => Promise<void>;
  onDeleteExam?: (examId: string) => Promise<void>;
}

export default function GoalSettings({
  goals,
  exams = [],
  userProfile,
  onAddGoal,
  onToggleGoalStatus,
  onDeleteGoal,
  onUpdateWeeklyGoal,
  onAddExam,
  onDeleteExam
}: GoalSettingsProps) {
  // Goal Settings states
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(
    userProfile?.weeklyGoalMinutes ? String(userProfile.weeklyGoalMinutes) : '300'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingMinutes, setIsSavingMinutes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exam (定期テスト) Settings states
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [subjectsString, setSubjectsString] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [isExamSubmitting, setIsExamSubmitting] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !startDate || !endDate) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddGoal(newGoalTitle, startDate, endDate);
      setNewGoalTitle('');
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      setError('目標の作成に失敗しました。詳細: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWeeklyGoal = async () => {
    const mins = parseInt(weeklyGoalInput, 10);
    if (isNaN(mins) || mins <= 0) return;
    setIsSavingMinutes(true);
    try {
      await onUpdateWeeklyGoal(mins);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMinutes(false);
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate || !onAddExam) return;

    setIsExamSubmitting(true);
    setExamError(null);
    try {
      const subjects = subjectsString
        .split(/[,、\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await onAddExam(examTitle.trim(), examDate, subjects, examNotes.trim());
      setExamTitle('');
      setExamDate('');
      setSubjectsString('');
      setExamNotes('');
    } catch (err: any) {
      setExamError('定期テストの追加に失敗しました。詳細: ' + (err.message || err));
    } finally {
      setIsExamSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Target config and static tracking */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">週間の学習時間目標</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-6">
            1週間に合計何分学習するか、目標を設定しましょう。毎日の振り返り（ジャーナル）記録がここに積み上がります。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">週の合計学習目標（分）</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={weeklyGoalInput}
                  onChange={(e) => setWeeklyGoalInput(e.target.value)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 font-mono"
                  placeholder="例: 300"
                />
                <button
                  onClick={handleSaveWeeklyGoal}
                  disabled={isSavingMinutes}
                  className="bg-emerald-500 hover:bg-emerald-600 font-semibold text-white px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center min-w-20"
                >
                  {isSavingMinutes ? '保存中...' : '更新'}
                </button>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 block mb-1">現在の目標</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold font-mono text-zinc-800 dark:text-zinc-100">
                  {userProfile?.weeklyGoalMinutes || 300}
                </span>
                <span className="text-xs text-zinc-400">分/週</span>
                <span className="text-xs text-zinc-400 ml-2">
                  (約 {((userProfile?.weeklyGoalMinutes || 300) / 60).toFixed(1)} 時間)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Guidelines / Motivation */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <h4 className="font-semibold text-white">目標設定のコツ</h4>
          </div>
          <p className="text-xs text-indigo-50/90 leading-relaxed mb-4">
            「数学を頑張る」ではなく「1週間で微積の課題を4つ完了させる」など、具体的で測定可能な目標（SMARTの法則）にすると、モチベーションと達成率が劇的に上がります。
          </p>
          <div className="text-xs bg-white/10 rounded-lg p-2.5 text-indigo-100">
            💡 定期目標をクリアするごとに、自信が深まり、次の学習への原動力になります！
          </div>
        </div>
      </div>

      {/* Goal creation and display lists */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create new Goal form */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-4">
            <Target className="h-5 w-5" />
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">新しい定期目標を立てる</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">目標のタイトル</label>
              <input
                type="text"
                required
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="例: 期末テストに向けて毎日英単語を30語覚える"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">開始日</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full max-w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 block box-border"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">期限・終了日</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full max-w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 block box-border"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? '追加しています...' : '目標をセットする'}</span>
            </button>
          </form>
        </div>

        {/* Goals list */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-100 mb-4">設定された目標一覧 ({goals.length}件)</h3>

          {goals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <Target className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">現在、登録されている目標はありません。</p>
              <p className="text-xs text-zinc-400 mt-1">上のフォームから最初の目標を作成してみましょう！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const sDate = new Date(g.startDate);
                const eDate = new Date(g.endDate);
                const isActive = g.status === 'active';
                return (
                  <div
                    key={g.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      !isActive
                        ? 'bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-800'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1 min-w-0 mr-4">
                      <button
                        onClick={() => onToggleGoalStatus(g.id, g.status)}
                        className={`mt-0.5 pointer-events-auto cursor-pointer focus:outline-hidden transform active:scale-95 transition-transform ${
                          g.status === 'completed'
                            ? 'text-emerald-500'
                            : 'text-zinc-300 hover:text-emerald-500 dark:text-zinc-700'
                        }`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold transition-all ${
                            g.status === 'completed'
                              ? 'line-through text-zinc-400'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {g.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono mt-1">
                          期間: {sDate.toLocaleDateString('ja-JP')} 〜 {eDate.toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                          g.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {g.status === 'completed' ? '達成！' : '進行中'}
                      </span>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        className="text-zinc-300 hover:text-rose-500 dark:text-zinc-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="目標を削除"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- EXAM REGISTRATION AREA (定期テスト登録) --- */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
            <Calendar className="h-5 w-5" />
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">定期テストの日程を設定する</h3>
          </div>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            学期末や中間の定期テスト日程を登録すると、統合ダッシュボード上でテスト当日までの残りの日数がリアルタイムにカウントダウンされます。
          </p>

          <form onSubmit={handleExamSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">テスト名称</label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="例: 1学期中間考査 / 第1回記述模試"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">テスト実施日</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full max-w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-indigo-500 block box-border"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">対象教科（カンマ・スペース区切り）</label>
                <input
                  type="text"
                  value={subjectsString}
                  onChange={(e) => setSubjectsString(e.target.value)}
                  placeholder="例: 英語, 数学, 現代文"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">メモ・目標点数など</label>
              <textarea
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                placeholder="例: 各教科80点以上、特に苦手な2分野を克服する"
                rows={2}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-indigo-500 resize-none"
              />
            </div>

            {examError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg">{examError}</p>
            )}

            <button
              type="submit"
              disabled={isExamSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{isExamSubmitting ? '登録しています...' : '定期テスト日程をセットする'}</span>
            </button>
          </form>
        </div>

        {/* Exams list */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-100 mb-4">設定された定期テスト日程 ({exams.length}件)</h3>

          {exams.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <Calendar className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">現在、登録されている定期テストはありません。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => {
                const targetDay = new Date(exam.examDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = targetDay.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isOver = diffDays < 0;

                return (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between transition-all"
                  >
                    <div className="flex-1 min-w-0 mr-4 space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                          {exam.title}
                        </span>
                        {exam.subjects && exam.subjects.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {exam.subjects.map((sub, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-sm"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          実施日: {targetDay.toLocaleDateString('ja-JP')}
                        </span>
                      </div>

                      {exam.notes && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 select-text font-serif italic max-w-lg truncate">
                          💡 {exam.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      {isOver ? (
                        <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-850 px-2 py-1 rounded">
                          終了しました
                        </span>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-450 block uppercase tracking-wider font-bold">
                            テストまで
                          </span>
                          <span className="text-sm font-black text-indigo-500 font-mono">
                            あと {diffDays === 0 ? '今日' : `${diffDays} 日`}
                          </span>
                        </div>
                      )}

                      {onDeleteExam && (
                        <button
                          onClick={() => onDeleteExam(exam.id)}
                          className="text-zinc-300 hover:text-rose-500 dark:text-zinc-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors cursor-pointer"
                          title="日程を削除"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
