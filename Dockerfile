# 使用官方 Node.js 16 镜像作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 设置国内镜像源（Node.js 和 npm）
RUN npm config set registry https://registry.npmmirror.com

# 添加 sharp 的国内镜像加速
ENV SHARP_DIST_BASE_URL=https://npmmirror.com/mirrors/sharp-libvips/

# 安装必要的系统依赖（避免 sharp 安装失败）
RUN apk add --no-cache \
    g++ \
    make \
    python3 \
    vips-dev

# 复制 package.json 和 package-lock.json（若存在）
COPY package*.json ./

# 安装项目依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建上传目录和日志目录，并设置权限
RUN mkdir -p public/uploads logs && \
    chmod -R 755 public/uploads logs

# 设置环境变量（生产环境）
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3000

# 设置启动命令
CMD ["npm", "start"]
