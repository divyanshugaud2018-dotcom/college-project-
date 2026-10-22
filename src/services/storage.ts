import type { AuthError, User as AuthUser } from '@supabase/supabase-js';
import type {
  ActivityData,
  Answer,
  AnswerComment,
  Category,
  DepartmentStat,
  Doubt,
  NotificationItem,
  Report,
  User,
  UserRole,
  UserStatus,
} from '../types';
import { getSupabaseClient } from './supabase';

export const STORAGE_EVENT = 'doubtnest_storage_update';
export const DATABASE_ERROR_EVENT = 'doubtnest_database_error';
export const PASSWORD_RECOVERY_EVENT = 'doubtnest_password_recovery';

let currentUser: User | null = null;
let users: User[] = [];
let doubts: Doubt[] = [];
let answers: Answer[] = [];
let reports: Report[] = [];
let notifications: NotificationItem[] = [];
let authSubscriptionStarted = false;

type DbRow = Record<string, unknown>;

function notifyStorageChange() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function formatDatabaseError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'A database request failed.';
  const lowerMessage = rawMessage.toLowerCase();

  if (/permission denied.*(?:table|relation).*doubts|permission denied.*(?:community_doubts|community_answers|community_profiles)/i.test(rawMessage)) {
    return 'Supabase permissions are misconfigured. Run the project SQL migration again and set the community views to security_invoker = false.';
  }

  if (/permission denied/i.test(lowerMessage)) {
    return 'Supabase rejected the request because the database roles or RLS policy setup is incomplete.';
  }

  return rawMessage;
}

function showDatabaseError(error: unknown) {
  const message = formatDatabaseError(error);
  console.error('Supabase request failed:', error);
  window.dispatchEvent(new CustomEvent(DATABASE_ERROR_EVENT, { detail: { message } }));
}

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('Supabase returned no data.');
  return data;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function mapProfile(row: DbRow): User {
  const requestedRole = asString(row.requested_role);
  return {
    id: asString(row.id),
    email: asString(row.email),
    name: asString(row.full_name),
    role: (asString(row.role) || 'student') as UserRole,
    requestedRole: requestedRole === 'faculty' || requestedRole === 'admin' ? requestedRole : null,
    department: asString(row.department),
    year: asString(row.year),
    rollNumber: asString(row.roll_number),
    avatar: asString(row.avatar),
    status: (asString(row.status) || 'active') as UserStatus,
    isVerified: Boolean(row.is_verified),
    reputationPoints: asNumber(row.reputation_points),
    createdAt: asString(row.created_at),
    savedDoubts: asStringArray(row.saved_doubts),
  };
}

function mapDoubt(row: DbRow): Doubt {
  return {
    id: asString(row.id),
    title: asString(row.title),
    content: asString(row.content),
    authorId: asString(row.author_id),
    authorName: asString(row.author_name),
    authorRole: (asString(row.author_role) || 'student') as UserRole,
    authorDepartment: asString(row.author_department),
    isAnonymous: Boolean(row.is_anonymous),
    category: asString(row.category) as Category,
    department: asString(row.department),
    subject: asString(row.subject),
    semester: asString(row.semester),
    tags: asStringArray(row.tags),
    votes: asNumber(row.votes),
    upvotedBy: asStringArray(row.upvoted_by),
    createdAt: asString(row.created_at),
    isClosed: Boolean(row.is_closed),
    views: asNumber(row.views),
  };
}

function mapComment(value: unknown): AnswerComment {
  const row = (value ?? {}) as DbRow;
  return {
    id: asString(row.id),
    answerId: asString(row.answerId ?? row.answer_id),
    content: asString(row.content),
    authorId: asString(row.authorId ?? row.author_id),
    authorName: asString(row.authorName ?? row.author_name),
    authorRole: (asString(row.authorRole ?? row.author_role) || 'student') as UserRole,
    createdAt: asString(row.createdAt ?? row.created_at),
  };
}

function mapAnswer(row: DbRow): Answer {
  const commentRows = Array.isArray(row.comments) ? row.comments : [];
  return {
    id: asString(row.id),
    doubtId: asString(row.doubt_id),
    content: asString(row.content),
    authorId: asString(row.author_id),
    authorName: asString(row.author_name),
    authorRole: (asString(row.author_role) || 'student') as UserRole,
    authorDepartment: asString(row.author_department),
    authorAvatar: asString(row.author_avatar),
    isAnonymous: Boolean(row.is_anonymous),
    upvotes: asNumber(row.upvotes),
    upvotedBy: asStringArray(row.upvoted_by),
    correctVotes: asNumber(row.correct_votes),
    incorrectVotes: asNumber(row.incorrect_votes),
    votedCorrectBy: asStringArray(row.voted_correct_by),
    votedIncorrectBy: asStringArray(row.voted_incorrect_by),
    isBestAnswer: Boolean(row.is_best_answer),
    isVerifiedCorrect: Boolean(row.is_verified_correct),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at) || undefined,
    comments: commentRows.map(mapComment),
  };
}

function mapReport(row: DbRow): Report {
  return {
    id: asString(row.id),
    targetType: asString(row.target_type) as Report['targetType'],
    targetId: asString(row.target_id),
    doubtId: asString(row.doubt_id),
    reporterId: asString(row.reporter_id),
    reporterName: asString(row.reporter_name),
    reason: asString(row.reason) as Report['reason'],
    details: asString(row.details),
    status: asString(row.status) as Report['status'],
    createdAt: asString(row.created_at),
  };
}

function mapNotification(row: DbRow): NotificationItem {
  return {
    id: asString(row.id),
    userId: asString(row.user_id),
    type: asString(row.type) as NotificationItem['type'],
    title: asString(row.title),
    message: asString(row.message),
    linkDoubtId: asString(row.link_doubt_id),
    isRead: Boolean(row.is_read),
    createdAt: asString(row.created_at),
  };
}

async function loadOwnProfile(authUser: AuthUser): Promise<User | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const profile = mapProfile({ ...data, email: authUser.email ?? '' });
  if (profile.status !== 'active') {
    await client.auth.signOut();
    currentUser = null;
    notifyStorageChange();
    throw new Error(profile.status === 'blocked'
      ? 'This account has been blocked by an administrator.'
      : 'This account is suspended.');
  }
  return profile;
}

async function loadCommunityData(authUser?: AuthUser | null) {
  const client = getSupabaseClient();
  const [profileResult, doubtResult, answerResult] = await Promise.all([
    client.from('community_profiles').select('*').order('created_at', { ascending: false }),
    client.from('community_doubts').select('*').order('created_at', { ascending: false }),
    client.from('community_answers').select('*').order('created_at', { ascending: true }),
  ]);

  users = requireData(profileResult.data, profileResult.error).map((row) => mapProfile(row as DbRow));
  doubts = requireData(doubtResult.data, doubtResult.error).map((row) => mapDoubt(row as DbRow));
  answers = requireData(answerResult.data, answerResult.error).map((row) => mapAnswer(row as DbRow));
  reports = [];
  notifications = [];
  currentUser = authUser ? await loadOwnProfile(authUser) : null;

  if (currentUser) {
    const [bookmarkResult, notificationResult] = await Promise.all([
      client.from('my_bookmarks').select('doubt_id'),
      client.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
    ]);
    currentUser.savedDoubts = requireData(bookmarkResult.data, bookmarkResult.error)
      .map((row) => asString((row as DbRow).doubt_id));
    notifications = requireData(notificationResult.data, notificationResult.error)
      .map((row) => mapNotification(row as DbRow));
    users = users.map((user) => user.id === currentUser?.id ? currentUser : user);

    if (currentUser.role === 'admin') {
      const [adminProfiles, reportResult] = await Promise.all([
        client.rpc('get_admin_profiles'),
        client.from('admin_reports').select('*').order('created_at', { ascending: false }),
      ]);
      users = requireData(adminProfiles.data, adminProfiles.error).map((row) => mapProfile(row as DbRow));
      reports = requireData(reportResult.data, reportResult.error).map((row) => {
        const mapped = mapReport(row as DbRow);
        mapped.reporterName = asString((row as DbRow).reporter_name);
        return mapped;
      });
    }
  }
  notifyStorageChange();
}

async function handleAuthUser(authUser: AuthUser | null) {
  try {
    await loadCommunityData(authUser);
  } catch (error) {
    showDatabaseError(error);
  }
}

export async function initStorage(): Promise<void> {
  const client = getSupabaseClient();
  if (!authSubscriptionStarted) {
    authSubscriptionStarted = true;
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.dispatchEvent(new Event(PASSWORD_RECOVERY_EVENT));
      }
      void handleAuthUser(session?.user ?? null);
    });
  }
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(error.message);
  await loadCommunityData(data.session?.user ?? null);
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function getUsers(): User[] {
  return users;
}

export async function getAdminUsers(): Promise<User[]> {
  if (currentUser?.role !== 'admin') return [];
  try {
    const { data, error } = await getSupabaseClient().rpc('get_admin_profiles');
    users = requireData(data, error).map((row) => mapProfile(row as DbRow));
    notifyStorageChange();
    return users;
  } catch (error) {
    showDatabaseError(error);
    return [];
  }
}

export async function reviewRoleRequest(userId: string, approve: boolean): Promise<boolean> {
  const succeeded = await writeRpc('review_role_request', {
    p_user_id: userId,
    p_approve: approve,
  });
  if (!succeeded) return false;
  await getAdminUsers();
  return true;
}

export async function saveUsers(updatedUsers: User[]): Promise<boolean> {
  const profile = currentUser && updatedUsers.find((user) => user.id === currentUser?.id);
  if (!profile) throw new Error('Your profile could not be found.');
  return writeRpc('update_my_profile', {
    p_full_name: profile.name,
    p_department: profile.department,
    p_year: profile.year,
    p_roll_number: profile.rollNumber,
    p_avatar: profile.avatar,
  });
}

export function awardReputation(_userId: string, _points: number): void {
  throw new Error('Reputation is managed by secure database operations.');
}

export function isCollegeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.ac\.in$/i.test(email.trim());
}

function authResultError(error: AuthError): string {
  if (/invalid login credentials/i.test(error.message)) return 'Email or password is incorrect.';
  if (/email not confirmed/i.test(error.message)) return 'Confirm your email address before signing in.';
  return error.message;
}

export async function loginCollegeUser(email: string, password: string): Promise<{ success: boolean; message: string }> {
  if (!isCollegeEmail(email)) return { success: false, message: 'Use your college .ac.in email address.' };
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { success: false, message: authResultError(error) };
    if (!data.user) return { success: false, message: 'Supabase did not return an authenticated user.' };
    await loadCommunityData(data.user);
    if (!currentUser) return { success: false, message: 'Your account profile is not ready. Contact an administrator.' };
    return { success: true, message: 'Logged in successfully.' };
  } catch (error) {
    showDatabaseError(error);
    return { success: false, message: error instanceof Error ? error.message : 'Unable to sign in.' };
  }
}

export async function registerCollegeUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  department: string,
  year: string,
  rollNumber: string,
  avatar?: string,
): Promise<{ success: boolean; message: string }> {
  if (!isCollegeEmail(email)) return { success: false, message: 'Use a college email ending in .ac.in.' };
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: name.trim(),
        role,
        department,
        year,
        roll_number: rollNumber.trim(),
        avatar: avatar || '',
      },
    },
  });
  if (error) return { success: false, message: error.message };
  if (data.session && data.user) await loadCommunityData(data.user);
  return {
    success: true,
    message: data.session
      ? 'Account created successfully.'
      : 'A verification code has been sent to your email address.',
  };
}

export async function verifyCollegeSignup(email: string, token: string): Promise<{ success: boolean; message: string }> {
  if (!isCollegeEmail(email)) return { success: false, message: 'Use a college email ending in .ac.in.' };
  const { data, error } = await getSupabaseClient().auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'signup',
  });
  if (error) return { success: false, message: error.message };
  if (!data.user) return { success: false, message: 'The verification code did not return an account.' };
  await loadCommunityData(data.user);
  if (!currentUser) return { success: false, message: 'Your account profile could not be loaded.' };
  return { success: true, message: 'Email verified and account created successfully.' };
}

export async function resendCollegeSignupOtp(email: string): Promise<{ success: boolean; message: string }> {
  if (!isCollegeEmail(email)) return { success: false, message: 'Use a college email ending in .ac.in.' };
  const { error } = await getSupabaseClient().auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });
  return error
    ? { success: false, message: error.message }
    : { success: true, message: 'A new verification code has been sent.' };
}

export async function sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  if (!isCollegeEmail(email)) return { success: false, message: 'Enter a valid college .ac.in email address.' };
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });
  return error
    ? { success: false, message: error.message }
    : { success: true, message: `If an account exists for ${email}, a password reset email has been sent.` };
}

export async function completePasswordReset(password: string): Promise<{ success: boolean; message: string }> {
  if (password.length < 8) return { success: false, message: 'Choose a password with at least 8 characters.' };
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  return error
    ? { success: false, message: error.message }
    : { success: true, message: 'Your password has been updated.' };
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) showDatabaseError(error);
}

export function getDoubts(): Doubt[] {
  return doubts;
}

export function getAnswers(): Answer[] {
  return answers;
}

export function getReports(): Report[] {
  return reports;
}

export function getNotifications(userId: string): NotificationItem[] {
  return notifications.filter((item) => item.userId === userId);
}

function createId(): string {
  return crypto.randomUUID();
}

async function writeRpc(name: string, parameters: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await getSupabaseClient().rpc(name, parameters);
    if (error) throw new Error(error.message);
    await loadCommunityData((await getSupabaseClient().auth.getUser()).data.user);
    return true;
  } catch (error) {
    showDatabaseError(error);
    return false;
  }
}

export async function createDoubt(doubtData: {
  title: string;
  content: string;
  category: Category;
  department: string;
  subject: string;
  semester: string;
  tags: string[];
  isAnonymous: boolean;
}): Promise<Doubt | null> {
  if (!currentUser) throw new Error('Sign in before posting a doubt.');
  const id = createId();
  const succeeded = await writeRpc('create_doubt', { p_id: id, p_data: doubtData });
  return succeeded ? doubts.find((doubt) => doubt.id === id) ?? null : null;
}

export async function toggleUpvoteDoubt(doubtId: string): Promise<void> {
  await writeRpc('toggle_doubt_vote', { p_doubt_id: doubtId });
}

export async function toggleSaveBookmark(doubtId: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseClient().rpc('toggle_bookmark', { p_doubt_id: doubtId });
    if (error) throw new Error(error.message);
    await loadCommunityData((await getSupabaseClient().auth.getUser()).data.user);
    return Boolean(data);
  } catch (error) {
    showDatabaseError(error);
    return false;
  }
}

export async function deleteDoubt(doubtId: string): Promise<boolean> {
  return writeRpc('delete_doubt', { p_doubt_id: doubtId });
}

export async function createAnswer(doubtId: string, content: string, isAnonymous: boolean): Promise<boolean> {
  return writeRpc('create_answer', {
    p_id: createId(),
    p_doubt_id: doubtId,
    p_content: content,
    p_anonymous: isAnonymous,
  });
}

export async function toggleUpvoteAnswer(answerId: string): Promise<void> {
  await writeRpc('toggle_answer_vote', { p_answer_id: answerId, p_vote: 'upvote' });
}

export async function voteAnswerCorrectness(answerId: string, isCorrectVote: boolean): Promise<void> {
  await writeRpc('toggle_answer_vote', {
    p_answer_id: answerId,
    p_vote: isCorrectVote ? 'correct' : 'incorrect',
  });
}

export async function toggleBestAnswer(answerId: string): Promise<void> {
  await writeRpc('toggle_best_answer', { p_answer_id: answerId });
}

export async function toggleAdminVerifiedCorrect(answerId: string): Promise<void> {
  await writeRpc('toggle_answer_verified', { p_answer_id: answerId });
}

export async function addAnswerComment(answerId: string, content: string): Promise<boolean> {
  return writeRpc('add_answer_comment', { p_id: createId(), p_answer_id: answerId, p_content: content });
}

export async function deleteAnswer(answerId: string): Promise<void> {
  await writeRpc('delete_answer', { p_answer_id: answerId });
}

export async function submitReport(reportData: {
  targetType: 'doubt' | 'answer';
  targetId: string;
  doubtId: string;
  reason: 'spam' | 'abuse' | 'fake_info' | 'other';
  details: string;
}): Promise<boolean> {
  return writeRpc('submit_report', {
    p_id: createId(),
    p_target_type: reportData.targetType,
    p_target_id: reportData.targetId,
    p_doubt_id: reportData.doubtId,
    p_reason: reportData.reason,
    p_details: reportData.details,
  });
}

export async function reviewReport(reportId: string, action: 'dismiss' | 'remove_post'): Promise<void> {
  await writeRpc('review_report', { p_report_id: reportId, p_action: action });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await writeRpc('mark_notification_read', { p_notification_id: notificationId });
}

export async function markAllNotificationsRead(_userId: string): Promise<void> {
  await writeRpc('mark_notification_read', { p_notification_id: null });
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
  await writeRpc('update_user_status', { p_user_id: userId, p_status: status });
}

export function getActivityData(): ActivityData[] {
  const days: ActivityData[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    days.push({
      date: key,
      doubts: doubts.filter((doubt) => doubt.createdAt.slice(0, 10) === key).length,
      answers: answers.filter((answer) => answer.createdAt.slice(0, 10) === key).length,
      activeUsers: 0,
    });
  }
  return days;
}

export function getDeptStats(): DepartmentStat[] {
  const departments = new Set([
    ...users.map((user) => user.department),
    ...doubts.map((doubt) => doubt.department),
  ]);
  return Array.from(departments).filter(Boolean).map((department) => ({
    department,
    doubts: doubts.filter((doubt) => doubt.department === department).length,
    answers: answers.filter((answer) => answer.authorDepartment === department).length,
    users: users.filter((user) => user.department === department).length,
  }));
}
