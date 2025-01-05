# Docker 部署教程

本文档将指导您如何使用 Docker 部署 Magic Cube 项目。

## 前置要求

1. 安装 Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# CentOS
sudo yum install docker docker-compose

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker
```

2. 确保系统已安装 Git
```bash
# Ubuntu/Debian
sudo apt install git

# CentOS
sudo yum install git
```

## 部署步骤

### 1. 克隆项目

```bash
git clone https://github.com/lanmus/MagicCube.git
cd project
```

### 2. 配置环境变量

1. 复制环境变量模板文件：
```bash
cp .env.example .env
```

2. 修改 `.env` 文件中的配置：
```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=2k699fw4
DB_NAME=magic_cube

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=100mb

# 跨域配置
CORS_ORIGINS=http://localhost:8080,http://localhost:3000

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs
```

### 3. 构建 Docker 镜像

```bash
# 构建应用镜像
docker build -t magic-cube-app .
```

### 4. 启动服务

使用 docker-compose 启动所有服务：

```bash
docker-compose up -d
```

这将启动以下服务：
- Node.js 应用 (magic-cube-app)
- MySQL 数据库
- Redis 缓存服务

### 5. 验证部署

1. 检查服务状态：
```bash
docker-compose ps
```

2. 查看应用日志：
```bash
docker-compose logs -f app
```

3. 访问应用：
- 网页界面：http://localhost:3000
- API文档：http://localhost:3000/api-docs

## 服务管理

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 查看日志
```bash
# 查看所有服务的日志
docker-compose logs

# 查看特定服务的日志
docker-compose logs app
docker-compose logs mysql
docker-compose logs redis

# 实时查看日志
docker-compose logs -f
```

## 数据备份

### 备份数据库
```bash
# 创建备份目录
mkdir -p backups

# 备份数据库
docker-compose exec mysql mysqldump -u root -p magic_cube > backups/backup_$(date +%Y%m%d).sql
```

### 恢复数据库
```bash
# 恢复数据库
docker-compose exec -T mysql mysql -u root -p magic_cube < backups/backup_20240105.sql
```

## 常见问题

### 1. 容器无法启动

检查日志：
```bash
docker-compose logs app
```

常见原因：
- 环境变量配置错误
- 端口被占用
- 数据库连接失败

解决方案：
1. 检查 `.env` 文件配置
2. 确保所需端口未被占用
3. 确保数据库服务正常运行

### 2. 数据库连接失败

检查：
1. 确保 MySQL 容器正在运行
2. 验证数据库配置信息
3. 检查网络连接

### 3. 文件上传失败

检查：
1. 确保 `UPLOAD_DIR` 目录存在且有正确的权限
2. 检查磁盘空间是否充足
3. 验证文件大小是否超过 `MAX_FILE_SIZE` 限制

## 升级指南

1. 拉取最新代码：
```bash
git pull origin main
```

2. 重新构建镜像：
```bash
docker-compose build app
```

3. 更新服务：
```bash
docker-compose up -d --no-deps app
```

## 监控和维护

### 监控容器状态
```bash
# 查看容器状态
docker stats

# 查看容器资源使用情况
docker-compose top
```

### 清理资源
```bash
# 清理未使用的镜像
docker image prune

# 清理未使用的卷
docker volume prune

# 清理整个系统
docker system prune
```

## 安全建议

1. 定期更新依赖包和 Docker 镜像
2. 使用强密码并定期更换
3. 限制容器的资源使用
4. 配置防火墙规则
5. 启用日志监控
6. 定期备份数据

## 性能优化

1. 配置 Node.js 内存限制：
```yaml
# docker-compose.yml
services:
  app:
    environment:
      NODE_OPTIONS: "--max-old-space-size=2048"
```

2. 优化 MySQL 配置：
```yaml
services:
  mysql:
    command: 
      - --max_connections=1000
      - --innodb_buffer_pool_size=1G
```

3. 配置 Redis 缓存：
```yaml
services:
  redis:
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## 支持和反馈

如果您在部署过程中遇到任何问题，请：
1. 查看应用日志
2. 检查配置文件
3. 参考常见问题解决方案
4. 提交 Issue 到项目仓库

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。 
