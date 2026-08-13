import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db';
import { AuthRequest, authenticate, JWT_SECRET } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: '用户名、邮箱和密码为必填项' });
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 30) {
      return res.status(400).json({ success: false, error: '用户名长度需在3-30个字符之间' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, error: '用户名只能包含字母、数字和下划线' });
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: '邮箱格式不正确' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: '密码至少需要6个字符' });
    }

    const existingUser = await db.findOne<any>('users', u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名或邮箱已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = db.now();
    const id = db.generateId();

    const user = await db.create('users', {
      id,
      username,
      email,
      password: hashedPassword,
      avatar: '',
      createdAt: now,
      updatedAt: now
    });

    await db.create('profiles', {
      id: db.generateId(),
      userId: user.id,
      nickname: username,
      slogan: '',
      bio: '',
      themeColor: '#3b82f6',
      avatar: '',
      socialLinks: [],
      educations: [],
      workExperiences: [],
      honors: [],
      skills: [],
      footer: '',
      copyright: `© ${new Date().getFullYear()} ${username}`
    });

    const defaultSections = [
      { type: 'hero', title: '首屏名片', order: 0 },
      { type: 'overview', title: '个人概况', order: 1 },
      { type: 'tasks', title: '任务计划', order: 2 },
      { type: 'projects', title: '项目作品', order: 3 },
      { type: 'dynamics', title: '动态', order: 4 }
    ];

    for (const section of defaultSections) {
      await db.create('sections', {
        id: db.generateId(),
        userId: user.id,
        type: section.type,
        title: section.title,
        order: section.order,
        visible: true
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ success: false, error: '账号和密码为必填项' });
    }

    if (typeof account !== 'string' || account.length > 254) {
      return res.status(400).json({ success: false, error: '账号格式不正确' });
    }

    if (typeof password !== 'string') {
      return res.status(400).json({ success: false, error: '密码格式不正确' });
    }

    const user = await db.findOne<any>('users', u => u.username === account || u.email === account);
    if (!user) {
      return res.status(401).json({ success: false, error: '账号或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: '账号或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.findOne<any>('users', u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    return res.json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, createdAt: user.createdAt }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: '当前密码和新密码为必填项' });
    }

    const user = await db.findOne<any>('users', u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: '当前密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update('users', user.id, { password: hashedPassword });

    return res.json({ success: true, message: '密码修改成功' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await db.deleteMany('profiles', (p: any) => p.userId === req.userId);
    await db.deleteMany('sections', (s: any) => s.userId === req.userId);
    await db.deleteMany('tasks', (t: any) => t.userId === req.userId);
    await db.deleteMany('dynamics', (d: any) => d.userId === req.userId);
    await db.deleteMany('projects', (p: any) => p.userId === req.userId);
    await db.delete('users', req.userId!);
    return res.json({ success: true, message: '账号已注销' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
