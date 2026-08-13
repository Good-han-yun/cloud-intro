import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

interface UserCard {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  slogan: string;
  bio: string;
  themeColor: string;
  hasPublicContent: boolean;
  publicStats: { tasks: number; projects: number; dynamics: number };
}

const SQUIRCLE_CLASSES = [
  'card-squircle-1',
  'card-squircle-2',
  'card-squircle-3',
  'card-squircle-4',
  'card-squircle-5',
  'card-squircle-6',
];

const FLOAT_CLASSES = ['cloud-float-1', 'cloud-float-2', 'cloud-float-3'];

const BG_CLOUDS = [
  { top: '5%', size: 120, duration: 45, delay: 0, opacity: 0.7 },
  { top: '12%', size: 80, duration: 60, delay: -15, opacity: 0.5 },
  { top: '20%', size: 100, duration: 50, delay: -30, opacity: 0.6 },
  { top: '35%', size: 140, duration: 70, delay: -10, opacity: 0.4 },
  { top: '50%', size: 90, duration: 55, delay: -40, opacity: 0.5 },
  { top: '65%', size: 110, duration: 65, delay: -20, opacity: 0.45 },
  { top: '78%', size: 70, duration: 40, delay: -50, opacity: 0.55 },
];

export default function HomePage() {
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { themeColor } = useTheme();

  useEffect(() => {
    setLoading(true);
    api.get('/public/explore/list')
      .then(res => {
        const list = res.data?.data || [];
        setUsers(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return u.nickname.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      (u.slogan && u.slogan.toLowerCase().includes(term)) ||
      (u.bio && u.bio.toLowerCase().includes(term));
  });

  const getSquircle = useMemo(() => (index: number) => SQUIRCLE_CLASSES[index % SQUIRCLE_CLASSES.length], []);
  const getFloat = useMemo(() => (index: number) => FLOAT_CLASSES[index % FLOAT_CLASSES.length], []);
  const getFloatDelay = useMemo(() => (index: number) => `${(index * 1.3) % 5}s`, []);

  return (
    <div className="min-h-screen sky-bg relative overflow-hidden">
      {BG_CLOUDS.map((cloud, i) => (
        <div
          key={i}
          className="absolute pointer-events-none cloud-bg-drift"
          style={{
            top: cloud.top,
            width: cloud.size,
            height: cloud.size * 0.5,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
            opacity: cloud.opacity,
          }}
        >
          <div
            className="w-full h-full bg-white rounded-full"
            style={{
              boxShadow: `
                ${cloud.size * 0.2}px ${cloud.size * 0.05}px 0 -5px white,
                -${cloud.size * 0.15}px ${cloud.size * 0.1}px 0 -8px white,
                ${cloud.size * 0.1}px -${cloud.size * 0.08}px 0 -3px white
              `
            }}
          />
        </div>
      ))}

      <header className="sticky top-0 z-50 relative">
        <div className="bg-white/30 backdrop-blur-xl border-b border-white/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
                  ☁️
                </div>
                <span className="text-xl font-bold text-gray-800">云简介</span>
              </Link>
              <nav className="flex items-center gap-3">
                <Link to="/login" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white/50 hover:bg-white/70 rounded-full transition-all backdrop-blur-sm">
                  登录
                </Link>
                <Link to="/register" className="px-5 py-2 text-sm font-medium text-white rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}>
                  注册
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-5xl animate-float" style={{ animationDelay: '0s' }}>☁️</span>
              <span className="text-4xl animate-float" style={{ animationDelay: '0.5s' }}>🌈</span>
              <span className="text-5xl animate-float" style={{ animationDelay: '1s' }}>✨</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-800 mb-4 drop-shadow-sm">
            发现有趣的人
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            探索每个人的个人空间，展示他们的学习成果、项目作品和思想动态
          </p>
          <div className="max-w-lg mx-auto relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索用户名、昵称或个人简介..."
              className="w-full px-6 py-4 pl-14 rounded-full bg-white/70 backdrop-blur-md border-2 border-white/80 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/50 focus:bg-white/90 transition-all shadow-lg"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">
              🔍
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-2">
                <div className={`cloud-card ${SQUIRCLE_CLASSES[i % 6]} p-8 animate-pulse`}>
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200/60"></div>
                    <div className="h-5 bg-gray-200/60 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200/60 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200/60 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 relative z-10">
            <div className="text-7xl mb-6 animate-float">☁️</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">
              {searchTerm ? '没有找到相关用户' : '还没有公开的个人空间'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? '试试其他关键词吧' : '成为第一个创建个人空间的人'}
            </p>
            {!searchTerm && (
              <Link to="/register" className="inline-block px-8 py-4 text-white rounded-full font-medium shadow-xl transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}>
                创建我的空间
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
            {filteredUsers.map((user, index) => (
              <div key={user.id} className="py-4">
                <Link
                  to={`/u/${user.username}`}
                  className={`group block cloud-card ${getSquircle(index)} ${getFloat(index)} p-8 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl`}
                  style={{ animationDelay: getFloatDelay(index) }}
                >
                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shadow-lg transition-transform group-hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${user.themeColor}, ${user.themeColor}bb)`,
                          boxShadow: `0 4px 20px ${user.themeColor}40`
                        }}
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-white">
                            {user.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                          {user.nickname}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                      </div>
                    </div>

                    {user.slogan && (
                      <p className="text-sm text-gray-700 italic mb-2 line-clamp-1">"{user.slogan}"</p>
                    )}
                    {user.bio && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{user.bio}</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      {user.publicStats.dynamics > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {user.publicStats.dynamics} 动态
                        </span>
                      )}
                      {user.publicStats.tasks > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/80 text-green-700 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          {user.publicStats.tasks} 任务
                        </span>
                      )}
                      {user.publicStats.projects > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 text-purple-700 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          {user.publicStats.projects} 项目
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ background: user.themeColor }}
                  />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 text-center text-sm text-gray-500 relative z-10">
        <p>© 2026 云简介 · 每个人的个人空间 ☁️</p>
      </footer>
    </div>
  );
}
