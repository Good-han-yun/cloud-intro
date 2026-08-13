import { useState, useEffect } from 'react';
import api from '../api';
import DashboardNavbar from '../components/DashboardNavbar';
import Modal from '../components/Modal';

const priorityLabels: Record<string, { color: string; label: string }> = {
  urgent_important: { color: 'bg-red-500', label: '紧急重要' },
  important_not_urgent: { color: 'bg-yellow-500', label: '重要不紧急' },
  normal: { color: 'bg-green-500', label: '普通' },
  completed: { color: 'bg-gray-800', label: '已完成' }
};

export default function TaskManagement() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'normal', tags: '', isPublic: false });
  const [aiGoal, setAiGoal] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    api.get('/tasks').then(res => setTasks(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreateTask = async () => {
    try {
      await api.post('/tasks', { ...newTask, tags: newTask.tags.split(',').map(t => t.trim()).filter(Boolean) });
      setShowNewTask(false);
      setNewTask({ title: '', description: '', priority: 'normal', tags: '', isPublic: false });
      fetchTasks();
    } catch (err: any) { alert(err.response?.data?.error || '创建失败'); }
  };

  const handleAIDecompose = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/tasks/ai-decompose', { goal: aiGoal });
      setAiResult(res.data.data);
    } catch (err: any) { alert(err.response?.data?.error || '生成失败'); }
    setAiLoading(false);
  };

  const handleImportTasks = async () => {
    try {
      const tasksToImport = [{ ...aiResult, children: aiResult.children }];
      await api.post('/tasks/import', { tasks: tasksToImport });
      setShowAIDialog(false);
      setAiResult(null);
      setAiGoal('');
      fetchTasks();
      alert('任务已导入');
    } catch (err: any) { alert(err.response?.data?.error || '导入失败'); }
  };

  const handleOpenTask = (task: any) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('确定删除此任务？')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err: any) { alert(err.response?.data?.error || '删除失败'); }
  };

  const handleUpdateTask = async (id: string, updates: any) => {
    try {
      await api.put(`/tasks/${id}`, updates);
      fetchTasks();
      setSelectedTask({ ...selectedTask, ...updates });
    } catch (err: any) { alert(err.response?.data?.error || '更新失败'); }
  };

  const handleAddSubTask = async (parentId: string, level: number) => {
    if (level >= 3) { alert('任务层级最多三级'); return; }
    try {
      await api.post('/tasks', { title: '新子任务', parentId, priority: 'normal' });
      fetchTasks();
      const updated = await api.get('/tasks');
      setSelectedTask(updated.data.data.find((t: any) => t.id === parentId));
    } catch (err: any) { alert(err.response?.data?.error || '添加失败'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">任务管理</h1>
          <div className="flex gap-3">
            <button onClick={() => setShowAIDialog(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg">
              AI 智能拆解
            </button>
            <button onClick={() => setShowNewTask(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
              + 新建主任务
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-gray-500 animate-spin"></div>
            <div className="text-gray-500 dark:text-gray-400 animate-pulse">加载中...</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => {
              const pr = priorityLabels[task.priority] || priorityLabels.normal;
              return (
                <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm card-hover overflow-hidden">
                  <div className={`h-1.5 ${pr.color}`}></div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
                        onClick={() => handleOpenTask(task)}>{task.title}</h3>
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600">⋮</button>
                      </div>
                    </div>
                    {task.dueDate && <p className="text-xs text-gray-500 mb-1">📅 {new Date(task.dueDate).toLocaleDateString()}</p>}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">{pr.label}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${task.status === 'done' ? 'bg-green-100 text-green-700' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {task.status === 'done' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待完成'}
                      </span>
                      {task.isPublic && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">公开</span>}
                      {task.tags?.map((t: string) => <span key={t} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-xs rounded">{t}</span>)}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${task.progress}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>进度: {task.progress}%</span>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:underline">删除</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tasks.length === 0 && !loading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4 opacity-50">✅</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">暂无任务</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">开始创建您的第一个任务，或使用 AI 智能拆解目标</p>
          </div>
        )}
      </main>

      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title="新建主任务">
        <div className="space-y-3">
          <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="任务标题" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
          <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="任务描述（可选）" rows={3} className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
          <div className="flex gap-3">
            <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
              className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:text-white">
              <option value="urgent_important">紧急重要</option>
              <option value="important_not_urgent">重要不紧急</option>
              <option value="normal">普通</option>
            </select>
            <input type="text" value={newTask.tags} onChange={e => setNewTask({ ...newTask, tags: e.target.value })}
              placeholder="标签（逗号分隔）" className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={newTask.isPublic} onChange={e => setNewTask({ ...newTask, isPublic: e.target.checked })} />
            <span>设为公开（仅顶层任务对外可见）</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setShowNewTask(false)} className="px-4 py-2 text-gray-600">取消</button>
          <button onClick={handleCreateTask} className="px-4 py-2 bg-blue-600 text-white rounded">创建</button>
        </div>
      </Modal>

      <Modal isOpen={showAIDialog} onClose={() => { setShowAIDialog(false); setAiResult(null); setAiGoal(''); }} title="AI 智能拆解目标" size="lg">
        {!aiResult ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">输入您的目标，AI 将自动生成三级任务结构</p>
            <textarea value={aiGoal} onChange={e => setAiGoal(e.target.value)}
              rows={3} placeholder="例如：准备期末考试、完成一个 Web 项目、备考英语四级"
              className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <button onClick={handleAIDecompose} disabled={aiLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded disabled:opacity-50">
              {aiLoading ? '生成中...' : '开始拆解'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold mb-2">预览结果</h4>
              <div className="space-y-2 text-sm">
                <div className="font-medium">{aiResult.title}</div>
                {aiResult.children.map((child: any, i: number) => (
                  <div key={i} className="ml-4">
                    <div className="font-medium text-blue-600">├─ {child.title}</div>
                    {child.children?.map((gc: any, j: number) => (
                      <div key={j} className="ml-8 text-gray-500">└─ {gc.title}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAiResult(null)} className="px-4 py-2 text-gray-600">重新生成</button>
              <button onClick={handleImportTasks} className="px-4 py-2 bg-green-600 text-white rounded">一键导入</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showTaskDetail} onClose={() => setShowTaskDetail(false)} title="任务详情" size="lg">
        {selectedTask && (
          <div className="space-y-4">
            <input type="text" value={selectedTask.title}
              onChange={e => setSelectedTask({ ...selectedTask, title: e.target.value })}
              className="w-full px-4 py-2 border rounded font-semibold text-lg dark:bg-gray-700 dark:text-white" />
            <textarea value={selectedTask.description}
              onChange={e => setSelectedTask({ ...selectedTask, description: e.target.value })}
              rows={3} placeholder="任务描述"
              className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">优先级</label>
                <select value={selectedTask.priority}
                  onChange={e => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white">
                  <option value="urgent_important">紧急重要</option>
                  <option value="important_not_urgent">重要不紧急</option>
                  <option value="normal">普通</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">状态</label>
                <select value={selectedTask.status}
                  onChange={e => setSelectedTask({ ...selectedTask, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white">
                  <option value="todo">待完成</option>
                  <option value="in_progress">进行中</option>
                  <option value="done">已完成</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">进度 ({selectedTask.progress}%)</label>
                <input type="range" min="0" max="100" value={selectedTask.progress}
                  onChange={e => setSelectedTask({ ...selectedTask, progress: Number(e.target.value) })}
                  className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">公开</label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={selectedTask.isPublic}
                    onChange={e => setSelectedTask({ ...selectedTask, isPublic: e.target.checked })} />
                  <span className="text-sm">公开</span>
                </label>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">子任务（点击添加）</h4>
              <button onClick={() => handleAddSubTask(selectedTask.id, selectedTask.parentId ? 3 : 2)}
                className="text-sm text-blue-600 hover:underline">+ 添加子任务</button>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button onClick={() => setShowTaskDetail(false)} className="px-4 py-2 text-gray-600">取消</button>
              <button onClick={() => handleUpdateTask(selectedTask.id, {
                title: selectedTask.title, description: selectedTask.description,
                priority: selectedTask.priority, status: selectedTask.status,
                progress: selectedTask.progress, isPublic: selectedTask.isPublic
              })} className="px-4 py-2 bg-blue-600 text-white rounded">保存</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
