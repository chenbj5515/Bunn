# Drizzle ORM 配置文档

## 概述

本项目使用 Drizzle ORM 作为数据库 ORM，搭配 PostgreSQL 数据库。

## 关键路径

```json
{
  "schema": "src/db/schema.ts",      // 数据库模式定义
  "migrations": "drizzle/",          // 数据库迁移文件
  "config": "drizzle.config.ts"      // Drizzle 配置文件
}
```

## 核心文件说明

### 配置文件 (drizzle.config.ts)

```typescript
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 数据库模式 (src/db/schema.ts)

主要数据表：

1. **用户相关**
   - `user`: 用户基本信息
   - `account`: 第三方账号关联
   - `session`: 用户会话
   - `verification`: 验证信息

2. **业务相关**
   - `articles`: 文章内容
   - `exams`: 考试信息
   - `exam_results`: 考试结果
   - `user_subscription`: 用户订阅
   - `user_action_logs`: 用户行为日志

### 迁移文件 (drizzle/)

- `0000_freezing_meltdown.sql`: 初始架构
- `0001_even_shockwave.sql`: 架构更新

## 使用方式

1. 数据库连接：
   ```typescript
   import { drizzle } from 'drizzle-orm/neon-http';
   import * as schema from './schema';
   
   export const db = drizzle(process.env.DATABASE_URL!, { schema });
   ```

2. 数据库操作：
   ```typescript
   // 查询
   const users = await db.select().from(schema.user);
   
   // 插入
   const newUser = await db.insert(schema.user).values({
     name: 'John',
     email: 'john@example.com'
   });
   ```

## 命令行工具

```bash
# 生成迁移文件
npm run db:generate

# 执行迁移
npm run db:migrate

# 启动 Drizzle Studio
npm run db:studio
```

## 相关文档

- [Drizzle ORM 文档](https://orm.drizzle.team)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

## 注意事项

1. 模式变更：
   - 修改 `schema.ts` 后需要生成迁移文件
   - 确保迁移文件的顺序正确

2. 环境变量：
   - 确保 `DATABASE_URL` 在环境变量中正确配置
   - 开发和生产环境使用不同的数据库连接 