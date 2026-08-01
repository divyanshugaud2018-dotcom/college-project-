import {
  User,
  Doubt,
  Answer,
  Report,
  NotificationItem,
  ActivityData,
  DepartmentStat,
  Category,
  UserRole
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DOUBTS,
  INITIAL_ANSWERS,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY,
  INITIAL_DEPT_STATS
} from '../data/seedData';

const STORAGE_KEYS = {
  CURRENT_USER: 'doubtnest_current_user',
  USERS: 'doubtnest_users',
  DOUBTS: 'doubtnest_doubts',
  ANSWERS: 'doubtnest_answers',
  REPORTS: 'doubtnest_reports',
  NOTIFICATIONS: 'doubtnest_notifications',
  ACTIVITY: 'doubtnest_activity',
  DEPT_STATS: 'doubtnest_dept_stats',
  THEME: 'doubtnest_theme',
};

// Event emitter for reactive state updates
export const STORAGE_EVENT = 'doubtnest_storage_update';

function notifyStorageChange() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

// Initialize LocalStorage with seed data if empty
export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOUBTS)) {
    localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(INITIAL_DOUBTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANSWERS)) {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(INITIAL_ANSWERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_ACTIVITY));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEPT_STATS)) {
    localStorage.setItem(STORAGE_KEYS.DEPT_STATS, JSON.stringify(INITIAL_DEPT_STATS));
  }

  // Default login as Student (Rohan Gupta) if none logged in
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    const users = getUsers();
    const defaultUser = users.find(u => u.id === 'user-student-1') || users[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
  }
}

// Current User Session
export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  notifyStorageChange();
}

// Users
export function getUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : INITIAL_USERS;
}

export function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  // Update current user if modified
  const current = getCurrentUser();
  if (current) {
    const updated = users.find(u => u.id === current.id);
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    }
  }
  notifyStorageChange();
}

export function awardReputation(userId: string, points: number) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].reputationPoints = Math.max(0, (users[index].reputationPoints || 0) + points);
    saveUsers(users);
  }
}

// College Email Validation helper
export function isCollegeEmail(email: string): boolean {
  const cleaned = email.trim().toLowerCase();
  return cleaned.endsWith('.edu') || cleaned.endsWith('college.edu') || cleaned.endsWith('univ.edu') || cleaned.includes('.edu.');
}

// Auth Actions
export function registerCollegeUser(
  email: string,
  name: string,
  role: UserRole,
  department: string,
  year: string,
  rollNumber: string,
  avatar?: string
): { success: boolean; message: string; user?: User } {
  if (!isCollegeEmail(email)) {
    return {
      success: false,
      message: 'Access denied: You must use a valid college email address ending in .edu (e.g. name@college.edu).'
    };
  }

  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return { success: false, message: 'An account with this college email already exists.' };
  }

  const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`;

  const newUser: User = {
    id: `user-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name,
    role,
    department,
    year,
    rollNumber,
    avatar: avatar || defaultAvatar,
    status: 'active',
    isVerified: true, // Email verification simulated step
    reputationPoints: 10,
    createdAt: new Date().toISOString(),
    savedDoubts: [],
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  return { success: true, message: 'Account created successfully! Email verified.', user: newUser };
}

export function loginCollegeUser(email: string): { success: boolean; message: string; user?: User } {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return { success: false, message: 'No registered account found with this email. Please sign up.' };
  }

  if (user.status === 'blocked') {
    return { success: false, message: 'Your account has been permanently blocked by the College Administrator.' };
  }

  if (user.status === 'suspended') {
    return { success: false, message: 'Your account is currently suspended due to policy violations.' };
  }

  setCurrentUser(user);
  return { success: true, message: 'Logged in successfully.', user };
}

export function switchUserRoleForDemo(role: UserRole) {
  const users = getUsers();
  let target = users.find(u => u.role === role);
  if (!target) {
    target = users[0];
  }
  setCurrentUser(target);
}

// Doubts
export function getDoubts(): Doubt[] {
  const data = localStorage.getItem(STORAGE_KEYS.DOUBTS);
  return data ? JSON.parse(data) : INITIAL_DOUBTS;
}

export function saveDoubts(doubts: Doubt[]) {
  localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
  notifyStorageChange();
}

export function createDoubt(doubtData: {
  title: string;
  content: string;
  category: Category;
  department: string;
  subject: string;
  semester: string;
  tags: string[];
  isAnonymous: boolean;
}): Doubt {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('User must be logged in to post a doubt');

  const doubts = getDoubts();
  const newDoubt: Doubt = {
    id: `doubt-${Date.now()}`,
    title: doubtData.title,
    content: doubtData.content,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorRole: currentUser.role,
    authorDepartment: currentUser.department,
    isAnonymous: doubtData.isAnonymous,
    category: doubtData.category,
    department: doubtData.department,
    subject: doubtData.subject,
    semester: doubtData.semester,
    tags: doubtData.tags,
    votes: 0,
    upvotedBy: [],
    createdAt: new Date().toISOString(),
    isClosed: false,
    views: 1,
  };

  doubts.unshift(newDoubt);
  saveDoubts(doubts);
  awardReputation(currentUser.id, 5);

  return newDoubt;
}

export function toggleUpvoteDoubt(doubtId: string): Doubt | null {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const doubts = getDoubts();
  const index = doubts.findIndex(d => d.id === doubtId);
  if (index === -1) return null;

  const doubt = doubts[index];
  const hasUpvoted = doubt.upvotedBy.includes(currentUser.id);

  if (hasUpvoted) {
    doubt.upvotedBy = doubt.upvotedBy.filter(id => id !== currentUser.id);
    doubt.votes -= 1;
  } else {
    doubt.upvotedBy.push(currentUser.id);
    doubt.votes += 1;
  }

  saveDoubts(doubts);
  return doubt;
}

export function toggleSaveBookmark(doubtId: string): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  const users = getUsers();
  const userIdx = users.findIndex(u => u.id === currentUser.id);
  if (userIdx === -1) return false;

  const user = users[userIdx];
  const isSaved = user.savedDoubts.includes(doubtId);

  if (isSaved) {
    user.savedDoubts = user.savedDoubts.filter(id => id !== doubtId);
  } else {
    user.savedDoubts.push(doubtId);
  }

  saveUsers(users);
  return !isSaved;
}

export function deleteDoubt(doubtId: string) {
  const doubts = getDoubts().filter(d => d.id !== doubtId);
  saveDoubts(doubts);

  // Also remove associated answers
  const answers = getAnswers().filter(a => a.doubtId !== doubtId);
  saveAnswers(answers);
}

// Answers
export function getAnswers(): Answer[] {
  const data = localStorage.getItem(STORAGE_KEYS.ANSWERS);
  return data ? JSON.parse(data) : INITIAL_ANSWERS;
}

export function saveAnswers(answers: Answer[]) {
  localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
  notifyStorageChange();
}

export function createAnswer(doubtId: string, content: string, isAnonymous: boolean): Answer {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('Must be logged in');

  const answers = getAnswers();
  const newAnswer: Answer = {
    id: `ans-${Date.now()}`,
    doubtId,
    content,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorRole: currentUser.role,
    authorDepartment: currentUser.department,
    authorAvatar: currentUser.avatar,
    isAnonymous,
    upvotes: 0,
    upvotedBy: [],
    correctVotes: 0,
    incorrectVotes: 0,
    votedCorrectBy: [],
    votedIncorrectBy: [],
    isBestAnswer: false,
    isVerifiedCorrect: currentUser.role === 'faculty' || currentUser.role === 'admin',
    createdAt: new Date().toISOString(),
    comments: [],
  };

  answers.push(newAnswer);
  saveAnswers(answers);

  // Award points
  awardReputation(currentUser.id, 10);

  // Notify question author
  const doubts = getDoubts();
  const doubt = doubts.find(d => d.id === doubtId);
  if (doubt && doubt.authorId !== currentUser.id) {
    addNotification({
      userId: doubt.authorId,
      type: 'new_answer',
      title: 'New answer on your doubt',
      message: `${isAnonymous ? 'An anonymous user' : currentUser.name} answered your doubt: "${doubt.title.substring(0, 40)}..."`,
      linkDoubtId: doubtId,
    });
  }

  return newAnswer;
}

export function toggleUpvoteAnswer(answerId: string) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const answers = getAnswers();
  const index = answers.findIndex(a => a.id === answerId);
  if (index === -1) return;

  const ans = answers[index];
  const hasUpvoted = ans.upvotedBy.includes(currentUser.id);

  if (hasUpvoted) {
    ans.upvotedBy = ans.upvotedBy.filter(id => id !== currentUser.id);
    ans.upvotes -= 1;
    awardReputation(ans.authorId, -5);
  } else {
    ans.upvotedBy.push(currentUser.id);
    ans.upvotes += 1;
    awardReputation(ans.authorId, 5);
  }

  saveAnswers(answers);
}

export function voteAnswerCorrectness(answerId: string, isCorrectVote: boolean) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const answers = getAnswers();
  const index = answers.findIndex(a => a.id === answerId);
  if (index === -1) return;

  const ans = answers[index];

  if (isCorrectVote) {
    // Check if already voted correct
    if (ans.votedCorrectBy.includes(currentUser.id)) {
      ans.votedCorrectBy = ans.votedCorrectBy.filter(id => id !== currentUser.id);
      ans.correctVotes -= 1;
    } else {
      ans.votedCorrectBy.push(currentUser.id);
      ans.correctVotes += 1;
      // Remove from incorrect if voted
      if (ans.votedIncorrectBy.includes(currentUser.id)) {
        ans.votedIncorrectBy = ans.votedIncorrectBy.filter(id => id !== currentUser.id);
        ans.incorrectVotes -= 1;
      }
    }
  } else {
    // Incorrect vote
    if (ans.votedIncorrectBy.includes(currentUser.id)) {
      ans.votedIncorrectBy = ans.votedIncorrectBy.filter(id => id !== currentUser.id);
      ans.incorrectVotes -= 1;
    } else {
      ans.votedIncorrectBy.push(currentUser.id);
      ans.incorrectVotes += 1;
      // Remove from correct if voted
      if (ans.votedCorrectBy.includes(currentUser.id)) {
        ans.votedCorrectBy = ans.votedCorrectBy.filter(id => id !== currentUser.id);
        ans.correctVotes -= 1;
      }
    }
  }

  saveAnswers(answers);
}

export function toggleBestAnswer(answerId: string) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const answers = getAnswers();
  const targetIdx = answers.findIndex(a => a.id === answerId);
  if (targetIdx === -1) return;

  const target = answers[targetIdx];
  const isNowBest = !target.isBestAnswer;

  // Reset other best answers for same doubt
  answers.forEach(a => {
    if (a.doubtId === target.doubtId) {
      a.isBestAnswer = false;
    }
  });

  target.isBestAnswer = isNowBest;
  saveAnswers(answers);

  if (isNowBest) {
    awardReputation(target.authorId, 25);

    addNotification({
      userId: target.authorId,
      type: 'best_answer',
      title: '🌟 Best Answer Selected!',
      message: 'Your answer was marked as the Best Answer by the doubt author/faculty!',
      linkDoubtId: target.doubtId,
    });
  }
}

export function toggleAdminVerifiedCorrect(answerId: string) {
  const currentUser = getCurrentUser();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'faculty')) return;

  const answers = getAnswers();
  const targetIdx = answers.findIndex(a => a.id === answerId);
  if (targetIdx === -1) return;

  const target = answers[targetIdx];
  target.isVerifiedCorrect = !target.isVerifiedCorrect;

  saveAnswers(answers);

  if (target.isVerifiedCorrect) {
    awardReputation(target.authorId, 50);

    addNotification({
      userId: target.authorId,
      type: 'verified_correct',
      title: '✅ Answer Verified Correct',
      message: `Faculty/Admin ${currentUser.name} verified your answer as official & correct!`,
      linkDoubtId: target.doubtId,
    });
  }
}

export function addAnswerComment(answerId: string, content: string) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const answers = getAnswers();
  const index = answers.findIndex(a => a.id === answerId);
  if (index === -1) return;

  const ans = answers[index];
  const newComment = {
    id: `comm-${Date.now()}`,
    answerId,
    content,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorRole: currentUser.role,
    createdAt: new Date().toISOString(),
  };

  ans.comments.push(newComment);
  saveAnswers(answers);

  if (ans.authorId !== currentUser.id) {
    addNotification({
      userId: ans.authorId,
      type: 'new_comment',
      title: 'New comment on your answer',
      message: `${currentUser.name} commented on your answer.`,
      linkDoubtId: ans.doubtId,
    });
  }
}

export function deleteAnswer(answerId: string) {
  const answers = getAnswers().filter(a => a.id !== answerId);
  saveAnswers(answers);
}

// Reports
export function getReports(): Report[] {
  const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
  return data ? JSON.parse(data) : INITIAL_REPORTS;
}

export function submitReport(reportData: {
  targetType: 'doubt' | 'answer';
  targetId: string;
  doubtId: string;
  reason: 'spam' | 'abuse' | 'fake_info' | 'other';
  details: string;
}) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const reports = getReports();
  const newReport: Report = {
    id: `rep-${Date.now()}`,
    targetType: reportData.targetType,
    targetId: reportData.targetId,
    doubtId: reportData.doubtId,
    reporterId: currentUser.id,
    reporterName: currentUser.name,
    reason: reportData.reason,
    details: reportData.details,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  reports.unshift(newReport);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  notifyStorageChange();
}

export function reviewReport(reportId: string, action: 'dismiss' | 'remove_post') {
  const reports = getReports();
  const index = reports.findIndex(r => r.id === reportId);
  if (index === -1) return;

  const rep = reports[index];
  rep.status = action === 'dismiss' ? 'dismissed' : 'action_taken';
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

  if (action === 'remove_post') {
    if (rep.targetType === 'doubt') {
      deleteDoubt(rep.targetId);
    } else {
      deleteAnswer(rep.targetId);
    }
  }

  notifyStorageChange();
}

// Notifications
export function getNotifications(userId: string): NotificationItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all: NotificationItem[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
  return all.filter(n => n.userId === userId);
}

export function addNotification(notifData: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>) {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all: NotificationItem[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;

  const newNotif: NotificationItem = {
    ...notifData,
    id: `notif-${Date.now()}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  all.unshift(newNotif);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
  notifyStorageChange();
}

export function markNotificationAsRead(notifId: string) {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all: NotificationItem[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
  const item = all.find(n => n.id === notifId);
  if (item) {
    item.isRead = true;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    notifyStorageChange();
  }
}

export function markAllNotificationsRead(userId: string) {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all: NotificationItem[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
  all.forEach(n => {
    if (n.userId === userId) n.isRead = true;
  });
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
  notifyStorageChange();
}

// User Admin Management
export function updateUserStatus(userId: string, newStatus: 'active' | 'suspended' | 'blocked') {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.status = newStatus;
    saveUsers(users);
  }
}

// Stats & Charts
export function getActivityData(): ActivityData[] {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  return data ? JSON.parse(data) : INITIAL_ACTIVITY;
}

export function getDeptStats(): DepartmentStat[] {
  const data = localStorage.getItem(STORAGE_KEYS.DEPT_STATS);
  return data ? JSON.parse(data) : INITIAL_DEPT_STATS;
}
