# Magic Cube 产品管理系统

Magic Cube 是一个现代化的产品管理系统，专注于商品素材的管理、选择和下载功能。系统采用 Node.js 和 Express 框架构建，提供了完整的用户认证、商品管理、素材选择和下载等功能。

## 项目特点

- 🔐 完整的用户认证系统
- 📦 商品和素材管理
- 🎯 个性化素材选择
- 💾 安全的文件下载
- 📊 数据统计和分析
- 🚀 高性能缓存支持
- 📝 完整的日志记录
- 🔍 API 文档支持

## 技术栈

### 后端
- Node.js + Express
- MySQL 数据库
- Redis 缓存
- JWT 认证
- Winston 日志

### 前端
- Bootstrap 5
- 响应式设计
- 现代化 UI/UX

### 开发工具
- Jest 测试框架
- ESLint 代码规范
- Docker 容器化
- Git 版本控制

## 系统架构

### 核心模块

1. **用户管理模块**
   - 用户注册和登录
   - 权限控制
   - 用户信息管理

2. **商品管理模块**
   - 商品信息管理
   - 商品分类
   - 素材关联

3. **素材模块**
   - 素材上传
   - 素材分类
   - 素材预览

4. **选择系统**
   - 素材选择
   - 选择记录
   - 选择验证

5. **下载系统**
   - 下载链接生成
   - 文件打包
   - 下载统计

6. **数据统计模块**
   - 使用统计
   - 下载分析
   - 性能监控

### 数据流

```
用户 -> 认证 -> 商品浏览 -> 素材选择 -> 生成下载 -> 文件获取
```

## 目录结构

```
project/
├── src/
│   ├── controllers/    # 业务逻辑控制器
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── middleware/     # 中间件
│   ├── config/         # 配置文件
│   ├── utils/          # 工具函数
│   └── __tests__/      # 测试文件
├── public/             # 静态资源
│   └── uploads/        # 上传文件存储
├── logs/               # 日志文件
├── docs/              # 项目文档
└── docker/            # Docker 配置
```

## API 接口

### 用户相关
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录
- GET `/api/auth/profile` - 获取用户信息

### 商品相关
- GET `/api/products` - 获取商品列表
- GET `/api/products/:id` - 获取商品详情
- POST `/api/products` - 创建商品
- PATCH `/api/products/:id` - 更新商品
- DELETE `/api/products/:id` - 删除商品

### 素材相关
- GET `/api/materials` - 获取素材列表
- POST `/api/materials/upload` - 上传素材
- GET `/api/materials/:id` - 获取素材详情
- DELETE `/api/materials/:id` - 删除素材

### 选择相关
- POST `/api/selections` - 创建选择
- GET `/api/selections` - 获取选择列表
- PATCH `/api/selections/:id` - 更新选择
- POST `/api/selections/:id/complete` - 完成选择

### 下载相关
- POST `/api/downloads/:selectionId/generate-link` - 生成下载链接
- GET `/api/downloads/:token` - 下载文件
- GET `/api/downloads/history` - 获取下载历史
- GET `/api/downloads/stats` - 获取下载统计

## 数据模型

### User（用户）
- id: 用户ID
- username: 用户名
- email: 邮箱
- password: 密码（加密）
- role: 角色
- status: 状态

### Product（商品）
- id: 商品ID
- name: 商品名称
- description: 描述
- spuCode: 商品编码
- status: 状态
- modules: 关联模块

### MaterialModule（材料模块）
- id: 模块ID
- name: 模块名称
- type: 类型
- subType: 子类型
- materials: 素材列表

### UserSelection（用户选择）
- id: 选择ID
- userId: 用户ID
- productId: 商品ID
- status: 状态
- selections: 选择详情

## 安全特性

1. **认证安全**
   - JWT 令牌认证
   - 密码加密存储
   - 会话管理

2. **数据安全**
   - SQL 注入防护
   - XSS 防护
   - CSRF 防护

3. **文件安全**
   - 文件类型验证
   - 大小限制
   - 访问权限控制

## 性能优化

1. **缓存策略**
   - Redis 缓存热点数据
   - 静态资源缓存
   - 查询缓存

2. **数据库优化**
   - 索引优化
   - 连接池管理
   - 查询优化

3. **应用优化**
   - 异步处理
   - 负载均衡
   - 资源压缩

## 部署说明

详细的部署说明请参考 [DOCKER.md](DOCKER.md) 文件。

## 开发指南

1. **环境准备**
   ```bash
   npm install
   ```

2. **开发模式**
   ```bash
   npm run dev
   ```

3. **运行测试**
   ```bash
   npm test
   ```

4. **构建生产**
   ```bash
   npm run build
   ```

## 测试覆盖

- 单元测试
- 集成测试
- 端到端测试

## 监控和日志

- 性能监控
- 错误追踪
- 访问日志
- 操作日志

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 版本历史

- v1.0.0 - 初始版本
  - 基础功能实现
  - Docker 支持
  - 完整文档 