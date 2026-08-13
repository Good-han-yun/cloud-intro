import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import VisitorNavbar from '../components/VisitorNavbar';
import Modal from '../components/Modal';
import { useTheme } from '../context/ThemeContext';

interface PublicProfile {
  user: { id: string; username: string; avatar: string };
  profile: any;
  sections: any[];
  tasks: any[];
  projects: any[];
  dynamics: any[];
}

const priorityColors: Record<string, { bg: string; label: string }> = {
  urgent_important: { bg: 'bg-red-500', label: '紧急重要' },
  important_not_urgent: { bg: 'bg-yellow-500', label: '重要不紧急' },
  normal: { bg: 'bg-green-500', label: '普通' },
  completed: { bg: 'bg-gray-800', label: '已完成' }
};

export default function VisitorProfile() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { themeColor } = useTheme();

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    api.get(`/public/${username}`)
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.error || '用户不存在'))
      .finally(() => setLoading(false));
  }, [username]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <VisitorNavbar />
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{error || '用户不存在'}</h2>
            <a href="/" className="text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline">返回首页</a>
          </div>
        </div>
      </div>
    );
  }

  const { user, profile, sections, tasks, projects, dynamics } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VisitorNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 sm:space-y-16">
        {sections.map((section) => {
          if (section.type === 'hero') {
            return (
              <section key={section.id} className="scroll-mt-20 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div
                  className="relative rounded-2xl overflow-hidden shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}30 50%, ${themeColor}20 100%)`
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(circle at 30% 50%, ${themeColor}40 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${themeColor}30 0%, transparent 40%)`
                    }}
                  ></div>
                  <div className="relative px-6 py-12 sm:p-16 flex flex-col md:flex-row items-center gap-8">
                    <div className="shrink-0">
                      <div
                        className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center overflow-hidden border-4 transition-transform duration-500 hover:scale-105"
                        style={{ borderColor: themeColor }}
                      >
                        {profile?.avatar ? (
                          <img src={profile.avatar} alt={profile.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-bold" style={{ color: themeColor }}>
                            {(profile?.nickname || user.username).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {profile?.nickname || user.username}
                      </h1>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                        <span
                          className="px-3 py-1 text-xs font-medium bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm"
                          style={{ color: themeColor }}
                        >
                          个人主页
                        </span>
                      </div>
                      {profile?.slogan && (
                        <p className="text-lg text-gray-700 dark:text-gray-300 italic mb-2">{profile.slogan}</p>
                      )}
                      {profile?.bio && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-xl">{profile.bio}</p>
                      )}
                      {profile?.socialLinks?.length > 0 && (
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                          {profile.socialLinks.filter((l: any) => l.visible !== false).map((link: any) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200 hover:scale-110 inline-block"
                            >
                              {link.label || link.type}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button
                          onClick={() => scrollToSection('tasks-section')}
                          className="px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                          style={{ backgroundColor: themeColor }}
                        >
                          浏览动态
                        </button>
                        <button
                          onClick={() => scrollToSection('projects-section')}
                          className="px-5 py-2.5 rounded-lg border-2 font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                          style={{ borderColor: themeColor, color: themeColor }}
                        >
                          查看项目
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === 'overview') {
            return (
              <section key={section.id} className="scroll-mt-20 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-7 rounded-full" style={{ backgroundColor: themeColor }}></span>
                  {section.title || '个人概况'}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { icon: '🎓', color: 'text-blue-500', title: '教育经历', items: profile?.educations, type: 'education' },
                    { icon: '💼', color: 'text-green-500', title: '学生工作经历', items: profile?.workExperiences, type: 'work' },
                    { icon: '🏆', color: 'text-yellow-500', title: '荣誉奖项', items: profile?.honors, type: 'honor' },
                    { icon: '⚡', color: 'text-purple-500', title: '技能标签', items: profile?.skills, type: 'skill' }
                  ].map(card => (
                    <div
                      key={card.type}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover animate-fade-in-up"
                      style={{ animationDelay: '150ms' }}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className={card.color}>{card.icon}</span> {card.title}
                      </h3>
                      {card.items?.length > 0 ? (
                        card.type === 'skill' ? (
                          <div className="flex flex-wrap gap-2">
                            {card.items.map((skill: any, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm transition-all duration-200 hover:scale-105 cursor-default"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {card.items.map((item: any, i: number) => (
                              <div key={i} className={`border-l-2 pl-3 ${
                                card.type === 'education' ? 'border-blue-500' :
                                card.type === 'work' ? 'border-green-500' :
                                'border-yellow-500'
                              }`}>
                                {card.type === 'education' && (
                                  <>
                                    <div className="font-medium text-gray-900 dark:text-white">{item.school}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.degree} {item.major && `· ${item.major}`}</div>
                                  </>
                                )}
                                {card.type === 'work' && (
                                  <>
                                    <div className="font-medium text-gray-900 dark:text-white">{item.organization}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.position}</div>
                                  </>
                                )}
                                {card.type === 'honor' && (
                                  <>
                                    <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.issuer} {item.date && `· ${item.date}`}</div>
                                  </>
                                )}
                                {item.description && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</div>}
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-3xl mb-2 opacity-30">{card.icon}</div>
                          <p className="text-gray-400 text-sm">暂未填写信息</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (section.type === 'tasks') {
            if (tasks.length === 0) return null;
            return (
              <section key={section.id} id="tasks-section" className="scroll-mt-20 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-7 rounded-full" style={{ backgroundColor: themeColor }}></span>
                  {section.title || '任务计划清单'}
                </h2>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max md:grid md:grid-cols-2 lg:grid-cols-3 md:min-w-0">
                    {tasks.map((task, i) => {
                      const pc = priorityColors[task.priority] || priorityColors.normal;
                      return (
                        <div
                          key={task.id}
                          onClick={() => setShowTaskModal(true)}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden min-w-[280px] card-hover animate-fade-in-up"
                          style={{ animationDelay: `${250 + i * 50}ms` }}
                        >
                          <div className={`h-1.5 ${pc.bg}`}></div>
                          <div className="p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">{task.title}</h3>
                            {task.dueDate && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">📅 {new Date(task.dueDate).toLocaleDateString()}</p>}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {task.tags?.map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${task.progress}%`, backgroundColor: themeColor }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                              <span>{pc.label}</span>
                              <span>{task.progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === 'projects') {
            if (projects.length === 0) return null;
            return (
              <section key={section.id} id="projects-section" className="scroll-mt-20 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-7 rounded-full" style={{ backgroundColor: themeColor }}></span>
                  {section.title || '项目作品'}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {projects.map((project, i) => (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm card-hover overflow-hidden animate-fade-in-up"
                      style={{ animationDelay: `${350 + i * 50}ms` }}
                    >
                      {project.coverImage && (
                        <div className="h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <img
                            src={project.coverImage}
                            alt={project.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{project.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{project.summary || project.description}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {project.techStack?.map((tech: string) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded transition-colors duration-200 hover:bg-blue-200"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        {project.completionDate && <p className="text-xs text-gray-400">完成于 {new Date(project.completionDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (section.type === 'dynamics') {
            if (dynamics.length === 0) return null;
            return (
              <section key={section.id} className="scroll-mt-20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-7 rounded-full" style={{ backgroundColor: themeColor }}></span>
                  {section.title || '动态'}
                </h2>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max md:grid md:grid-cols-2 md:min-w-0">
                    {dynamics.map((d, i) => (
                      <div
                        key={d.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm card-hover p-5 min-w-[280px] animate-fade-in-up"
                        style={{ animationDelay: `${450 + i * 50}ms` }}
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(d.publishedAt).toLocaleDateString()}</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{d.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{d.summary}</p>
                        <div className="flex flex-wrap gap-1">
                          {d.tags?.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center mt-6">
                  <button
                    className="px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                    style={{ borderColor: themeColor, color: themeColor }}
                    onClick={() => (window.location.href = `/u/${username}/dynamic`)}
                  >
                    查看全部动态 →
                  </button>
                </div>
              </section>
            );
          }

          return null;
        })}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {profile?.footer && <p className="mb-2">{profile.footer}</p>}
          <p>{profile?.copyright || `© ${new Date().getFullYear()} ${user.username}`}</p>
        </div>
      </footer>

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="任务详情">
        <p className="text-gray-600 dark:text-gray-300">完整任务拆解、子任务详情仅主人登录后可见。</p>
      </Modal>
    </div>
  );
}