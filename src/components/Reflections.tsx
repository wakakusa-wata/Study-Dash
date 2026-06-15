import React, { useState } from 'react';
import { Journal, Task, Goal } from '../types';
import { BookOpen, HelpCircle, Send, MessageSquareText, Calendar, Sparkles, BrainCircuit, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface ReflectionsProps {
  journals: Journal[];
  tasks: Task[];
  goals: Goal[];
  userName: string;
  onAddJournal: (content: string, studyMinutes: number) => Promise<void>;
}

export default function Reflections({ journals, tasks, goals, userName, onAddJournal }: ReflectionsProps) {
  const [content, setContent] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchAdvisor, setIsFetchAdvisor] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !minutes) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const studyMins = parseInt(minutes, 10);
      await onAddJournal(content, isNaN(studyMins) ? 0 : studyMins);
      setContent('');
    } catch (err: any) {
      setError('振り返りの保存に失敗しました: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetAiAdvice = async () => {
    setIsFetchAdvisor(true);
    setAiAdvice(null);
    setError(null);
    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          goals,
          journals,
          userName,
        }),
      });

      if (!response.ok) {
        throw new Error('アドバイザーAPIへのアクセスに失敗しました。');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAiAdvice(data.advice);
    } catch (err: any) {
      setError('AIアドバイスの作成中にエラーが発生しました: ' + err.message);
    } finally {
      setIsFetchAdvisor(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Reflection submission */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-4">
            <BookOpen className="h-5 w-5" />
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">本日の学習振り返りを書く</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">学んだ内容・勉強した感想</label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="例: 今日は数学の確率の重要問題を3つ解き終えました。最初は計算が難しかったけれど、解説動画を見て公式の使い方を完全にマスターできました！"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">勉強した時間（分入）</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  required
                  min="5"
                  max="1440"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-1/3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-850 dark:text-zinc-100 text-sm focus:outline-hidden focus:border-emerald-500 font-mono text-center"
                />
                <span className="text-sm text-zinc-500">分</span>
                <span className="text-xs text-zinc-400 italic">(15分ごとに15XPチャージ)</span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2 text-center rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? '記録しています...' : '学習を記録する'}</span>
            </button>
          </form>
        </div>

        {/* Dynamic AI Advisor triggers */}
        <div className="bg-gradient-to-tr from-emerald-5000 to-indigo-600 bg-zinc-900 text-white p-6 rounded-2xl shadow-xs border border-zinc-800/80">
          <div className="flex items-center space-x-2 mb-3">
            <BrainCircuit className="h-5 w-5 text-emerald-400" />
            <h4 className="font-semibold text-white">AIスマートアドバイザー</h4>
          </div>
          <p className="text-xs text-zinc-350 leading-relaxed mb-4">
            これまでの「課題状況」「目標設定」「振り返り記録」を統合的に分析し、AIがあなただけの効率的な学習カリキュラムやモチベーションアドバイスをオーダーメイドで生成します。
          </p>

          <button
            onClick={handleGetAiAdvice}
            disabled={isFetchAdvisor}
            className="w-full bg-emerald-500 hover:bg-emerald-400 font-bold text-white py-2.5 px-4 rounded-xl text-xs transition-transform transform active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm border border-emerald-400/20"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>{isFetchAdvisor ? 'AIが学習履歴を分析中...' : '学習計画のAI分析をリクエスト'}</span>
          </button>
        </div>
      </div>

      {/* Advice outputs or history logs */}
      <div className="lg:col-span-7 space-y-6">
        {/* Render generated AI advice if open */}
        {aiAdvice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-950/50 p-6 rounded-2xl shadow-xs"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-105 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <MessageSquareText className="h-5 w-5 text-emerald-500" />
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-100">AIアドバイス &amp; 軌道修正プラン</h4>
              </div>
              <button
                onClick={() => setAiAdvice(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                閉じる
              </button>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-3 prose dark:prose-invert">
              {aiAdvice}
            </div>
          </motion.div>
        )}

        {/* Historic logs List */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-100">これまでの振り返り記録（{journals.length}件）</h3>
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>

          {journals.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-zinc-100 dark:border-zinc-850 rounded-2xl">
              <Calendar className="h-10 w-10 text-zinc-300 dark:text-zinc-805 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">振り返り記録はまだありません。</p>
              <p className="text-xs text-zinc-400 mt-1">日々の学びをジャーナルに書くことで、効果的な記憶の定着が促されます。</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {journals.map((j) => {
                const date = new Date(j.createdAt);
                return (
                  <div key={j.id} className="p-4 bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {j.userPhoto ? (
                          <img
                            src={j.userPhoto}
                            alt={j.userName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-[10px] font-bold">
                            {j.userName?.charAt(0) || '学'}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-24">{j.userName}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {date.toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <span className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-mono font-semibold">
                        {j.studyMinutes}分
                      </span>
                    </div>

                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {j.content}
                    </p>
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
