import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import VisitorNavbar from '../components/VisitorNavbar';

interface Dynamic {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  publishedAt: string;
}

export default function VisitorDynamics() {
  const { username } = useParams<{ username: string }>();
  const [dynamics, setDynamics] = useState<Dynamic[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!username) return;
    setLoading(true);
    api.get(`/public/${username}/dynamics`, { params: { page, pageSize: 10, tag: selectedTag || undefined } })
      .then(res => {
        setDynamics(res.data.data.data);
        setTotalPages(res.data.data.totalPages);
        setTags(res.data.data.tags);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [username, page, selectedTag]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VisitorNavbar />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">全部公开动态</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => { setSelectedTag(''); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 hover:scale-105 ${
              !selectedTag
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            全部
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => { setSelectedTag(tag); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 hover:scale-105 ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-gray-500 animate-spin"></div>
            <div className="text-gray-500 dark:text-gray-400 animate-pulse">加载中...</div>
          </div>
        ) : dynamics.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4 opacity-50">📝</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">暂无动态</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">该用户还没有发布任何公开动态</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dynamics.map((d, i) => (
              <Link
                key={d.id}
                to={`/u/${username}/dynamic/${d.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{new Date(d.publishedAt).toLocaleDateString()}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{d.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{d.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {d.tags.map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 px-3">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105"
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  );
}