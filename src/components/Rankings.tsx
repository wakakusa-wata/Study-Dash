import { UserProfile } from '../types';
import { Trophy, Medal, Star, Flame, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface RankingsProps {
  users: UserProfile[];
  currentUserProfile: UserProfile | null;
}

export default function Rankings({ users, currentUserProfile }: RankingsProps) {
  // Sort users by XP descending
  const sortedUsers = [...users].sort((a, b) => (b.xp || 0) - (a.xp || 0));

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 p-1.5 rounded-full">
            <Trophy className="h-5 w-5" />
          </div>
        );
      case 2:
        return (
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-1.5 rounded-full">
            <Medal className="h-5 w-5" />
          </div>
        );
      case 3:
        return (
          <div className="bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-500 p-1.5 rounded-full">
            <Medal className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <span className="w-8 h-8 font-mono font-bold text-center flex items-center justify-center text-zinc-400 text-sm">
            {rank}
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gamification card */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex items-center space-x-2 text-amber-500 mb-4">
            <Star className="h-5 w-5 fill-current" />
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">学習XPシステム</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            StudyDashでは、学べば学ぶほど、タスクを終わらせるほど、XP（学習経験値）が貯まっていきます！
          </p>

          <div className="space-y-3.5 text-xs text-zinc-650 dark:text-zinc-300">
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100/60 dark:border-zinc-800/40">
              <span className="font-semibold flex items-center">
                <Flame className="h-4 w-4 text-rose-500 mr-2" />
                振り返り (15分勉強につき)
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">+15 XP</span>
            </div>

            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100/60 dark:border-zinc-800/40">
              <span className="font-semibold flex items-center">
                <Medal className="h-4 w-4 text-indigo-500 mr-2" />
                課題を完了 (DONE)
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">+50 XP</span>
            </div>

            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100/60 dark:border-zinc-800/40">
              <span className="font-semibold flex items-center">
                <Award className="h-4 w-4 text-amber-500 mr-2" />
                定期目標を完了
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">+100 XP</span>
            </div>
          </div>
        </div>

        {/* Current user's XP profile overview */}
        {currentUserProfile && (
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-zinc-950 dark:to-zinc-900 border border-indigo-100 dark:border-zinc-800 p-6 rounded-2xl">
            <span className="text-xs text-indigo-500 dark:text-zinc-400 font-bold block mb-1">あなたの現在の獲得ポイント</span>
            <div className="flex items-baseline space-x-1.5 mb-3">
              <span className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-400 font-mono">
                {currentUserProfile.xp || 0}
              </span>
              <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">XP</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              素晴らしい学習ペースが保てています！友達との進捗競い合いが日々の大きなモチベーションにつながります。
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard Table / Scroll */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">学習XPランキング（全国・グループ）</h3>
              <p className="text-xs text-zinc-400">現在 StudyDash に登録しているユーザー同士の獲得経験値レース</p>
            </div>
          </div>

          <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-1">
            {sortedUsers.map((user, idx) => {
              const rank = idx + 1;
              const isMe = currentUserProfile?.uid === user.uid;

              return (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900 shadow-sm'
                      : 'bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-8 flex justify-center">
                      {getRankBadge(rank)}
                    </div>

                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-zinc-800"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                          {user.displayName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate flex items-center">
                        {user.displayName}
                        {isMe && (
                          <span className="ml-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] py-0.5 px-2 rounded-full font-bold">
                            あなた
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-base font-bold font-mono text-zinc-800 dark:text-zinc-100">
                      {user.xp || 0}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">XP</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
