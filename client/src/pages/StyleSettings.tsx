import DashboardNavbar from '../components/DashboardNavbar';
import { useTheme } from '../context/ThemeContext';

export default function StyleSettings() {
  const { mode, themeColor, toggleMode, setMode, setThemeColor } = useTheme();

  const colors = [
    { name: '蓝色', value: '#3b82f6' },
    { name: '紫色', value: '#8b5cf6' },
    { name: '粉色', value: '#ec4899' },
    { name: '绿色', value: '#10b981' },
    { name: '橙色', value: '#f59e0b' },
    { name: '红色', value: '#ef4444' },
    { name: '青色', value: '#06b6d4' },
    { name: '靛蓝', value: '#6366f1' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">外观设置</h1>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover">
          <h2 className="font-semibold mb-4">主题配色</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {colors.map(c => (
              <button key={c.value} onClick={() => setThemeColor(c.value)}
                className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${themeColor === c.value ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }}
                title={c.name} />
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover">
          <h2 className="font-semibold mb-4">显示模式</h2>
          <div className="flex gap-4">
            <button onClick={() => setMode('light')}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${mode === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="text-2xl mb-1">☀️</div>
              <div className="font-medium">浅色模式</div>
            </button>
            <button onClick={() => setMode('dark')}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${mode === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200'}`}>
              <div className="text-2xl mb-1">🌙</div>
              <div className="font-medium">暗色模式</div>
            </button>
          </div>
          <button onClick={toggleMode} className="mt-4 text-sm text-blue-600 hover:underline">
            切换到{mode === 'light' ? '暗色' : '浅色'}模式
          </button>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover">
          <h2 className="font-semibold mb-4">模板选择</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20 cursor-pointer">
              <div className="text-sm font-medium text-blue-700">默认模板</div>
              <div className="text-xs text-gray-500 mt-1">当前使用</div>
            </div>
            <div className="p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <div className="text-sm font-medium text-gray-500">模板 2</div>
              <div className="text-xs text-gray-400 mt-1">即将推出</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
