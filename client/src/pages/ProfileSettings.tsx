import { useState, useEffect } from 'react';
import api from '../api';
import DashboardNavbar from '../components/DashboardNavbar';
import { useTheme } from '../context/ThemeContext';

export default function ProfileSettings() {
  const { setThemeColor } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.get('/profile').then(res => setProfile(res.data.data)).catch(() => {});
    api.get('/profile/sections').then(res => setSections(res.data.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile', profile);
      if (profile.themeColor) setThemeColor(profile.themeColor);
      alert('保存成功');
    } catch (err: any) {
      alert(err.response?.data?.error || '保存失败');
    }
    setSaving(false);
  };

  const handleSectionReorder = async (newSections: any[]) => {
    setSections(newSections);
    await api.put('/profile/sections/order', { sections: newSections });
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/profile/ai-generate', { prompt: aiPrompt });
      setAiResult(res.data.data.content);
    } catch (err: any) {
      alert(err.response?.data?.error || '生成失败');
    }
    setAiLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResult).then(() => alert('已复制到剪贴板'));
  };

  const addItem = (key: string) => {
    const newItem = { id: Date.now().toString() };
    setProfile({ ...profile, [key]: [...(profile[key] || []), newItem] });
  };

  const removeItem = (key: string, id: string) => {
    setProfile({ ...profile, [key]: profile[key].filter((i: any) => i.id !== id) });
  };

  const updateItem = (key: string, id: string, updates: any) => {
    setProfile({
      ...profile,
      [key]: profile[key].map((i: any) => i.id === id ? { ...i, ...updates } : i)
    });
  };

  if (!profile) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-500 animate-spin"></div>
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">加载中...</div>
      </div>
    </div>
  );

  const fieldLabels: Record<string, string> = {
    school: '学校', degree: '学历', major: '专业', startDate: '开始日期', endDate: '结束日期', description: '描述',
    organization: '组织', position: '职务', title: '奖项名称', issuer: '颁发机构', date: '获奖日期'
  };

  const tabs = [
    { id: 'basic', label: '基础信息' },
    { id: 'education', label: '教育/工作/荣誉' },
    { id: 'skills', label: '技能标签' },
    { id: 'sections', label: '板块排序' },
    { id: 'ai', label: 'AI 文稿生成' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">个人资料设置</h1>

        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">头像 URL</label>
                <input type="text" value={profile.avatar || ''} onChange={e => setProfile({ ...profile, avatar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">昵称</label>
                <input type="text" value={profile.nickname || ''} onChange={e => setProfile({ ...profile, nickname: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slogan</label>
                <input type="text" value={profile.slogan || ''} onChange={e => setProfile({ ...profile, slogan: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">自我介绍</label>
                <textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">主题色</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map(c => (
                    <button key={c} onClick={() => setProfile({ ...profile, themeColor: c })}
                      className={`w-8 h-8 rounded-full border-2 ${profile.themeColor === c ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">社交链接</label>
                {(profile.socialLinks || []).map((link: any) => (
                  <div key={link.id} className="flex gap-2 mb-2">
                    <select value={link.type} onChange={e => updateItem('socialLinks', link.id, { type: e.target.value })}
                      className="px-2 py-2 border rounded dark:bg-gray-700 dark:text-white">
                      <option value="email">邮箱</option>
                      <option value="github">Github</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="custom">自定义</option>
                    </select>
                    <input type="text" value={link.label} onChange={e => updateItem('socialLinks', link.id, { label: e.target.value })}
                      placeholder="标签" className="flex-1 px-2 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                    <input type="text" value={link.url} onChange={e => updateItem('socialLinks', link.id, { url: e.target.value })}
                      placeholder="URL" className="flex-1 px-2 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                    <button onClick={() => removeItem('socialLinks', link.id)} className="px-2 py-2 text-red-500">删除</button>
                  </div>
                ))}
                <button onClick={() => addItem('socialLinks')} className="text-sm text-blue-600 hover:underline">+ 添加社交链接</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">页脚签名</label>
                <input type="text" value={profile.footer || ''} onChange={e => setProfile({ ...profile, footer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">版权文字</label>
                <input type="text" value={profile.copyright || ''} onChange={e => setProfile({ ...profile, copyright: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {saving ? '保存中...' : '保存更改'}
            </button>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-6">
            {[
              { key: 'educations', label: '教育经历', fields: ['school', 'degree', 'major', 'startDate', 'endDate', 'description'] },
              { key: 'workExperiences', label: '学生工作经历', fields: ['organization', 'position', 'startDate', 'endDate', 'description'] },
              { key: 'honors', label: '荣誉奖项', fields: ['title', 'issuer', 'date', 'description'] }
            ].map(section => (
              <div key={section.key} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">{section.label}</h3>
                {(profile[section.key] || []).map((item: any) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {section.fields.map(field => (
                        <div key={field}>
                          <label className="block text-xs text-gray-500 mb-1">{fieldLabels[field] || field}</label>
                          <input type="text" value={item[field] || ''} onChange={e => updateItem(section.key, item.id, { [field]: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => removeItem(section.key, item.id)} className="mt-2 text-sm text-red-500 hover:underline">删除</button>
                  </div>
                ))}
                <button onClick={() => addItem(section.key)} className="text-sm text-blue-600 hover:underline">+ 添加{section.label}</button>
              </div>
            ))}
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {saving ? '保存中...' : '保存更改'}
            </button>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover">
            <h3 className="font-semibold mb-4">技能标签</h3>
            {(profile.skills || []).map((skill: any) => (
              <div key={skill.id} className="flex gap-2 mb-2">
                <input type="text" value={skill.name} onChange={e => updateItem('skills', skill.id, { name: e.target.value })}
                  placeholder="技能名称" className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                <button onClick={() => removeItem('skills', skill.id)} className="px-3 text-red-500">删除</button>
              </div>
            ))}
            <button onClick={() => addItem('skills')} className="text-sm text-blue-600 hover:underline">+ 添加技能</button>
            <div className="mt-4">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                {saving ? '保存中...' : '保存更改'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">板块排序与显示</h3>
              <button onClick={async () => {
                await api.post('/profile/sections/reset');
                location.reload();
              }} className="text-sm text-blue-600 hover:underline">一键恢复默认排序</button>
            </div>
            <div className="space-y-2">
              {sections.map((section, idx) => (
                <div key={section.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="cursor-move text-gray-400">⋮⋮</span>
                  <span className="flex-1 font-medium">{section.title}</span>
                  <span className="text-xs text-gray-500">顺序: {idx + 1}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={section.visible}
                      onChange={e => handleSectionReorder(sections.map((s, _i) => s.id === section.id ? { ...s, visible: e.target.checked } : s))} />
                    <span className="text-sm">{section.visible ? '显示' : '隐藏'}</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">提示：拖拽调整顺序功能开发中，当前可通过修改顺序值来调整。</p>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover space-y-4">
            <h3 className="font-semibold">AI 文稿生成</h3>
            <div>
              <label className="block text-sm font-medium mb-2">快捷需求标签（点击填充）</label>
              <div className="flex flex-wrap gap-2">
                {['入党积极分子思想事迹', '评优评先事迹材料', '学生干部工作事迹', '科创竞赛事迹'].map(tag => (
                  <button key={tag} onClick={() => setAiPrompt(tag)}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">自定义需求</label>
              <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="描述需要生成的文稿用途、文体、侧重点、行文风格等要求。示例：撰写一份个人年度总结、撰写竞赛项目申报简介、撰写思想汇报" />
            </div>
            <button onClick={handleGenerateAI} disabled={aiLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {aiLoading ? '生成中...' : '读取已有资料并 AI 生成'}
            </button>
            {aiResult && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">生成结果</label>
                  <button onClick={copyToClipboard} className="text-sm text-blue-600 hover:underline">复制文本</button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 min-h-[200px]">
                  {aiResult}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
