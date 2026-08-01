export type UserRole = 'student' | 'senior' | 'faculty' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'blocked';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  year: string; // '1st Year', '2nd Year', '3rd Year', '4th Year', 'PG/Master', 'Faculty'
  rollNumber: string;
  avatar: string;
  status: UserStatus;
  isVerified: boolean;
  reputationPoints: number;
  createdAt: string;
  savedDoubts: string[]; // doubt IDs
}

export type Category = 
  | 'Subject' 
  | 'Semester' 
  | 'Department' 
  | 'Programming' 
  | 'Assignments' 
  | 'Exams' 
  | 'Notes';

export interface Doubt {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorDepartment: string;
  isAnonymous: boolean;
  category: Category;
  department: string;
  subject: string;
  semester: string; // 'Sem 1', 'Sem 2', etc.
  tags: string[];
  votes: number;
  upvotedBy: string[];
  createdAt: string;
  isClosed: boolean;
  views: number;
}

export interface AnswerComment {
  id: string;
  answerId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
}

export interface Answer {
  id: string;
  doubtId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorDepartment: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  upvotes: number;
  upvotedBy: string[];
  correctVotes: number;
  incorrectVotes: number;
  votedCorrectBy: string[];
  votedIncorrectBy: string[];
  isBestAnswer: boolean;
  isVerifiedCorrect: boolean; // Admin marked
  createdAt: string;
  updatedAt?: string;
  comments: AnswerComment[];
}

export type ReportType = 'spam' | 'abuse' | 'fake_info' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

export interface Report {
  id: string;
  targetType: 'doubt' | 'answer';
  targetId: string;
  doubtId: string; // associated doubt ID for quick navigation
  reporterId: string;
  reporterName: string;
  reason: ReportType;
  details: string;
  status: ReportStatus;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'new_answer' | 'new_comment' | 'best_answer' | 'verified_correct' | 'admin_alert';
  title: string;
  message: string;
  linkDoubtId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityData {
  date: string;
  doubts: number;
  answers: number;
  activeUsers: number;
}

export interface DepartmentStat {
  department: string;
  doubts: number;
  answers: number;
  users: number;
}
