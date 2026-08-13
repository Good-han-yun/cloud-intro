import { Router, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await db.paginate<any>(
      'dynamics',
      d => d.userId === req.userId,
      Number(page),
      Number(pageSize),
      { field: 'publishedAt' as keyof any, direction: 'desc' }
    );
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const dynamic = await db.findOne<any>('dynamics', d => d.id === req.params.id);
    if (!dynamic) {
      return res.status(404).json({ success: false, error: '动态不存在' });
    }
    if (dynamic.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权访问' });
    }
    return res.json({ success: true, data: dynamic });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, summary, tags, isPublic } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: '标题和内容为必填项' });
    }

    const now = db.now();
    const dynamic = await db.create('dynamics', {
      id: db.generateId(),
      userId: req.userId!,
      title,
      content,
      summary: summary || content.slice(0, 100),
      tags: tags || [],
      isPublic: isPublic ?? true,
      publishedAt: now,
      updatedAt: now
    });

    return res.json({ success: true, data: dynamic });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const dynamic = await db.findOne<any>('dynamics', d => d.id === req.params.id);
    if (!dynamic) {
      return res.status(404).json({ success: false, error: '动态不存在' });
    }
    if (dynamic.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作' });
    }

    const allowedUpdates = ['title', 'content', 'summary', 'tags', 'isPublic'];
    const data: any = {};
    for (const key of allowedUpdates) {
      if (key in req.body) data[key] = req.body[key];
    }
    if (req.body.content && !req.body.summary) {
      data.summary = req.body.content.slice(0, 100);
    }

    const updated = await db.update('dynamics', req.params.id, data);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const dynamic = await db.findOne<any>('dynamics', d => d.id === req.params.id);
    if (!dynamic) {
      return res.status(404).json({ success: false, error: '动态不存在' });
    }
    if (dynamic.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作' });
    }
    await db.delete('dynamics', req.params.id);
    return res.json({ success: true, message: '动态已删除' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
