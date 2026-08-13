# 云简介 - Monorepo 项目

## 项目结构

```
cloud-intro/
├── client/     # 前端：React + TypeScript + Vite + TailwindCSS
├── server/     # 后端：Node.js + Express + TypeScript + Prisma
├── shared/     # 共享类型定义
├── .env.example
└── package.json
```

## 快速开始

```bash
# 安装所有依赖
npm install

# 开发模式（同时启动前端和后端）
npm run dev

# 仅启动前端
npm run dev:client

# 仅启动后端
npm run dev:server
```

## 技术栈

- **前端**：React 18、TypeScript、Vite、TailwindCSS、React Router、Axios
- **后端**：Node.js、Express、TypeScript、Prisma、JWT、bcryptjs
- **共享**：TypeScript 类型定义
