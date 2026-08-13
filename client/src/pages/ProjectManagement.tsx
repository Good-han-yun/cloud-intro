import { useState, useEffect } from 'react';
import api from '../api';
import DashboardNavbar from '../components/DashboardNavbar';
import Modal from '../components/Modal';

export default function ProjectManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const fetchProjects = () => {
    api.get('/projects').then(res => setProjects(res.data.data)).catch(() => {});
  };

  useEffect(() => { fetchProjects(); }, []);

  const openNew = () => {
    setEditingProject({ name: '', description: '', summary: '', techStack: [], achievements: '', externalLink: '', coverImage: '', completionDate: '', isPublic: false });
    setShowEditor(true);
  };

  const openEdit = (project: any) => {
    setEditingProject({ ...project, techStack: project.techStack || [] });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (editingProject.id) {
        await api.put(`/projects/${editingProject.id}`, editingProject);
      } else {
        await api.post('/projects', editingProject);
      }
      setShowEditor(false);
      fetchProjects();
    } catch (err: any) { alert(err.response?.data?.error || '保存失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此项目？')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err: any) { alert(err.response?.data?.error || '删除失败'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">项目管理</h1>
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
            + 新增项目
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-16 animate-fade-in">
              <div className="text-5xl mb-4 opacity-50">📁</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">暂无项目</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">点击"新增项目"按钮开始管理您的作品</p>
            </div>
          ) : projects.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm card-hover overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {p.coverImage ? <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" /> :
                  <span className="text-white text-4xl">📁</span>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {p.isPublic ? '公开' : '隐藏'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{p.summary || p.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.techStack?.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">{t}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)} className="text-sm text-blue-600 hover:underline">编辑</button>
                  <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal isOpen={showEditor} onClose={() => setShowEditor(false)} title={editingProject?.id ? '编辑项目' : '新增项目'} size="lg">
        {editingProject && (
          <div className="space-y-3">
            <input type="text" value={editingProject.name}
              onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
              placeholder="项目名称" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white font-medium" />
            <textarea value={editingProject.description}
              onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
              placeholder="项目简介" rows={3} className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <input type="text" value={editingProject.summary}
              onChange={e => setEditingProject({ ...editingProject, summary: e.target.value })}
              placeholder="简介摘要（用于卡片显示）" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <input type="text" value={(editingProject.techStack || []).join(', ')}
              onChange={e => setEditingProject({ ...editingProject, techStack: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="技术栈（逗号分隔）" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <textarea value={editingProject.achievements}
              onChange={e => setEditingProject({ ...editingProject, achievements: e.target.value })}
              placeholder="成果描述" rows={2} className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <input type="text" value={editingProject.externalLink}
              onChange={e => setEditingProject({ ...editingProject, externalLink: e.target.value })}
              placeholder="外部链接" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <input type="date" value={editingProject.completionDate?.split('T')[0] || ''}
              onChange={e => setEditingProject({ ...editingProject, completionDate: e.target.value })}
              className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <input type="text" value={editingProject.coverImage}
              onChange={e => setEditingProject({ ...editingProject, coverImage: e.target.value })}
              placeholder="配图 URL" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editingProject.isPublic}
                onChange={e => setEditingProject({ ...editingProject, isPublic: e.target.checked })} />
              <span>公开项目</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowEditor(false)} className="px-4 py-2 text-gray-600">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">保存</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
