export type BugStatus = 'open' | 'solved';
export type UserRole = 'Admin' | 'Member';

export interface Bug {
  id: string;
  title: string;
  description: string;
  status: BugStatus;
  priorityLevel?: string;
  category?: string;
  authorName?: string;
  createdAt: string; // ISO string or formatted date
  solverName?: string;
  solvedAt?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  // Legacy / convenience mappings for backwards compatibility with UI components
  photoUrl?: string;
  videoUrl?: string;
  photoDriveId?: string;
  videoDriveId?: string;
  solvedBy?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  tags?: string[];
  createdBy?: string;
  createdByEmail?: string;
  isUploading?: boolean;
  uploadProgress?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  accessToken?: string;
}

export interface BugComment {
  id: string;
  bugId: string;
  text: string;
  authorName: string;
  authorEmail?: string;
  authorPhoto?: string;
  audioUrl?: string;
  createdAt: string;
}

export type NotificationType = 'comment' | 'new_bug' | 'solved_bug';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  bugId: string;
  bugTitle?: string;
  authorName?: string;
  authorPhoto?: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationSettings {
  commentNotifications: boolean;
  newEntryNotifications: boolean;
  problemSolveNotifications: boolean;
  soundEnabled: boolean;
}
