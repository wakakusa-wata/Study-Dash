import { Task, Journal } from '../types';
import { Award, BookOpen, Clock, Flame, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressChartsProps {
  tasks: Task[];
  journals: Journal[];
}

export default function ProgressCharts({ tasks, journals }: ProgressChartsProps) {
  // Analytical stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculat total study minutes from journals
  const totalStudyMinutes = journals.reduce((acc, curr) => acc + (curr.studyMinutes || 0), 0);
  const totalHours = (totalStudyMinutes / 60).toFixed(1);

  // Weekly analytics (last 7 days study hours)
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const weeklyData = last7Days.map(date => {
    const dateStr = date.toLocaleDateString('ja-JP');
    const dayJournals = journals.filter(j => 
      new Date(j.createdAt).toLocaleDateString('ja-JP') === dateStr
    );
    const minutes = dayJournals.reduce((acc, curr) => acc + (curr.studyMinutes || 0), 0);
    return {
      dayName: daysOfWeek[date.getDay()],
      minutes: minutes,
      dateFormatted: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    };
  });

  // Maximum minutes for bar scaling
  const maxWeeklyMinutes = Math.max(...weeklyData.map(d => d.minutes), 60);

  // Priority distribution
  const highPriority = tasks.filter(t => t.priority === 'high');
  const finishedHigh = highPriority.filter(t => t.status === 'done').length;
  const highRate = highPriority.length > 0 ? Math.round((finishedHigh / highPriority.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">全課題数 / 完了</p>
            <h4 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">{totalTasks} / <span className="text-emerald-600">{completedTasks}</span></h4>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">総学習時間</p>
            <h4 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">{totalHours} <span className="text-xs">時間</span></h4>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">優先・急ぎの課題</p>
            <h4 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">{highPriority.length} <span className="text-xs text-zinc-400">({finishedHigh}件完了)</span></h4>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">課題消化率</p>
            <h4 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">{completionRate}%</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core completion visualization donut */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs md:col-span-1 flex flex-col justify-between">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-110 text-base mb-4">総合タスク進捗率</h3>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* BG circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  className="text-zinc-100 dark:text-zinc-800"
                />
                {/* Progress circle */}
                <motion.circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * completionRate) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="text-emerald-500 dark:text-emerald-400"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">{completionRate}%</span>
                <span className="text-xs text-zinc-400 font-medium">完了済み</span>
              </div>
            </div>

            <div className="mt-6 w-full space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-500 mr-2"></span>最優先・高</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{finishedHigh}/{highPriority.length} 完了 ({highRate}%)</span>
              </div>
              <div className="p-2 gap-2 text-[11px] text-zinc-400 text-center">
                課題の締め切りと優先度を意識して、順番に終わらせていきましょう！
              </div>
            </div>
          </div>
        </div>

        {/* Weekly focus histogram - animated SVG */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">週間学習トレンド</h3>
              <p className="text-xs text-zinc-400">直近7日間の日別学習時間（分）</p>
            </div>
            <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 py-1.5 px-3 rounded-lg text-xs font-semibold">
              <Calendar className="h-4 w-4" />
              <span>今日までの一週間</span>
            </div>
          </div>

          {/* Graphical Bars */}
          <div className="h-64 flex items-end justify-between px-2 pt-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            {weeklyData.map((data, index) => {
              const heightPercent = Math.min((data.minutes / maxWeeklyMinutes) * 100, 100);
              return (
                <div key={index} className="flex flex-col items-center flex-1 mx-2 group">
                  <div className="w-full relative flex justify-center items-end h-48">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-md z-10">
                      {data.minutes} 分 ({data.dateFormatted})
                    </div>
                    {/* Interactive Bar */}
                    <motion.div 
                      className="w-full sm:w-8 md:w-10 rounded-t-lg bg-gradient-to-t from-emerald-500/80 to-teal-400/90 dark:from-emerald-600/80 dark:to-emerald-400 dark:group-hover:to-teal-300 group-hover:from-emerald-500 transition-all cursor-pointer relative"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPercent, 4)}%` }}
                      transition={{ delay: index * 0.08, duration: 0.6, ease: "easeOut" }}
                    >
                      {data.minutes > 0 && (
                        <div className="absolute inset-x-0 top-1 text-center text-[10px] text-white font-bold hidden sm:block">
                          {data.minutes}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">{data.dayName}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between items-center text-xs text-zinc-400 pt-2">
            <span>※ 日常の振り返り（ジャーナル）を追加して、学習した時間を記録するとグラフに反映されます。</span>
          </div>
        </div>
      </div>
    </div>
  );
}
