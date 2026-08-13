import { useState, useEffect } from 'react';
import api from '../api';
import DashboardNavbar from '../components/DashboardNavbar';
import Modal from '../components/Modal';

export default function DynamicManagement() {
  const [dynamics, setDynamics] = useState<any[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDynamic, setEditingDynamic] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchDynamics = () => {
    api.get('/dynamics').then(res => setDynamics(res.data.data.data || [])).catch(() => {});
  };

  useEffect(() => { fetchDynamics(); }, []);

  const openNew = () => {
    setEditingDynamic({ title: '', content: '', summary: '', tags: [], isPublic: true });
    setPreviewMode(false);
    setShowEditor(true);
  };

  const openEdit = (dynamic: any) => {
    setEditingDynamic({ ...dynamic });
    setPreviewMode(false);
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (editingDynamic.id) {
        await api.put(`/dynamics/${editingDynamic.id}`, editingDynamic);
      } else {
        await api.post('/dynamics', editingDynamic);
      }
      setShowEditor(false);
      fetchDynamics();
    } catch (err: any) { alert(err.response?.data?.error || '保存失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此动态？')) return;
    try {
      await api.delete(`/dynamics/${id}`);
      fetchDynamics();
    } catch (err: any) { alert(err.response?.data?.error || '删除失败'); }
  };

  const stripHtml = (str: string): string => {
    return str.replace(/<[^>]*>/g, '').replace(/<\/[^>]*>/g, '');
  };

  const renderMarkdown = (content: string) => {
    const safe = stripHtml(content);
    return safe
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto my-3 text-sm"><code>$2</code></pre>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">动态管理</h1>
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
            + 撰写新动态
          </button>
        </div>

        <div className="space-y-4">
          {dynamics.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4 opacity-50">📝</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">暂无动态</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">点击右上角"撰写新动态"按钮创建您的第一条动态</p>
          </div>
          ) : dynamics.map(d => (
            <div key={d.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm flex items-start justify-between gap-4 card-hover">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{d.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${d.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {d.isPublic ? '公开' : '私密'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{new Date(d.publishedAt).toLocaleString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{d.summary}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(d)} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">编辑</button>
                <button onClick={() => handleDelete(d.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">删除</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal isOpen={showEditor} onClose={() => setShowEditor(false)} title={editingDynamic?.id ? '编辑动态' : '撰写新动态'} size="lg">
        {editingDynamic && (
          <div className="space-y-4">
            <input type="text" value={editingDynamic.title}
              onChange={e => setEditingDynamic({ ...editingDynamic, title: e.target.value })}
              placeholder="动态标题" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white font-medium" />
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              {previewMode ? (
                <div className="p-4 min-h-[200px] text-gray-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(editingDynamic.content || '') }} />
              ) : (
                <textarea value={editingDynamic.content}
                  onChange={e => setEditingDynamic({ ...editingDynamic, content: e.target.value })}
                  placeholder="支持 Markdown 语法，如 **加粗**、`代码`、```代码块```"
                  rows={10} className="w-full px-4 py-2 bg-transparent dark:bg-gray-700 dark:text-white resize-none" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <input type="text" value={(editingDynamic.tags || []).join(', ')}
                onChange={e => setEditingDynamic({ ...editingDynamic, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="标签（逗号分隔）" className="flex-1 px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:text-white" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingDynamic.isPublic}
                  onChange={e => setEditingDynamic({ ...editingDynamic, isPublic: e.target.checked })} />
                公开
              </label>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setPreviewMode(!previewMode)} className="text-sm text-blue-600 hover:underline">
                {previewMode ? '编辑模式' : '预览'}
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowEditor(false)} className="px-4 py-2 text-gray-600">取消</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">保存</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
