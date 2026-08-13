import { Router, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await db.findOne<any>('profiles', p => p.userId === req.userId);
    return res.json({ success: true, data: profile || null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const allowedFields = ['nickname', 'slogan', 'bio', 'themeColor', 'avatar', 'socialLinks', 'educations', 'workExperiences', 'honors', 'skills', 'footer', 'copyright'];
    const sanitizedData: any = {};
    for (const key of allowedFields) {
      if (key in data) sanitizedData[key] = data[key];
    }

    if (sanitizedData.nickname !== undefined && (typeof sanitizedData.nickname !== 'string' || sanitizedData.nickname.length > 50)) {
      return res.status(400).json({ success: false, error: '昵称长度不能超过50个字符' });
    }
    if (sanitizedData.bio !== undefined && typeof sanitizedData.bio !== 'string') {
      return res.status(400).json({ success: false, error: '个人简介格式不正确' });
    }
    if (sanitizedData.slogan !== undefined && typeof sanitizedData.slogan !== 'string') {
      return res.status(400).json({ success: false, error: '口号格式不正确' });
    }
    if (sanitizedData.themeColor !== undefined && !/^#[0-9a-fA-F]{6}$/.test(sanitizedData.themeColor)) {
      return res.status(400).json({ success: false, error: '主题颜色格式不正确' });
    }
    if (sanitizedData.footer !== undefined && typeof sanitizedData.footer !== 'string') {
      return res.status(400).json({ success: false, error: '页脚格式不正确' });
    }
    if (sanitizedData.copyright !== undefined && typeof sanitizedData.copyright !== 'string') {
      return res.status(400).json({ success: false, error: '版权信息格式不正确' });
    }
    if (sanitizedData.socialLinks !== undefined && !Array.isArray(sanitizedData.socialLinks)) {
      return res.status(400).json({ success: false, error: '社交链接格式不正确' });
    }
    if (sanitizedData.educations !== undefined && !Array.isArray(sanitizedData.educations)) {
      return res.status(400).json({ success: false, error: '教育经历格式不正确' });
    }
    if (sanitizedData.workExperiences !== undefined && !Array.isArray(sanitizedData.workExperiences)) {
      return res.status(400).json({ success: false, error: '工作经历格式不正确' });
    }
    if (sanitizedData.honors !== undefined && !Array.isArray(sanitizedData.honors)) {
      return res.status(400).json({ success: false, error: '荣誉奖项格式不正确' });
    }
    if (sanitizedData.skills !== undefined && !Array.isArray(sanitizedData.skills)) {
      return res.status(400).json({ success: false, error: '技能标签格式不正确' });
    }
    const existing = await db.findOne<any>('profiles', p => p.userId === req.userId);

    if (existing) {
      const updated = await db.update('profiles', existing.id, sanitizedData);
      return res.json({ success: true, data: updated });
    } else {
      const newProfile = await db.create('profiles', {
        id: db.generateId(),
        userId: req.userId!,
        nickname: sanitizedData.nickname || '',
        slogan: sanitizedData.slogan || '',
        bio: sanitizedData.bio || '',
        themeColor: sanitizedData.themeColor || '#3b82f6',
        avatar: sanitizedData.avatar || '',
        socialLinks: sanitizedData.socialLinks || [],
        educations: sanitizedData.educations || [],
        workExperiences: sanitizedData.workExperiences || [],
        honors: sanitizedData.honors || [],
        skills: sanitizedData.skills || [],
        footer: sanitizedData.footer || '',
        copyright: sanitizedData.copyright || ''
      });
      return res.json({ success: true, data: newProfile });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sections', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const sections = await db.findMany<any>('sections', s => s.userId === req.userId);
    sections.sort((a, b) => a.order - b.order);
    return res.json({ success: true, data: sections });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/sections/order', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sections } = req.body as { sections: { id: string; order: number; visible: boolean }[] };
    for (const section of sections) {
      await db.update('sections', section.id, { order: section.order, visible: section.visible });
    }
    return res.json({ success: true, message: '板块排序已更新' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sections/reset', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const defaultOrder: Record<string, number> = { hero: 0, overview: 1, tasks: 2, projects: 3, dynamics: 4 };
    const sections = await db.findMany<any>('sections', s => s.userId === req.userId);
    for (const section of sections) {
      await db.update('sections', section.id, { order: defaultOrder[section.type] ?? section.order, visible: true });
    }
    return res.json({ success: true, message: '已恢复默认排序' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai-generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body as { prompt: string };
    const profile = await db.findOne<any>('profiles', p => p.userId === req.userId);
    const projects = await db.findMany<any>('projects', p => p.userId === req.userId && p.isPublic);

    const contextData = {
      educations: profile?.educations || [],
      workExperiences: profile?.workExperiences || [],
      honors: profile?.honors || [],
      skills: profile?.skills || [],
      projects: projects.map((p: any) => ({ name: p.name, description: p.description, techStack: p.techStack }))
    };

    const mockResult = `基于您的资料，为您生成以下文稿：

${prompt ? `需求：${prompt}\n\n` : ''}
【生成内容示例】

尊敬的评审老师：

您好！我是${profile?.nickname || '学生'}，一名热爱学习、积极进取的学子。

${contextData.educations.length > 0 ? `\n【教育背景】\n${contextData.educations.map((e: any) => `- ${e.school} - ${e.degree}${e.major ? '（' + e.major + '）' : ''}`).join('\n')}` : ''}

${contextData.workExperiences.length > 0 ? `\n【学生工作经历】\n${contextData.workExperiences.map((w: any) => `- ${w.organization} - ${w.position}`).join('\n')}` : ''}

${contextData.honors.length > 0 ? `\n【荣誉奖项】\n${contextData.honors.map((h: any) => `- ${h.title} - ${h.issuer}`).join('\n')}` : ''}

${contextData.projects.length > 0 ? `\n【项目经验】\n${contextData.projects.map((p: any) => `- ${p.name}：${p.description}`).join('\n')}` : ''}

${contextData.skills.length > 0 ? `\n【技能特长】\n${contextData.skills.map((s: any) => s.name).join('、')}` : ''}

——（此为 AI 生成示例，实际内容需对接 AI 服务后生成）`;

    return res.json({ success: true, data: { content: mockResult, context: contextData } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
