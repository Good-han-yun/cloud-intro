import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import { initDbSQL } from './migrations';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const USE_POSTGRES = !!DATABASE_URL;

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface User {
  id: string; username: string; email: string; password: string;
  avatar?: string; createdAt: string; updatedAt: string;
}
interface Profile {
  id: string; userId: string; nickname: string; slogan: string; bio: string;
  themeColor: string; avatar: string; socialLinks: any[]; educations: any[];
  workExperiences: any[]; honors: any[]; skills: any[]; footer: string; copyright: string;
}
interface Section {
  id: string; userId: string; type: string; title: string; order: number; visible: boolean;
}
interface Task {
  id: string; userId: string; parentId?: string | null; title: string; description: string;
  dueDate?: string | null; priority: string; status: string; progress: number;
  isPublic: boolean; tags: string[]; createdAt: string; updatedAt: string;
}
interface Dynamic {
  id: string; userId: string; title: string; content: string; summary: string;
  tags: string[]; isPublic: boolean; publishedAt: string; updatedAt: string;
}
interface Project {
  id: string; userId: string; name: string; description: string; summary: string;
  techStack: string[]; achievements: string; externalLink: string; coverImage: string;
  completionDate?: string | null; isPublic: boolean; createdAt: string; updatedAt: string;
}
interface Database {
  users: User[]; profiles: Profile[]; sections: Section[];
  tasks: Task[]; dynamics: Dynamic[]; projects: Project[];
}

function getDefaultDb(): Database {
  return { users: [], profiles: [], sections: [], tasks: [], dynamics: [], projects: [] };
}

function readDb(): Database {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      const db = getDefaultDb();
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
      return db;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch { return getDefaultDb(); }
}

function writeDb(db: Database): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) { console.error('Failed to write database:', e); }
}

// ============ PostgreSQL Backend ============
const pool = USE_POSTGRES ? new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.VERCEL ? { rejectUnauthorized: false } : undefined,
  max: process.env.VERCEL ? 1 : 10,
  idleTimeoutMillis: process.env.VERCEL ? 1000 : 30000,
  connectionTimeoutMillis: 5000,
}) : null;

let pgInitialized = false;

async function initPg(): Promise<void> {
  if (pgInitialized || !pool) return;
  try {
    const client = await pool.connect();
    try {
      await client.query(initDbSQL);
      pgInitialized = true;
    } finally { client.release(); }
  } catch (err) {
    console.error('PostgreSQL init failed:', err);
    throw err;
  }
}

function getTableName(collection: string): string {
  const map: Record<string, string> = {
    users: 'users', profiles: 'profiles', sections: 'sections',
    tasks: 'tasks', dynamics: 'dynamics', projects: 'projects',
  };
  return map[collection] || collection;
}

function mapRowToItem(row: Record<string, any>, table: string): Record<string, any> {
  if (!row) return row;
  const result: Record<string, any> = {};
  const jsonArrayFields = ['social_links', 'educations', 'work_experiences', 'honors', 'skills', 'tags', 'tech_stack'];
  for (const key of Object.keys(row)) {
    let camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (camelKey === 'sortOrder') camelKey = 'order';
    let value = row[key];
    if (jsonArrayFields.includes(key) && value) {
      value = typeof value === 'string' ? JSON.parse(value) : value;
    }
    result[camelKey] = value;
  }
  return result;
}

function mapItemToRow(item: Record<string, any>, table: string): Record<string, any> {
  const result: Record<string, any> = {};
  const jsonFields = table === 'profiles' ? ['socialLinks', 'educations', 'workExperiences', 'honors', 'skills']
    : table === 'tasks' ? ['tags']
    : table === 'dynamics' ? ['tags']
    : table === 'projects' ? ['techStack']
    : [];

  for (const key of Object.keys(item)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    let value = item[key];
    if (jsonFields.includes(key) && Array.isArray(value)) {
      value = JSON.stringify(value);
    }
    if (key === 'order') {
      result['sort_order'] = value;
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

function buildInsertSQL(table: string, item: Record<string, any>): { sql: string; values: any[] } {
  const row = mapItemToRow(item, table);
  const columns = Object.keys(row);
  const values = Object.values(row);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  return { sql, values };
}

function buildUpdateSQL(table: string, id: string, updates: Record<string, any>): { sql: string; values: any[] } {
  const row = mapItemToRow({ ...updates, updatedAt: new Date().toISOString() }, table);
  const sets = Object.keys(row).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(row), id];
  const sql = `UPDATE ${table} SET ${sets} WHERE id = $${values.length} RETURNING *`;
  return { sql, values };
}

async function queryAllFromTable<T>(table: string): Promise<T[]> {
  if (!pool) return [];
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM ${table}`);
    return result.rows.map((row) => mapRowToItem(row, table)) as unknown as T[];
  } finally { client.release(); }
}

// ============ Unified Interface ============
export const db = {
  generateId(): string { return nanoid(12); },
  now(): string { return new Date().toISOString(); },

  async read(): Promise<any> {
    if (USE_POSTGRES) {
      await initPg();
      const tables = ['users', 'profiles', 'sections', 'tasks', 'dynamics', 'projects'];
      const result: Record<string, any[]> = {};
      for (const t of tables) {
        result[t] = await queryAllFromTable(t);
      }
      return result;
    }
    return readDb();
  },

  async write(): Promise<void> {
    if (!USE_POSTGRES) writeDb(readDb());
  },

  async findOne<T>(collection: string, query: (item: T) => boolean): Promise<T | undefined> {
    if (USE_POSTGRES) {
      await initPg();
      return (await queryAllFromTable<T>(getTableName(collection))).find(query);
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as T[];
    return items.find(query);
  },

  async findMany<T>(collection: string, query?: (item: T) => boolean): Promise<T[]> {
    if (USE_POSTGRES) {
      await initPg();
      const items = await queryAllFromTable<T>(getTableName(collection));
      return query ? items.filter(query) : items;
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as T[];
    return query ? items.filter(query) : items;
  },

  async create<T>(collection: string, item: T): Promise<T> {
    if (USE_POSTGRES) {
      await initPg();
      const table = getTableName(collection);
      const { sql, values } = buildInsertSQL(table, item as Record<string, any>);
      const client = await pool!.connect();
      try {
        const result = await client.query(sql, values);
        return mapRowToItem(result.rows[0], table) as unknown as T;
      } finally { client.release(); }
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as T[];
    items.push(item);
    writeDb(data);
    return item;
  },

  async update<T extends { id: string }>(collection: string, id: string, updates: Record<string, any>): Promise<T | undefined> {
    if (USE_POSTGRES) {
      await initPg();
      const table = getTableName(collection);
      const { sql, values } = buildUpdateSQL(table, id, updates);
      const client = await pool!.connect();
      try {
        const result = await client.query(sql, values);
        if (result.rows.length === 0) return undefined;
        return mapRowToItem(result.rows[0], table) as unknown as T;
      } finally { client.release(); }
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as T[];
    const index = items.findIndex((item: any) => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() } as T;
    writeDb(data);
    return items[index];
  },

  async delete(collection: string, id: string): Promise<boolean> {
    if (USE_POSTGRES) {
      await initPg();
      const table = getTableName(collection);
      const client = await pool!.connect();
      try {
        const result = await client.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        return result.rowCount > 0;
      } finally { client.release(); }
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as { id: string }[];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    writeDb(data);
    return true;
  },

  async deleteMany(collection: string, query: (item: any) => boolean): Promise<number> {
    if (USE_POSTGRES) {
      await initPg();
      const table = getTableName(collection);
      const items = await queryAllFromTable(table);
      const toDelete = items.filter(query);
      if (toDelete.length === 0) return 0;
      const client = await pool!.connect();
      try {
        const ids = toDelete.map((i: any) => i.id);
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        const result = await client.query(`DELETE FROM ${table} WHERE id IN (${placeholders})`, ids);
        return result.rowCount;
      } finally { client.release(); }
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as any[];
    const before = items.length;
    const filtered = items.filter(item => !query(item));
    data[collection as keyof Database] = filtered as any;
    writeDb(data);
    return before - filtered.length;
  },

  async count(collection: string, query?: (item: any) => boolean): Promise<number> {
    if (USE_POSTGRES) {
      await initPg();
      const items = await queryAllFromTable(getTableName(collection));
      return query ? items.filter(query).length : items.length;
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as any[];
    return query ? items.filter(query).length : items.length;
  },

  async paginate<T>(collection: string, query: (item: T) => boolean, page: number, pageSize: number, orderBy?: { field: keyof T; direction: 'asc' | 'desc' }): Promise<{ data: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
    if (USE_POSTGRES) {
      await initPg();
      const items = await queryAllFromTable<T>(getTableName(collection));
      const filtered = items.filter(query);
      if (orderBy) {
        const { field, direction } = orderBy;
        filtered.sort((a: any, b: any) => {
          const aVal = a[field]; const bVal = b[field];
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      return { data: filtered.slice(start, start + pageSize), total, page, pageSize, totalPages };
    }
    const data = readDb();
    const items = data[collection as keyof Database] as unknown as T[];
    const filtered = items.filter(query);
    if (orderBy) {
      const { field, direction } = orderBy;
      filtered.sort((a: any, b: any) => {
        const aVal = a[field]; const bVal = b[field];
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), total, page, pageSize, totalPages };
  }
};

export default db;