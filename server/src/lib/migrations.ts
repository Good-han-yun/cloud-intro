export const initDbSQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  slogan TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  theme_color TEXT DEFAULT '#3b82f6',
  avatar TEXT DEFAULT '',
  social_links JSONB DEFAULT '[]',
  educations JSONB DEFAULT '[]',
  work_experiences JSONB DEFAULT '[]',
  honors JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  footer TEXT DEFAULT '',
  copyright TEXT DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  progress INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dynamics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT true,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  tech_stack JSONB DEFAULT '[]',
  achievements TEXT DEFAULT '',
  external_link TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  completion_date TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_user_id ON sections(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_dynamics_user_id ON dynamics(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
`;