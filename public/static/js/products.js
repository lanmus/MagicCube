// 当前页码和每页数量
let currentPage = 1;
const pageSize = 12;

// 全局变量
let searchTimeout = null;
const SEARCH_HISTORY_KEY = 'magic_cube_search_history';

// 获取商品列表
async function fetchProducts(page = 1) {
    try {
        // 获取搜索参数
        const search = document.getElementById('search').value;
        const gender = document.getElementById('gender').value;
        const ageRange = document.getElementById('ageRange').value;
        const sortBy = document.getElementById('sortBy').value;

        // 构建查询参数
        const params = new URLSearchParams({
            page,
            limit: pageSize,
            ...(search && { search }),
            ...(gender && { gender }),
            ...(ageRange && { ageRange }),
            sort: sortBy
        });

        const response = await fetchAPI(`/products?${params}`);
        renderProducts(response.data.products);
        renderPagination(response.data.pagination);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 渲染商品列表
function renderProducts(products) {
    const container = document.getElementById('productList');
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h5 class="text-muted">暂无商品</h5>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="col-md-3 mb-4">
            <div class="card h-100">
                <div class="card-img-wrapper" style="height: 200px; background-color: #f8f9fa;">
                    <img data-src="${product.coverImage}" 
                         class="card-img-top lazy-image" 
                         alt="${product.name}"
                         style="height: 200px; object-fit: cover; opacity: 0; transition: opacity 0.3s;">
                    <div class="loading-placeholder">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text small text-muted mb-2">SPU: ${product.spuCode}</p>
                    <div class="d-flex gap-1 mb-3">
                        <span class="badge bg-primary">${product.gender}</span>
                        <span class="badge bg-secondary">${product.ageRange}</span>
                    </div>
                    <a href="/product-detail.html?id=${product._id}" class="btn btn-primary btn-sm w-100">
                        查看详情
                    </a>
                </div>
            </div>
        </div>
    `).join('');
    
    // 初始化懒加载
    initLazyLoading();
}

// 初始化懒加载
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px'
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// 加载图片
function loadImage(img) {
    const src = img.getAttribute('data-src');
    if (!src) return;
    
    // 预加载图片
    const tempImage = new Image();
    tempImage.onload = () => {
        img.src = src;
        img.style.opacity = '1';
        const placeholder = img.closest('.card-img-wrapper').querySelector('.loading-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    };
    tempImage.src = src;
}

// 渲染分页
function renderPagination({ page, pages, total }) {
    const pagination = document.getElementById('pagination');
    const items = [];

    // 上一页
    items.push(`
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${page - 1})">上一页</a>
        </li>
    `);

    // 页码
    for (let i = 1; i <= pages; i++) {
        if (
            i === 1 || // 第一页
            i === pages || // 最后一页
            (i >= page - 2 && i <= page + 2) // 当前页附近的页码
        ) {
            items.push(`
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `);
        } else if (
            (i === 2 && page > 4) || // 第一页之后的省略号
            (i === pages - 1 && page < pages - 3) // 最后一页之前的省略号
        ) {
            items.push(`
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `);
        }
    }

    // 下一页
    items.push(`
        <li class="page-item ${page === pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${page + 1})">下一页</a>
        </li>
    `);

    pagination.innerHTML = items.join('');
}

// 切换页码
function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    fetchProducts(page);
}

// 处理搜索表单提交
document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    fetchProducts(1);
});

// 处理排序变化
document.getElementById('sortBy').addEventListener('change', () => {
    currentPage = 1;
    fetchProducts(1);
});

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化搜索表单
    initSearchForm();
    
    // 加载搜索历史
    loadSearchHistory();
    
    // 加载商品列表
    loadProducts();
});

// 初始化搜索表单
function initSearchForm() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchKeyword');
    
    // 监听搜索框输入
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const keyword = searchInput.value.trim();
            if (keyword.length >= 2) {
                loadSearchSuggestions(keyword);
            } else {
                hideSearchSuggestions();
            }
        }, 300);
    });
    
    // 监听表单提交
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const keyword = searchInput.value.trim();
        if (keyword) {
            addToSearchHistory(keyword);
        }
        loadProducts();
    });
    
    // 监听搜索框聚焦
    searchInput.addEventListener('focus', () => {
        showSearchHistory();
    });
    
    // 监听点击事件，处理搜索框失焦
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchForm') && 
            !e.target.closest('#searchHistory') && 
            !e.target.closest('#searchSuggestions')) {
            hideSearchHistory();
            hideSearchSuggestions();
        }
    });
}

// 加载搜索建议
async function loadSearchSuggestions(keyword) {
    try {
        const response = await fetchAPI('/products/suggestions', {
            method: 'POST',
            body: JSON.stringify({ keyword })
        });
        
        const suggestions = response.data.suggestions;
        if (suggestions.length > 0) {
            renderSearchSuggestions(suggestions);
        } else {
            hideSearchSuggestions();
        }
    } catch (error) {
        console.error('加载搜索建议失败:', error);
        hideSearchSuggestions();
    }
}

// 渲染搜索建议
function renderSearchSuggestions(suggestions) {
    const container = document.querySelector('#searchSuggestions .list-group');
    container.innerHTML = suggestions.map(item => `
        <a href="#" class="list-group-item list-group-item-action" 
           onclick="applySuggestion('${item}')">
            ${highlightKeyword(item, document.getElementById('searchKeyword').value)}
        </a>
    `).join('');
    
    document.getElementById('searchSuggestions').style.display = 'block';
}

// 高亮关键词
function highlightKeyword(text, keyword) {
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

// 应用搜索建议
function applySuggestion(suggestion) {
    document.getElementById('searchKeyword').value = suggestion;
    hideSearchSuggestions();
    loadProducts();
}

// 隐藏搜索建议
function hideSearchSuggestions() {
    document.getElementById('searchSuggestions').style.display = 'none';
}

// 加载搜索历史
function loadSearchHistory() {
    const history = getSearchHistory();
    if (history.length > 0) {
        renderSearchHistory(history);
    }
}

// 渲染搜索历史
function renderSearchHistory(history) {
    const container = document.querySelector('#searchHistory .d-flex');
    container.innerHTML = history.map(item => `
        <button type="button" class="btn btn-outline-secondary btn-sm" 
                onclick="applyHistory('${item}')">
            ${item}
            <i class="bi bi-x ms-2" onclick="event.stopPropagation(); removeFromHistory('${item}')"></i>
        </button>
    `).join('');
}

// 显示搜索历史
function showSearchHistory() {
    const history = getSearchHistory();
    if (history.length > 0) {
        document.getElementById('searchHistory').style.display = 'block';
    }
}

// 隐藏搜索历史
function hideSearchHistory() {
    document.getElementById('searchHistory').style.display = 'none';
}

// 获取搜索历史
function getSearchHistory() {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

// 添加到搜索历史
function addToSearchHistory(keyword) {
    const history = getSearchHistory();
    const index = history.indexOf(keyword);
    if (index > -1) {
        history.splice(index, 1);
    }
    history.unshift(keyword);
    if (history.length > 10) {
        history.pop();
    }
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    renderSearchHistory(history);
}

// 从搜索历史中移除
function removeFromHistory(keyword) {
    const history = getSearchHistory();
    const index = history.indexOf(keyword);
    if (index > -1) {
        history.splice(index, 1);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        if (history.length > 0) {
            renderSearchHistory(history);
        } else {
            hideSearchHistory();
        }
    }
}

// 应用搜索历史
function applyHistory(keyword) {
    document.getElementById('searchKeyword').value = keyword;
    hideSearchHistory();
    loadProducts();
}

// 加载商品列表
async function loadProducts(page = 1) {
    try {
        const searchParams = {
            keyword: document.getElementById('searchKeyword').value.trim(),
            gender: document.getElementById('searchGender').value,
            ageRange: document.getElementById('searchAgeRange').value,
            sort: document.getElementById('searchSort').value,
            page: page,
            limit: 12
        };
        
        const queryString = new URLSearchParams(searchParams).toString();
        const response = await fetchAPI(`/products?${queryString}`);
        
        renderProducts(response.data.products);
        renderPagination(response.data.pagination);
    } catch (error) {
        showToast('加载商品列表失败', 'danger');
    }
}

// 渲染商品列表
function renderProducts(products) {
    const container = document.getElementById('productList');
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h5 class="text-muted">暂无商品</h5>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="col-md-3 mb-4">
            <div class="card h-100">
                <div class="card-img-wrapper" style="height: 200px; background-color: #f8f9fa;">
                    <img data-src="${product.coverImage}" 
                         class="card-img-top lazy-image" 
                         alt="${product.name}"
                         style="height: 200px; object-fit: cover; opacity: 0; transition: opacity 0.3s;">
                    <div class="loading-placeholder">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text small text-muted mb-2">SPU: ${product.spuCode}</p>
                    <div class="d-flex gap-1 mb-3">
                        <span class="badge bg-primary">${product.gender}</span>
                        <span class="badge bg-secondary">${product.ageRange}</span>
                    </div>
                    <a href="/product-detail.html?id=${product._id}" class="btn btn-primary btn-sm w-100">
                        查看详情
                    </a>
                </div>
            </div>
        </div>
    `).join('');
    
    // 初始化懒加载
    initLazyLoading();
}

// 初始化懒加载
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px'
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// 加载图片
function loadImage(img) {
    const src = img.getAttribute('data-src');
    if (!src) return;
    
    // 预加载图片
    const tempImage = new Image();
    tempImage.onload = () => {
        img.src = src;
        img.style.opacity = '1';
        const placeholder = img.closest('.card-img-wrapper').querySelector('.loading-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    };
    tempImage.src = src;
}

// 渲染分页
function renderPagination({ currentPage, totalPages }) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    const pages = [];
    const maxButtons = 5;
    const halfButtons = Math.floor(maxButtons / 2);
    
    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // 上一页
    pages.push(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadProducts(${currentPage - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `);
    
    // 第一页
    if (startPage > 1) {
        pages.push(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="loadProducts(1)">1</a>
            </li>
        `);
        if (startPage > 2) {
            pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
        }
    }
    
    // 页码按钮
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadProducts(${i})">${i}</a>
            </li>
        `);
    }
    
    // 最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
        }
        pages.push(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="loadProducts(${totalPages})">${totalPages}</a>
            </li>
        `);
    }
    
    // 下一页
    pages.push(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadProducts(${currentPage + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `);
    
    container.innerHTML = pages.join('');
} 