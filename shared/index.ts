export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  nickname: string;
  slogan: string;
  bio: string;
  themeColor: string;
  avatar: string;
  socialLinks: SocialLink[];
  educations: Education[];
  workExperiences: WorkExperience[];
  honors: Honor[];
  skills: Skill[];
  footer: string;
  copyright: string;
}

export interface SocialLink {
  id: string;
  type: 'email' | 'github' | 'twitter' | 'linkedin' | 'custom';
  label: string;
  url: string;
  visible: boolean;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface WorkExperience {
  id: string;
  organization: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Honor {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
}

export type SectionType = 'hero' | 'overview' | 'tasks' | 'projects' | 'dynamics';

export interface Section {
  id: string;
  userId: string;
  type: SectionType;
  title: string;
  order: number;
  visible: boolean;
}

export type TaskPriority = 'urgent_important' | 'important_not_urgent' | 'normal' | 'completed';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  parentId?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  isPublic: boolean;
  tags: string[];
  children?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Dynamic {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  isPublic: boolean;
  publishedAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  summary: string;
  techStack: string[];
  achievements: string;
  externalLink: string;
  coverImage: string;
  completionDate: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
