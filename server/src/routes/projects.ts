import { Router, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await db.findMany<any>('projects', p => p.userId === req.userId);
    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ success: true, data: projects });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, summary, techStack, achievements, externalLink, coverImage, completionDate, isPublic } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: '项目名称为必填项' });
    }

    const now = db.now();
    const project = await db.create('projects', {
      id: db.generateId(),
      userId: req.userId!,
      name,
      description: description || '',
      summary: summary || (description ? description.slice(0, 100) : ''),
      techStack: techStack || [],
      achievements: achievements || '',
      externalLink: externalLink || '',
      coverImage: coverImage || '',
      completionDate: completionDate || null,
      isPublic: isPublic ?? false,
      createdAt: now,
      updatedAt: now
    });

    return res.json({ success: true, data: project });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const project = await db.findOne<any>('projects', p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    if (project.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作' });
    }

    const allowedUpdates = ['name', 'description', 'summary', 'techStack', 'achievements', 'externalLink', 'coverImage', 'completionDate', 'isPublic'];
    const data: any = {};
    for (const key of allowedUpdates) {
      if (key in req.body) data[key] = req.body[key];
    }

    const updated = await db.update('projects', req.params.id, data);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const project = await db.findOne<any>('projects', p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    if (project.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作' });
    }
    await db.delete('projects', req.params.id);
    return res.json({ success: true, message: '项目已删除' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
