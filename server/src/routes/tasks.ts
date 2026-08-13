import { Router, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { parentId } = req.query;
    const tasks = await db.findMany<any>(
      'tasks',
      t => t.userId === req.userId && (parentId ? t.parentId === String(parentId) : !t.parentId)
    );
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ success: true, data: tasks });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate, priority, status, progress, isPublic, tags, parentId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: '任务标题为必填项' });
    }

    if (parentId) {
      const parentTask = await db.findOne<any>('tasks', t => t.id === parentId);
      if (!parentTask) {
        return res.status(404).json({ success: false, error: '父任务不存在' });
      }
      if (parentTask.userId !== req.userId) {
        return res.status(403).json({ success: false, error: '无权操作' });
      }
      if (parentTask.parentId) {
        return res.status(400).json({ success: false, error: '任务层级最多三级，无法再添加子任务' });
      }
    }

    const now = db.now();
    const task = await db.create('tasks', {
      id: db.generateId(),
      userId: req.userId!,
      parentId: parentId || null,
      title,
      description: description || '',
      dueDate: dueDate || null,
      priority: priority || 'normal',
      status: status || 'todo',
      progress: progress ?? 0,
      isPublic: isPublic ?? false,
      tags: tags || [],
      createdAt: now,
      updatedAt: now
    });

    return res.json({ success: true, data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await db.findOne<any>('tasks', t => t.id === id);
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    if (task.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作' });
    }

    const allowedUpdates = ['title', 'description', 'dueDate', 'priority', 'status', 'progress', 'isPublic', 'tags'];
    const data: any = {};
    for (const key of allowedUpdates) {
      if (key in req.body) data[key] = req.body[key];
    }

    const updated = await db.update('tasks', id, data);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await db.findOne<any>('tasks', t => t.id === id);
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    if (task.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作' });
    }

    await db.deleteMany('tasks', (t: any) => t.parentId === id);
    await db.delete('tasks', id);

    return res.json({ success: true, message: '任务已删除' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai-decompose', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { goal } = req.body as { goal: string };
    if (!goal) {
      return res.status(400).json({ success: false, error: '目标为必填项' });
    }

    const mockResult = {
      title: goal,
      description: `基于目标"${goal}"的 AI 智能拆解结果`,
      priority: 'important_not_urgent',
      children: [
        {
          title: `【${goal}】第一阶段：基础准备`,
          description: '收集资料、分析现状、制定详细计划',
          priority: 'normal',
          children: [
            { title: '调研相关领域现状', description: '搜集并整理相关资料', priority: 'normal' },
            { title: '制定详细执行计划', description: '分解任务、设定时间节点', priority: 'normal' }
          ]
        },
        {
          title: `【${goal}】第二阶段：核心实施`,
          description: '按计划推进核心工作',
          priority: 'urgent_important',
          children: [
            { title: '完成核心任务', description: '按计划完成主要工作内容', priority: 'urgent_important' },
            { title: '阶段性检查与调整', description: '评估进度、调整方向', priority: 'important_not_urgent' }
          ]
        },
        {
          title: `【${goal}】第三阶段：总结与完善`,
          description: '总结成果、完善细节',
          priority: 'normal',
          children: [
            { title: '成果整理与汇报', description: '整理成果、制作汇报材料', priority: 'normal' },
            { title: '经验总结与反思', description: '总结经验、反思改进点', priority: 'normal' }
          ]
        }
      ]
    };

    return res.json({ success: true, data: mockResult });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { tasks } = req.body as { tasks: any[] };
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ success: false, error: '任务数据格式错误' });
    }

    const createdTasks: any[] = [];

    for (const taskData of tasks) {
      const now = db.now();
      const task = await db.create('tasks', {
        id: db.generateId(),
        userId: req.userId!,
        parentId: null,
        title: taskData.title,
        description: taskData.description || '',
        dueDate: null,
        priority: taskData.priority || 'normal',
        status: 'todo',
        progress: 0,
        isPublic: false,
        tags: taskData.tags || [],
        createdAt: now,
        updatedAt: now
      });
      createdTasks.push(task);

      if (taskData.children) {
        for (const child of taskData.children) {
          const childTask = await db.create('tasks', {
            id: db.generateId(),
            userId: req.userId!,
            parentId: task.id,
            title: child.title,
            description: child.description || '',
            dueDate: null,
            priority: child.priority || 'normal',
            status: 'todo',
            progress: 0,
            isPublic: false,
            tags: child.tags || [],
            createdAt: now,
            updatedAt: now
          });
          createdTasks.push(childTask);

          if (child.children) {
            for (const grandchild of child.children) {
              const grandchildTask = await db.create('tasks', {
                id: db.generateId(),
                userId: req.userId!,
                parentId: childTask.id,
                title: grandchild.title,
                description: grandchild.description || '',
                dueDate: null,
                priority: grandchild.priority || 'normal',
                status: 'todo',
                progress: 0,
                isPublic: false,
                tags: grandchild.tags || [],
                createdAt: now,
                updatedAt: now
              });
              createdTasks.push(grandchildTask);
            }
          }
        }
      }
    }

    return res.json({ success: true, data: createdTasks });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
