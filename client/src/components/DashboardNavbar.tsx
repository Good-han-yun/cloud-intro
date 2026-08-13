import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard/profile', label: '个人资料' },
    { path: '/dashboard/task', label: '任务管理' },
    { path: '/dashboard/dynamic', label: '动态管理' },
    { path: '/dashboard/project', label: '项目管理' },
    { path: '/dashboard/style', label: '外观设置' },
    { path: '/dashboard/account', label: '账号设置' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-6 overflow-x-auto">
            <span className="text-lg font-bold text-blue-600 shrink-0 transition-colors duration-300 hover:text-blue-700">云简介 · 后台</span>
            <div className="flex items-center space-x-1 shrink-0">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => window.open('/u/' + (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).username : ''), '_blank')}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all duration-200 hover:scale-105 whitespace-nowrap"
            >
              查看公开主页 ↗
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200 hover:scale-105 whitespace-nowrap"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}