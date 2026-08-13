import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import profileRoutes from './routes/profile';
import taskRoutes from './routes/tasks';
import dynamicRoutes from './routes/dynamics';
import projectRoutes from './routes/projects';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: '尝试次数过多，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : process.env.VERCEL
      ? true
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5175'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/public', apiLimiter, publicRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/tasks', apiLimiter, taskRoutes);
app.use('/api/dynamics', apiLimiter, dynamicRoutes);
app.use('/api/projects', apiLimiter, projectRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Vercel Serverless 环境下不需要 listen，由平台托管
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
