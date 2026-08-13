import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

// Vercel Serverless 文件系统只读，仅 /tmp 可写
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface Database {
  users: User[];
  profiles: Profile[];
  sections: Section[];
  tasks: Task[];
  dynamics: Dynamic[];
  projects: Project[];
}

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface Profile {
  id: string;
  userId: string;
  nickname: string;
  slogan: string;
  bio: string;
  themeColor: string;
  avatar: string;
  socialLinks: any[];
  educations: any[];
  workExperiences: any[];
  honors: any[];
  skills: any[];
  footer: string;
  copyright: string;
}

interface Section {
  id: string;
  userId: string;
  type: string;
  title: string;
  order: number;
  visible: boolean;
}

interface Task {
  id: string;
  userId: string;
  parentId?: string | null;
  title: string;
  description: string;
  dueDate?: string | null;
  priority: string;
  status: string;
  progress: number;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Dynamic {
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

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  summary: string;
  techStack: string[];
  achievements: string;
  externalLink: string;
  coverImage: string;
  completionDate?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

function getDefaultDb(): Database {
  return {
    users: [],
    profiles: [],
    sections: [],
    tasks: [],
    dynamics: [],
    projects: []
  };
}

function readDb(): Database {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const db = getDefaultDb();
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
      return db;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return getDefaultDb();
  }
}

function writeDb(db: Database): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to write database:', e);
  }
}

export const db = {
  async read(): Promise<Database> {
    return readDb();
  },

  async write(db: Database): Promise<void> {
    writeDb(db);
  },

  generateId(): string {
    return nanoid(12);
  },

  now(): string {
    return new Date().toISOString();
  },

  async findOne<T>(collection: keyof Database, query: (item: T) => boolean): Promise<T | undefined> {
    const data = readDb();
    const items = data[collection] as unknown as T[];
    return items.find(query);
  },

  async findMany<T>(collection: keyof Database, query?: (item: T) => boolean): Promise<T[]> {
    const data = readDb();
    const items = data[collection] as unknown as T[];
    return query ? items.filter(query) : items;
  },

  async create<T>(collection: keyof Database, item: T): Promise<T> {
    const data = readDb();
    const items = data[collection] as unknown as T[];
    items.push(item);
    writeDb(data);
    return item;
  },

  async update<T extends { id: string }>(collection: keyof Database, id: string, updates: Record<string, any>): Promise<T | undefined> {
    const data = readDb();
    const items = data[collection] as unknown as T[];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() } as T;
    writeDb(data);
    return items[index];
  },

  async delete(collection: keyof Database, id: string): Promise<boolean> {
    const data = readDb();
    const items = data[collection] as unknown as { id: string }[];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    writeDb(data);
    return true;
  },

  async deleteMany(collection: keyof Database, query: (item: any) => boolean): Promise<number> {
    const data = readDb();
    const items = data[collection] as unknown as any[];
    const before = items.length;
    const filtered = items.filter(item => !query(item));
    data[collection] = filtered as any;
    writeDb(data);
    return before - filtered.length;
  },

  async count(collection: keyof Database, query?: (item: any) => boolean): Promise<number> {
    const data = readDb();
    const items = data[collection] as unknown as any[];
    return query ? items.filter(query).length : items.length;
  },

  async paginate<T>(collection: keyof Database, query: (item: T) => boolean, page: number, pageSize: number, orderBy?: { field: keyof T; direction: 'asc' | 'desc' }): Promise<{ data: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const data = readDb();
    const items = data[collection] as unknown as T[];
    const filtered = items.filter(query);
    
    if (orderBy) {
      const { field, direction } = orderBy;
      filtered.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return { data: paged, total, page, pageSize, totalPages };
  }
};

export type { User, Profile, Section, Task, Dynamic, Project, Database };
