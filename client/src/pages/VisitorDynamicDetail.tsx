import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import VisitorNavbar from '../components/VisitorNavbar';

export default function VisitorDynamicDetail() {
  const { username, id } = useParams<{ username: string; id: string }>();
  const [dynamic, setDynamic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/public/${username}/dynamics/${id}`)
      .then(res => setDynamic(res.data.data))
      .catch(err => setError(err.response?.data?.error || '动态不存在'))
      .finally(() => setLoading(false));
  }, [id, username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-500 animate-spin"></div>
          <div className="text-gray-500 dark:text-gray-400 animate-pulse">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <VisitorNavbar />
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{error}</h2>
            <Link to={`/u/${username}`} className="text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline">
              返回主页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stripHtml = (str: string): string => {
    return str.replace(/<[^>]*>/g, '').replace(/<\/[^>]*>/g, '');
  };

  const renderContent = (content: string) => {
    const safe = stripHtml(content);
    return safe
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VisitorNavbar />
      <main className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        <Link to={`/u/${username}`} className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block transition-all duration-200 hover:translate-x-[-2px]">
          ← 返回主页
        </Link>
        {dynamic && (
          <article className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm card-hover animate-fade-in-up">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{dynamic.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <span>{new Date(dynamic.publishedAt).toLocaleDateString()}</span>
              <div className="flex gap-1">
                {dynamic.tags?.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderContent(dynamic.content) }}
            />
          </article>
        )}
      </main>
    </div>
  );
}