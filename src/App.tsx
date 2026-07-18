import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  where,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { auth, db, googleSignIn, logout, initAuth, guestSignIn } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { Task, Goal, Journal, Team, UserProfile, OperationType, ExamSchedule } from './types';
import { handleFirestoreError } from './firebase';

// Components
import Dashboard from './components/Dashboard';
import TasksList from './components/TasksList';
import Reflections from './components/Reflections';
import GoalSettings from './components/GoalSettings';
import ProgressCharts from './components/ProgressCharts';
import TeamSharing from './components/TeamSharing';
import Rankings from './components/Rankings';

// Icons
import {
  Sparkles,
  LogOut,
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Target,
  BarChart3,
  Users2,
  Trophy,
  Moon,
  Sun,
  Chrome,
  GraduationCap,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tasks' | 'journals' | 'goals' | 'charts' | 'teams' | 'rankings'>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Firestore Subscribed States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // DarkMode sync on initial load
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth Initialization Hook
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        fetchOrCreateProfile(currentUser);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setUserProfile(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync / Subscribe Firestore when user is signed in
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setGoals([]);
      setExams([]);
      setJournals([]);
      setTeams([]);
      setAllUsers([]);
      return;
    }

    // Subscribe tasks (either user owned, or group shared)
    const personalTasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const teamTasksQuery = query(collection(db, 'tasks'), where('teamId', '!=', ''));

    let personalList: Task[] = [];
    let teamList: Task[] = [];

    const updateCombinedTasks = () => {
      const mergedMap = new Map<string, Task>();
      personalList.forEach(t => mergedMap.set(t.id, t));
      teamList.forEach(t => mergedMap.set(t.id, t));
      const combined = Array.from(mergedMap.values());
      setTasks(combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    const unsubscribePersonalTasks = onSnapshot(personalTasksQuery, (snapshot) => {
      personalList = [];
      snapshot.forEach((docSnap) => {
        personalList.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });
      updateCombinedTasks();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks/personal'));

    const unsubscribeTeamTasks = onSnapshot(teamTasksQuery, (snapshot) => {
      teamList = [];
      snapshot.forEach((docSnap) => {
        teamList.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });
      updateCombinedTasks();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks/team'));

    // Subscribe goals
    const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const list: Goal[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Goal);
      });
      setGoals(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'goals'));

    // Subscribe exams (periodic tests)
    const examsQuery = query(collection(db, 'exams'), where('userId', '==', user.uid));
    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const list: ExamSchedule[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ExamSchedule);
      });
      setExams(list.sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'exams'));

    // Subscribe journals
    const journalsQuery = query(collection(db, 'journals'), where('userId', '==', user.uid));
    const unsubscribeJournals = onSnapshot(journalsQuery, (snapshot) => {
      const list: Journal[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Journal);
      });
      setJournals(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'journals'));

    // Subscribe groups/teams
    const teamsQuery = query(collection(db, 'teams'));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const list: Team[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const membersList = data.members || [];
        if (membersList.includes(user.email) || data.ownerId === user.uid) {
          list.push({ id: docSnap.id, ...data } as Team);
        }
      });
      setTeams(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'teams'));

    // Subscribe User leaderboards profiles
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeAllUsers = onSnapshot(usersQuery, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      setAllUsers(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // Subscribe Current profile separately to reflect XP live changes
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    });

    return () => {
      unsubscribePersonalTasks();
      unsubscribeTeamTasks();
      unsubscribeGoals();
      unsubscribeExams();
      unsubscribeJournals();
      unsubscribeTeams();
      unsubscribeAllUsers();
      unsubscribeProfile();
    };
  }, [user]);

  // Fetch or setup basic user profile inside db
  const fetchOrCreateProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else {
        const initialProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.isAnonymous ? 'ゲスト学習者' : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '学習者'),
          email: firebaseUser.email || (firebaseUser.isAnonymous ? 'guest@studydash.local' : ''),
          ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
          xp: 0,
          weeklyGoalMinutes: 300,
        };
        await setDoc(userRef, {
          ...initialProfile,
          createdAt: new Date().toISOString()
        });
        setUserProfile(initialProfile);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('offline') || err?.code === 'unavailable') {
        console.warn('Firestore is offline, setting temporary/local user profile:', errMsg);
        // Fallback to local profile based on authenticated firebaseUser so the app remains fully interactive offline
        const localProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.isAnonymous ? 'ゲスト学習者' : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '学習者'),
          email: firebaseUser.email || (firebaseUser.isAnonymous ? 'guest@studydash.local' : ''),
          ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
          xp: 0,
          weeklyGoalMinutes: 300,
        };
        setUserProfile(localProfile);
      } else {
        console.error('Error fetching user profile:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await fetchOrCreateProfile(result.user);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      if (err?.code === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        setLoginError('サインイン用のポップアップが閉じられました。ポップアップ画面上でアカウントを選択してログインを完了してください。ブラウザ設定等でポップアップがブロックされている場合、許可をお願いします。解決しない場合、画面上部の「Open in new tab」（新しいタブで開く）より本アプリを直接開いてみてください。');
      } else if (err?.code === 'auth/cancelled-popup-request' || errMsg.includes('cancelled-popup-request')) {
        setLoginError('サインイン処理がキャンセルされました。もう一度お試しください。');
      } else {
        setLoginError('ログインに失敗しました：' + errMsg);
      }
    }
  };

  const handleGuestLogin = async () => {
    setLoginError(null);
    try {
      const result = await guestSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(null);
        await fetchOrCreateProfile(result.user);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      if (err?.code === 'auth/operation-not-allowed' || errMsg.includes('operation-not-allowed')) {
        setLoginError('ゲストサインイン（匿名認証）がFirebase側でまだ有効化されていません。Firebase Consoleの [Authentication] > [Sign-in method] で「匿名 (Anonymous)」を有効化してください。');
      } else {
        setLoginError('ゲストログインに失敗しました：' + errMsg);
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm('ログアウトしますか？ゲストモードで作成したデータは同じ端末・ブラウザからであれば自動的に再開されますが、シークレットモードやキャッシュ削除を行うと消える可能性があります。')) {
      await logout();
      setUser(null);
      setAccessToken(null);
      setUserProfile(null);
    };
  };

  const handleUpdateProfile = async (newDisplayName: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: newDisplayName,
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => prev ? { ...prev, displayName: newDisplayName } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  /**
   * TASK OPERATIONS
   */
  const handleAddTask = async (title: string, priority: 'high' | 'medium' | 'low', deadline: string, description: string, personalDeadline?: string) => {
    if (!user) return;
    try {
      const newTask = {
        title,
        priority,
        deadline,
        description,
        status: 'todo' as const,
        progress: 0,
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || '不明なユーザー',
        ...(user.photoURL ? { userPhoto: user.photoURL } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(personalDeadline ? { personalDeadline } : {}),
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);

      // Google Calendar auto-sync if Google user
      if (user && !user.isAnonymous) {
        try {
          const createdTask: Task = {
            id: docRef.id,
            ...newTask,
          };
          await handleSyncTaskToGoogleCalendar(createdTask);
        } catch (calendarErr) {
          console.error('Google Calendar auto-sync failed for handleAddTask:', calendarErr);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const handleUpdateTask = async (taskId: string, fields: Partial<Task>) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const targetTask = tasks.find(t => t.id === taskId);
      if (!targetTask) return;

      // Handle XP rewarding upon completion conversion
      const wasDone = targetTask.status === 'done';
      const isNowDone = fields.status === 'done' || fields.progress === 100;
      let xpIncr = 0;

      if (!wasDone && isNowDone) {
        xpIncr = 50; // Award 50XP
      } else if (wasDone && !isNowDone) {
        xpIncr = -50; // Deduct 50XP
      }

      await updateDoc(taskRef, {
        ...fields,
        updatedAt: new Date().toISOString()
      });

      if (xpIncr !== 0) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          xp: increment(xpIncr)
        });
      }

      // Automatically sync task updates to Google Calendar for logged-in Google users
      if (user && !user.isAnonymous) {
        const updatedTask = {
          ...targetTask,
          ...fields
        };
        try {
          await handleSyncTaskToGoogleCalendar(updatedTask);
        } catch (syncErr) {
          console.error('Auto-sync to Google Calendar failed during task update:', syncErr);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    if (!window.confirm('本当にこの課題を削除しますか？')) return;

    try {
      const targetTask = tasks.find(t => t.id === taskId);
      // Deduct XP if deleting a completed task
      if (targetTask?.status === 'done') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          xp: increment(-50)
        });
      }

      // Delete Google Calendar events if they exist
      if (user && !user.isAnonymous && targetTask && (targetTask.googleCalendarEventId || targetTask.googleCalendarPersonalEventId)) {
        let currentToken = accessToken;
        if (!currentToken) {
          try {
            const result = await googleSignIn();
            if (result) currentToken = result.accessToken;
          } catch (e) {
            console.error('Failed to retrieve token for calendar event deletion:', e);
          }
        }
        if (currentToken) {
          const deleteEvent = async (eventId: string) => {
            try {
              await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` }
              });
            } catch (err) {
              console.error('Error deleting calendar event:', err);
            }
          };
          if (targetTask.googleCalendarEventId) {
            await deleteEvent(targetTask.googleCalendarEventId);
          }
          if (targetTask.googleCalendarPersonalEventId) {
            await deleteEvent(targetTask.googleCalendarPersonalEventId);
          }
        }
      }

      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const handleSyncTaskToGoogleCalendar = async (task: Task, isManual: boolean = false) => {
    let currentToken = accessToken;

    // If the user is a logged-in Google user but we don't have a valid token (e.g., expired/cleared),
    // attempt to prompt for a seamless Google Sign-In/re-authorization to retrieve a fresh token ONLY if it is a manual sync.
    if (!currentToken && user && !user.isAnonymous) {
      if (isManual) {
        try {
          console.log('Access token is missing or expired for Google user. Attempting to re-authorize...');
          const result = await googleSignIn();
          if (result) {
            currentToken = result.accessToken;
            setAccessToken(currentToken);
          }
        } catch (authErr: any) {
          throw new Error('Googleカレンダーへのアクセス期限が切れています。カレンダー連携を継続するには、一度ダッシュボードから再度Googleアカウント連携（ログイン）を行ってください。');
        }
      } else {
        console.log('Skipping Google Calendar auto-sync because access token is missing/expired.');
        return;
      }
    }

    if (!currentToken) {
      if (isManual) {
        throw new Error('ゲストモード（またはGoogle連携未承認のログイン）では、Google Calendarとの同期機能はサポートされていません。この機能を利用するには、Googleアカウントでログインするか、ダッシュボードから連携してください。');
      } else {
        return;
      }
    }

    const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleDateString("ja-JP") : "未設定";
    const personalDeadlineStr = task.personalDeadline ? new Date(task.personalDeadline).toLocaleDateString("ja-JP") : "未設定";

    const customDescription = `【StudyDash 課題詳細】
${task.description || '特になし'}

---------------------------------
📅 提出期限日: ${deadlineStr}
🎯 自分的な完了期限: ${personalDeadlineStr}
---------------------------------
※この予定はStudyDashから自動同期されました。`;

    // Helper to send individual event request (handles POST, PUT, or DELETE)
    const syncEvent = async (
      eventId: string | undefined,
      summary: string,
      dateStr: string | undefined
    ): Promise<string | null> => {
      // If dateStr is not set, delete the event if it exists
      if (!dateStr) {
        if (eventId) {
          try {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${currentToken}`,
              },
            });
          } catch (e) {
            console.error('Failed to delete calendar event:', e);
          }
        }
        return null;
      }

      // We have a date. Either update (PUT) or create (POST)
      const method = eventId ? 'PUT' : 'POST';
      const url = eventId
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`
        : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

      const eventBody = {
        summary,
        description: customDescription,
        start: { date: dateStr },
        end: { date: dateStr }
      };

      let response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      // If token expired, refresh and retry once
      if (response.status === 401 && user && !user.isAnonymous) {
        console.log('Access token expired (401). Trying to refresh Google access token...');
        try {
          const result = await googleSignIn();
          if (result) {
            currentToken = result.accessToken;
            setAccessToken(currentToken);

            response = await fetch(url, {
              method,
              headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventBody),
            });
          }
        } catch (authErr) {
          console.error('Failed to re-authorize after 401:', authErr);
        }
      }

      if (!response.ok) {
        // If updating an event that was deleted on Google Calendar side, we might get 404.
        // In that case, retry as a POST to recreate it cleanly!
        if (response.status === 404 && eventId) {
          console.log('Event not found (404) on Google Calendar, recreating...');
          return syncEvent(undefined, summary, dateStr);
        }
        const errTxt = await response.text();
        if (response.status === 403 || errTxt.includes('Insufficient Permission') || errTxt.includes('PERMISSION_DENIED') || errTxt.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
          throw new Error('Googleカレンダーへの書き込み権限がありません。ログインの際、Googleの承認画面で「カレンダーイベントの編集」にチェックが入っていることを確認してください。解決するには、画面右上メニューから一度ログアウトし、再ログイン時に必ず権限にチェックを入れて連携し直してください。');
        }
        throw new Error(errTxt);
      }

      if (method === 'PUT') {
        return eventId || null;
      } else {
        const resData = await response.json();
        return resData.id as string;
      }
    };

    let deadlineEventId: string | null | undefined = undefined;
    let personalEventId: string | null | undefined = undefined;

    // Sync deadline event
    try {
      deadlineEventId = await syncEvent(task.googleCalendarEventId, `【提出期限】${task.title}`, task.deadline);
    } catch (err) {
      console.error('Failed to sync deadline event:', err);
    }

    // Sync personal goal event
    try {
      personalEventId = await syncEvent(task.googleCalendarPersonalEventId, `【自分目標期限】${task.title}`, task.personalDeadline);
    } catch (err) {
      console.error('Failed to sync personal deadline event:', err);
    }

    // Update Firestore task doc with the updated/created event IDs
    const updateFields: any = {
      updatedAt: new Date().toISOString()
    };
    if (deadlineEventId !== undefined) {
      updateFields.googleCalendarEventId = deadlineEventId || "";
    }
    if (personalEventId !== undefined) {
      updateFields.googleCalendarPersonalEventId = personalEventId || "";
    }

    const taskRef = doc(db, 'tasks', task.id);
    await updateDoc(taskRef, updateFields);
  };

  /**
   * JOURNAL / REFLECTION OPERATIONS
   */
  const handleAddJournal = async (content: string, studyMinutes: number) => {
    if (!user) return;
    try {
      const newJournal = {
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || '不明なユーザー',
        ...(user.photoURL ? { userPhoto: user.photoURL } : {}),
        content,
        studyMinutes,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'journals'), newJournal);

      // Increment XP based on study minutes (15 minutes unit = 15 XP)
      const calculatedXp = Math.floor(studyMinutes / 15) * 15;
      if (calculatedXp > 0) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          xp: increment(calculatedXp)
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'journals');
    }
  };

  /**
   * GOAL OPERATIONS
   */
  const handleAddGoal = async (title: string, startDate: string, endDate: string) => {
    if (!user) return;
    try {
      const newGoal = {
        userId: user.uid,
        title,
        startDate,
        endDate,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'goals'), newGoal);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'goals');
    }
  };

  const handleToggleGoalStatus = async (goalId: string, currentStatus: 'active' | 'completed' | 'failed') => {
    if (!user) return;
    try {
      const goalRef = doc(db, 'goals', goalId);
      const nextStatus = currentStatus === 'active' ? 'completed' : 'active';
      const xpIncr = nextStatus === 'completed' ? 100 : -100; // Award 100XP on Goal cleared

      await updateDoc(goalRef, {
        status: nextStatus
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: increment(xpIncr)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `goals/${goalId}`);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    if (!window.confirm('この目標設定を削除しますか？')) return;

    try {
      const targetGoal = goals.find(g => g.id === goalId);
      // Deduct XP if deleting a completed goal
      if (targetGoal?.status === 'completed') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          xp: increment(-100)
        });
      }
      await deleteDoc(doc(db, 'goals', goalId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `goals/${goalId}`);
    }
  };

  const handleUpdateWeeklyGoalMinutes = async (minutes: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        weeklyGoalMinutes: minutes
      });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * EXAM OPERATIONS (定期テスト管理)
   */
  const handleAddExam = async (title: string, examDate: string, subjects: string[], notes: string) => {
    if (!user) return;
    try {
      const newExam = {
        userId: user.uid,
        title,
        examDate,
        subjects,
        notes,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'exams'), newExam);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'exams');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!user) return;
    if (!window.confirm('この定期テストを削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `exams/${examId}`);
    }
  };

  /**
   * TEAM OPERATIONS
   */
  const handleAddTeam = async (name: string, members: string[]) => {
    if (!user) return;
    try {
      const newTeam = {
        name,
        ownerId: user.uid,
        members,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'teams'), newTeam);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'teams');
    }
  };

  const handleAddTaskToTeam = async (title: string, priority: 'high' | 'medium' | 'low', deadline: string, teamId: string, personalDeadline?: string) => {
    if (!user) return;
    try {
      const newTeamTask = {
        title,
        priority,
        deadline,
        status: 'todo' as const,
        progress: 0,
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || '不明なユーザー',
        ...(user.photoURL ? { userPhoto: user.photoURL } : {}),
        teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(personalDeadline ? { personalDeadline } : {}),
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTeamTask);

      // Google Calendar auto-sync if OAuth accessToken is available
      if (accessToken) {
        try {
          const createdTask: Task = {
            id: docRef.id,
            ...newTeamTask,
          };
          await handleSyncTaskToGoogleCalendar(createdTask);
        } catch (calendarErr) {
          console.error('Google Calendar auto-sync failed for handleAddTaskToTeam:', calendarErr);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const handleUpdateTeamMembers = async (teamId: string, members: string[]) => {
    if (!user) return;
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        members
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 pt-safe pb-safe">
        <GraduationCap className="h-12 w-12 text-emerald-500 animate-bounce mb-4" />
        <p className="text-sm font-semibold">学習データを同期しています...</p>
      </div>
    );
  }

  // Not signed in splash screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 pt-safe pb-safe transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8 rounded-3xl text-center shadow-xs">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4.5 transition-transform transform hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-logo leading-tight tracking-[0.25em] uppercase">
            STUDY COMPASS
          </h1>
          <p className="text-zinc-400 dark:text-zinc-500 text-[8px] mt-1.5 block tracking-[0.2em] uppercase font-bold">
            学習支援ナビ / コラボレーションダッシュボード
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-6 leading-relaxed px-4">
            期限のある学習課題の可視化、チームとの課題共有、AIスマートアドバイス、そして勉強して稼ぐXPランキングで、友達と一緒に目標を達成しましょう。
          </p>

          <button
            onClick={handleLogin}
            className="w-full mt-8 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-850 hover:dark:bg-zinc-750 text-white font-bold py-3 px-4 rounded-xl text-sm transition-transform transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer shadow-sm animate-fade-in"
          >
            <Chrome className="h-4.5 w-4.5" />
            <span>Googleアカウントで始める</span>
          </button>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-zinc-150 dark:border-zinc-850"></div>
            <span className="flex-shrink mx-4 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">または（推奨）</span>
            <div className="flex-grow border-t border-zinc-150 dark:border-zinc-850"></div>
          </div>

          <button
            onClick={handleGuestLogin}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-transform transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <UserCheck className="h-4.5 w-4.5" />
            <span>審査不要：ゲストモードで始める</span>
          </button>

          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-4 text-left bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-2xl border border-zinc-200/10 dark:border-zinc-800/20 leading-relaxed">
            💡 <strong>Google認証の制限について:</strong><br />
            Google API（カレンダーイベント等）を活用する機能を含んでいるため、Googleの審査が未完了の段階（開発中など）では、テストユーザー以外はGoogleログインが制限されることがあります。その場合は<strong>「ゲストモード（匿名サインイン）」</strong>をご選択いただくと、アカウント審査制限に関わらず、本アプリの基本機能（課題・チーム機能等）がすべて快適にご利用いただけます！
          </p>

          {loginError && (
            <div id="login-error-tip" className="mt-4 p-4 bg-red-50 dark:bg-red-950/45 border border-red-200/60 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs rounded-2xl text-left leading-relaxed space-y-1">
              <p className="font-bold">⚠️ サインインのお願い：</p>
              <p>{loginError}</p>
            </div>
          )}

          <p className="text-[10px] text-zinc-405 dark:text-zinc-500 mt-4">
            ※ Google Calender へのイベント登録同期のため、アクセス承認（カレンダーイベント編集権限）が必要です。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100`}>
      
      {/* Dynamic Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-850 z-40 transition-colors pt-safe">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-1.5 rounded-lg text-emerald-500">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-none block font-logo tracking-[0.2em] uppercase">STUDY COMPASS</span>
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mt-0.5 block">学習支援ナビ</span>
            </div>
          </div>

          {/* User top status & Hamburger Menu Toggle */}
          <div className="flex items-center space-x-2.5">
            {/* XP bar badge (Desktop) */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-150 dark:border-zinc-805">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-extrabold text-zinc-650 dark:text-zinc-350">
                {userProfile?.xp || 0} XP
              </span>
            </div>

            {/* Combined Hamburger Menu Button with Profile representation */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="flex items-center space-x-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 p-1.5 pr-2.5 pl-1.5 rounded-xl border border-zinc-150 dark:border-zinc-805 transition-all text-zinc-650 dark:text-zinc-300 outline-hidden cursor-pointer relative"
              aria-label="メニューを開く"
            >
              <div className="relative">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'user'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg border border-emerald-500/30 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] uppercase">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"></span>
              </div>
              <Menu className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" strokeWidth={1} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Settings & Navigation Drawer overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop overlay filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/70 z-50 pointer-events-auto"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-[#0a0a0a] border-l border-zinc-200 dark:border-zinc-900 shadow-2xl z-50 overflow-y-auto p-6 pt-safe pb-safe flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Header of Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-1.5 rounded-lg text-emerald-500">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs tracking-widest font-logo text-zinc-900 dark:text-white uppercase">MENU</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 cursor-pointer transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* User Information Block */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900">
                  <div className="flex items-center space-x-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="user profile"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-emerald-500 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm uppercase">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100 truncate leading-none">
                        {userProfile?.displayName || user.displayName}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-1">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Account points (XP) */}
                  <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-900 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">獲得経験値</span>
                    <div className="flex items-center space-x-1 font-bold text-xs text-amber-500">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      <span>{userProfile?.xp || 0} XP</span>
                    </div>
                  </div>
                </div>

                {/* Toggle Color Mode Option */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-widest block pl-1">モード設定</span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900 transition-colors cursor-pointer text-left flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-350"
                  >
                    <span className="flex items-center space-x-2">
                      {darkMode ? <Sun className="h-4 w-4 text-emerald-500" /> : <Moon className="h-4 w-4 text-emerald-500" />}
                      <span>{darkMode ? 'ライトモードに変更' : 'ダークモードに変更'}</span>
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-900 px-1.5 py-0.5 rounded-md font-semibold">
                      {darkMode ? '明るい' : '暗い'}
                    </span>
                  </button>
                </div>

                {/* Navigation Menu Links */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-widest block pl-1 mb-2">ナビゲーション</span>
                  
                  {[
                    { id: 'dashboard', label: '総合ダッシュボード', icon: LayoutDashboard },
                    { id: 'tasks', label: '提出課題管理', icon: CheckSquare },
                    { id: 'journals', label: '振り返りジャーナル', icon: BookOpen },
                    { id: 'goals', label: '定期目標設定', icon: Target },
                    { id: 'charts', label: '進捗グラフ可視化', icon: BarChart3 },
                    { id: 'teams', label: 'チームで課題共有', icon: Users2 },
                    { id: 'rankings', label: '勉強XPランキング', icon: Trophy },
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setCurrentTab(tab.id as any);
                          setDrawerOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-sm border-l-[3px] border-emerald-600'
                            : 'text-zinc-600 dark:text-zinc-450 drawer-nav-item'
                        }`}
                      >
                        <TabIcon className="h-4 w-4 shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer footer logout block */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer border border-rose-100/50 dark:border-rose-900/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ログアウトする</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main layout frame - Full Width View */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dynamic Display Area */}
        <main className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {currentTab === 'dashboard' && (
                <Dashboard
                  tasks={tasks}
                  goals={goals}
                  exams={exams}
                  journals={journals}
                  userProfile={userProfile}
                  accessToken={accessToken}
                  isGuest={user?.isAnonymous || false}
                  onUpdateTask={handleUpdateTask}
                  onTriggerGoogleLogin={handleLogin}
                  onLinkGoogleCalendar={() => setCurrentTab('tasks')}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

               {currentTab === 'tasks' && (
                <TasksList
                  tasks={tasks}
                  accessToken={accessToken}
                  isGuest={user?.isAnonymous || false}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onSyncTaskToGoogleCalendar={handleSyncTaskToGoogleCalendar}
                />
              )}

              {currentTab === 'journals' && (
                <Reflections
                  journals={journals}
                  tasks={tasks}
                  goals={goals}
                  userName={userProfile?.displayName || user.displayName || 'プロ顧客'}
                  onAddJournal={handleAddJournal}
                />
              )}

              {currentTab === 'goals' && (
                <GoalSettings
                  goals={goals}
                  exams={exams}
                  userProfile={userProfile}
                  onAddGoal={handleAddGoal}
                  onToggleGoalStatus={handleToggleGoalStatus}
                  onDeleteGoal={handleDeleteGoal}
                  onUpdateWeeklyGoal={handleUpdateWeeklyGoalMinutes}
                  onAddExam={handleAddExam}
                  onDeleteExam={handleDeleteExam}
                />
              )}

              {currentTab === 'charts' && (
                <ProgressCharts
                  tasks={tasks}
                  journals={journals}
                />
              )}

              {currentTab === 'teams' && (
                <TeamSharing
                  teams={teams}
                  tasks={tasks}
                  users={allUsers}
                  currentUserEmail={user.email}
                  onAddTeam={handleAddTeam}
                  onAddTaskToTeam={handleAddTaskToTeam}
                  onUpdateTeamMembers={handleUpdateTeamMembers}
                  onUpdateTaskProgress={(taskId, progress, status) => handleUpdateTask(taskId, { progress, status })}
                />
              )}

              {currentTab === 'rankings' && (
                <Rankings
                  users={allUsers}
                  currentUserProfile={userProfile}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

