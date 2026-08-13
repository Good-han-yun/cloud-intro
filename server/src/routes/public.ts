import { Router, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/explore/list', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.findMany<any>('users', () => true);
    const results = [];

    for (const user of users) {
      const profile = await db.findOne<any>('profiles', p => p.userId === user.id);
      if (!profile) continue;

      const hasPublicContent =
        (await db.findMany<any>('tasks', t => t.userId === user.id && t.isPublic && !t.parentId)).length > 0 ||
        (await db.findMany<any>('projects', p => p.userId === user.id && p.isPublic)).length > 0 ||
        (await db.findMany<any>('dynamics', d => d.userId === user.id && d.isPublic)).length > 0;

      results.push({
        id: user.id,
        username: user.username,
        nickname: profile.nickname || user.username,
        avatar: profile.avatar || user.avatar,
        slogan: profile.slogan,
        bio: profile.bio,
        themeColor: profile.themeColor || '#3b82f6',
        hasPublicContent,
        publicStats: {
          tasks: (await db.findMany<any>('tasks', t => t.userId === user.id && t.isPublic && !t.parentId)).length,
          projects: (await db.findMany<any>('projects', p => p.userId === user.id && p.isPublic)).length,
          dynamics: (await db.findMany<any>('dynamics', d => d.userId === user.id && d.isPublic)).length
        }
      });
    }

    results.sort((a, b) => {
      const score = (u: any) => u.publicStats.tasks + u.publicStats.projects + u.publicStats.dynamics;
      return score(b) - score(a);
    });

    return res.json({ success: true, data: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:username', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    const user = await db.findOne<any>('users', u => u.username === username);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const profile = await db.findOne<any>('profiles', p => p.userId === user.id);
    const sections = await db.findMany<any>('sections', s => s.userId === user.id && s.visible);
    
    sections.sort((a, b) => a.order - b.order);

    const publicTasks = await db.findMany<any>('tasks', t => t.userId === user.id && t.isPublic && !t.parentId);
    const publicProjects = await db.findMany<any>('projects', p => p.userId === user.id && p.isPublic);
    const publicDynamics = await db.findMany<any>('dynamics', d => d.userId === user.id && d.isPublic);

    publicTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    publicProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    publicDynamics.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return res.json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, avatar: user.avatar },
        profile: profile || null,
        sections,
        tasks: publicTasks.map(t => ({
          id: t.id, title: t.title, dueDate: t.dueDate,
          priority: t.priority, status: t.status, progress: t.progress,
          tags: t.tags, isPublic: t.isPublic
        })),
        projects: publicProjects.map(p => ({
          id: p.id, name: p.name, summary: p.summary,
          techStack: p.techStack, achievements: p.achievements,
          externalLink: p.externalLink, coverImage: p.coverImage,
          completionDate: p.completionDate, isPublic: p.isPublic
        })),
        dynamics: publicDynamics.map(d => ({
          id: d.id, title: d.title, summary: d.summary, tags: d.tags, publishedAt: d.publishedAt
        }))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:username/dynamics', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { page = 1, pageSize = 10, tag } = req.query;

    const user = await db.findOne<any>('users', u => u.username === username);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const result = await db.paginate<any>(
      'dynamics',
      (d: any) => {
        if (d.userId !== user.id || !d.isPublic) return false;
        if (tag && !d.tags.includes(tag as string)) return false;
        return true;
      },
      Number(page),
      Number(pageSize),
      { field: 'publishedAt' as keyof any, direction: 'desc' }
    );

    const allDynamics = await db.findMany<any>('dynamics', d => d.userId === user.id && d.isPublic);
    const allTags = [...new Set(allDynamics.flatMap(d => d.tags))];

    return res.json({
      success: true,
      data: { ...result, tags: allTags }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:username/dynamics/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username, id } = req.params;

    const user = await db.findOne<any>('users', u => u.username === username);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const dynamic = await db.findOne<any>('dynamics', d => d.id === id);
    if (!dynamic) {
      return res.status(404).json({ success: false, error: '动态不存在' });
    }

    if (dynamic.userId !== user.id) {
      return res.status(404).json({ success: false, error: '动态不存在' });
    }

    if (!dynamic.isPublic && req.userId !== user.id) {
      return res.status(403).json({ success: false, error: '无权访问' });
    }

    return res.json({ success: true, data: dynamic });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
