# Better Auth 认证系统文档

## 概述

本项目使用Better Auth 实现认证系统，目前只支持Github和Google登录。系统采用jwt+session的混合认证方案，其中：

- JWT采用引用模式设计，只存储用户ID和会话ID，不存储具体的用户信息
- Session存储在数据库中，包含用户的详细信息和会话状态
- 这种设计既保证了认证的高效性，又提供了完整的会话管理能力

## 认证原理

### JWT + Session 混合认证

Better Auth 采用 JWT + Session 的混合认证方案，结合了两者的优点：
- JWT：无状态、安全性高
- Session：可控性强、可随时撤销

认证流程如下：

1. **OAuth 登录流程**：
   ```mermaid
   sequenceDiagram
      用户->>前端: 点击 GitHub 登录
      前端->>GitHub: 重定向到 GitHub OAuth
      GitHub-->>前端: 返回授权码 code
      前端->>后端: 发送 code
      后端->>GitHub: 使用 code 换取 access_token
      GitHub-->>后端: 返回 access_token
      后端->>GitHub: 获取用户信息
      GitHub-->>后端: 返回用户数据
      后端->>数据库: 创建/更新用户记录
      后端-->>前端: 返回 JWT + Session ID
   ```

2. **会话管理**：
   ```mermaid
   sequenceDiagram
      participant 前端
      participant 中间件
      participant 数据库
      
      前端->>中间件: 请求接口（带 JWT）
      中间件->>中间件: 验证 JWT 有效性
      中间件->>数据库: 验证 Session 是否有效
      数据库-->>中间件: Session 状态
      中间件-->>前端: 响应请求/401错误
   ```

### 关键技术点

1. **JWT 结构（采用引用模式）**：
   ```typescript
   {
     // Header（标准JWT头部）
     alg: "HS256",
     typ: "JWT",
     
     // Payload（仅存储标识信息）
     sub: "用户ID",        // 用户唯一标识
     sessionId: "会话ID",  // 关联的session记录
     iat: 发布时间,       // token发布时间
     exp: 过期时间,       // token过期时间
     
     // Signature
     // 使用 JWT_SECRET 签名
   }
   ```
   
   > 注意：JWT采用引用模式设计，只存储用户ID和会话ID这两个必要的标识信息。
   > 用户的其他信息（如用户名、权限等）都存储在数据库的session表中，
   > 这样既保证了token的轻量，又提供了更好的安全性和可控性。

2. **Session 存储**：
   - 存储位置：PostgreSQL 数据库
   - 关键字段：
     ```typescript
     {
       id: string;         // 会话ID
       userId: string;     // 用户ID
       token: string;      // JWT Token Hash
       expiresAt: Date;    // 过期时间
       userAgent: string;  // 用户代理
       ipAddress: string;  // IP地址
     }
     ```

3. **安全机制**：
   - JWT 有效期较短（默认15分钟）
   - Session 有效期较长（默认7天）
   - 每次请求都会验证：
     1. JWT 签名是否有效
     2. JWT 是否过期
     3. Session 是否存在且有效
     4. Session 是否被撤销

4. **自动续期**：
   ```mermaid
   sequenceDiagram
      前端->>中间件: 请求接口
      中间件->>中间件: 检查 JWT 是否接近过期
      中间件->>中间件: 如果快过期，生成新 JWT
      中间件-->>前端: 在响应头中返回新 JWT
      前端->>前端: 更新存储的 JWT
   ```

### 数据流转

1. **登录时**：
   ```typescript
   // 1. 创建 Session
   const session = await db.insert(sessions).values({
     userId: user.id,
     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
   });

   // 2. 生成 JWT
   const jwt = sign(
     { sub: user.id, sessionId: session.id },
     process.env.JWT_SECRET,
     { expiresIn: '15m' }
   );
   ```

2. **请求验证**：
   ```typescript
   // 1. 解析 JWT
   const payload = verify(token, process.env.JWT_SECRET);

   // 2. 验证 Session
   const session = await db.query.sessions.findFirst({
     where: eq(sessions.id, payload.sessionId)
   });

   if (!session || session.expiresAt < new Date()) {
     throw new Error('Unauthorized');
   }
   ```

## 关键路径

```json
{
  "config": "src/lib/auth.ts",           // 核心配置
  "client": "src/lib/auth-client.ts",    // 客户端工具，客户端组件里获取session等
  "api": "src/app/api/auth/[...all]",    // API 路由，用于处理login等请求
  "pages": "src/app/[locale]/login"      // 登录页面
}
```

## 初始化命令

```bash
# 1. 安装 better-auth
npm install better-auth

# 2. 初始化认证系统，生成必要的表结构和配置文件
npx better-auth init

# 3. 选择数据库类型
? Select your database type › 
  SQLite
❯ PostgreSQL
  MySQL

# 4. 选择 ORM
? Select your ORM › 
  Prisma
❯ Drizzle
  Kysely

# 5. 确认生成的文件
✓ Generated auth configuration
✓ Generated database schema
✓ Generated API routes
```

生成的文件结构：
```
src/
├── lib/
│   ├── auth.ts         # 认证配置
│   └── auth-client.ts  # 客户端工具
├── app/
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts  # API 路由
└── db/
    └── schema.ts       # 包含认证表结构
```

## 数据模型

认证系统使用以下数据表：（better-auth生成，必须符合这个格式）

1. `user`: 用户基本信息
   - id, name, email, emailVerified, image

2. `account`: 第三方账号关联
   - id, accountId, providerId, userId, tokens

3. `session`: 用户会话
   - id, token, userId, expiresAt

4. `verification`: 验证信息
   - id, identifier, token, expires

## 使用方式

1. 登录组件示例：
   ```typescript
   import { signIn, useSession } from "@/lib/auth-client";
   
   export default function LoginButton() {
     const handleLogin = async () => {
       await signIn("github");
     };
     
     return <button onClick={handleLogin}>登录</button>;
   }
   ```

2. 客户端组件中获取会话：
   ```typescript
   'use client'
   import { useSession } from "@/lib/auth-client";
   
   export default function UserPanel() {
     // 获取会话数据
     const { data, status } = useSession();
     
     if (status === 'loading') {
       return <div>加载中...</div>;
     }
     
     if (!data) {
       return <div>未登录</div>;
     }
     
     return (
       <div>
         <img src={data.user.image} alt="avatar" />
         <span>{data.user.name}</span>
         <span>{data.user.email}</span>
       </div>
     );
   }
   ```

3. 受保护组件包装：
   ```typescript
   'use client'
   import { useSession } from "@/lib/auth-client";
   import { useRouter } from "next/navigation";
   
   export default function ProtectedComponent() {
     const { data, status } = useSession();
     const router = useRouter();
     
     // 处理加载状态
     if (status === 'loading') {
       return <div>加载中...</div>;
     }
     
     // 未登录重定向
     if (!data) {
       router.push('/login');
       return null;
     }
     
     return <div>受保护的内容</div>;
   }
   ```

## 环境变量

需要配置以下环境变量：
```env
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
JWT_SECRET=xxx
```

## 相关文档

- [Better Auth 文档](https://better-auth.dev)
- [Next.js 认证文档](https://nextjs.org/docs/authentication)
