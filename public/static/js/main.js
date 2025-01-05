// API基础URL
const API_BASE_URL = '/api/v1';

// 工具函数：发送API请求
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        credentials: 'include'
    });

    if (!response.ok) {
        if (response.status === 401) {
            // 未认证，清除token并跳转到登录页
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }

        const error = await response.json();
        throw new Error(error.message || '请求失败');
    }

    return response.json();
}

// 用户认证状态管理
class Auth {
    static isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token) {
        localStorage.setItem('token', token);
    }

    static clearToken() {
        localStorage.removeItem('token');
    }

    static async getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const response = await fetchAPI('/users/me');
            return response.data.user;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }

    static async logout() {
        try {
            await fetchAPI('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('登出失败:', error);
        } finally {
            this.clearToken();
            window.location.href = '/login.html';
        }
    }
}

// 工具函数：显示提示消息
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed top-0 end-0 m-3`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

// 工具函数：格式化日期
function formatDate(date) {
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// 初始化导航栏用户状态
async function initAuthNav() {
    const authNav = document.getElementById('authNav');
    if (!authNav) return;

    const user = await Auth.getCurrentUser();
    if (user) {
        authNav.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                    ${user.username}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="/profile.html">个人资料</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="Auth.logout()">退出登录</a></li>
                </ul>
            </li>
        `;
    } else {
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/login.html">登录</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/register.html">注册</a>
            </li>
        `;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initAuthNav();
});

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/js/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.error('ServiceWorker registration failed:', error);
            });
    });
}

// 性能监控
const performanceMonitor = {
    // 记录性能指标
    metrics: {},
    
    // 初始化性能监控
    init() {
        // 监听页面加载性能
        window.addEventListener('load', () => {
            const timing = performance.timing;
            this.metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
            this.metrics.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            this.metrics.firstPaint = performance.getEntriesByType('paint')[0]?.startTime || 0;
            
            // 上报性能指标
            this.reportMetrics();
        });
        
        // 监听资源加载性能
        const observer = new PerformanceObserver(list => {
            list.getEntries().forEach(entry => {
                if (entry.entryType === 'resource') {
                    this.metrics[entry.name] = entry.duration;
                }
            });
        });
        observer.observe({ entryTypes: ['resource'] });
        
        // 监听用户交互性能
        this.observeInteractions();
    },
    
    // 监听用户交互
    observeInteractions() {
        const interactions = ['click', 'scroll', 'keypress'];
        interactions.forEach(type => {
            document.addEventListener(type, () => {
                const start = performance.now();
                requestAnimationFrame(() => {
                    const duration = performance.now() - start;
                    this.metrics[`interaction_${type}`] = duration;
                });
            });
        });
    },
    
    // 上报性能指标
    reportMetrics() {
        // 可以在这里添加上报逻辑
        console.log('Performance metrics:', this.metrics);
    }
};

// 初始化性能监控
performanceMonitor.init();

// CDN配置
const CDN_CONFIG = {
    enabled: true,
    baseUrl: process.env.CDN_URL || 'https://cdn.example.com',
    imageUrl: process.env.IMAGE_CDN_URL || 'https://img.example.com',
    
    // 获取CDN URL
    getUrl(path, type = 'static') {
        if (!this.enabled) return path;
        const baseUrl = type === 'image' ? this.imageUrl : this.baseUrl;
        return `${baseUrl}${path}`;
    },
    
    // 预加载关键资源
    preloadResources() {
        const resources = [
            { url: '/static/css/style.css', type: 'style' },
            { url: '/static/js/main.js', type: 'script' },
            { url: '/static/js/products.js', type: 'script' },
            { url: '/static/js/product-detail.js', type: 'script' }
        ];
        
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = resource.type === 'style' ? 'preload' : 'prefetch';
            link.as = resource.type;
            link.href = this.getUrl(resource.url);
            document.head.appendChild(link);
        });
    }
};

// 资源加载优化
const resourceLoader = {
    // 加载脚本
    loadScript(url, async = true) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = CDN_CONFIG.getUrl(url);
            script.async = async;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // 加载样式
    loadStyle(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = CDN_CONFIG.getUrl(url);
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    },
    
    // 加载图片
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = CDN_CONFIG.getUrl(url, 'image');
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    },
    
    // 批量预加载图片
    preloadImages(urls) {
        return Promise.all(urls.map(url => this.loadImage(url)));
    }
};

// 初始化CDN和资源加载
document.addEventListener('DOMContentLoaded', () => {
    // 预加载关键资源
    CDN_CONFIG.preloadResources();
    
    // 监听图片加载错误
    document.addEventListener('error', event => {
        const target = event.target;
        if (target.tagName === 'IMG') {
            // 图片加载失败时使用备用图片
            target.src = '/static/images/placeholder.jpg';
        }
    }, true);
}); 