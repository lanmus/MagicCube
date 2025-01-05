# 使用官方 Node.js 16 镜像作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制项目文件
COPY . .

# 创建上传目录和日志目录
RUN mkdir -p public/uploads logs

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"] 