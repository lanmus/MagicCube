// 全局变量
let currentUser = null;
let uploadsPage = 1;
let downloadsPage = 1;
const pageSize = 10;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!Auth.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // 加载用户信息
    await loadUserProfile();

    // 加载上传历史
    await loadUploads();

    // 加载下载记录
    await loadDownloads();
});

// 加载用户信息
async function loadUserProfile() {
    try {
        const response = await fetchAPI('/users/me');
        currentUser = response.data.user;

        // 更新页面显示
        document.getElementById('userDisplayName').textContent = currentUser.username;
        document.getElementById('userRole').textContent = currentUser.role === 'admin' ? '管理员' : '普通用户';
        
        if (currentUser.avatar) {
            document.getElementById('userAvatar').src = currentUser.avatar;
            document.getElementById('avatarPreview').src = currentUser.avatar;
        }

        // 填充表单
        document.getElementById('username').value = currentUser.username;
        document.getElementById('email').value = currentUser.email;
        document.getElementById('bio').value = currentUser.bio || '';
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 处理头像预览
function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件', 'danger');
        return;
    }

    // 验证文件大小
    if (file.size > 2 * 1024 * 1024) {
        showToast('图片大小不能超过2MB', 'danger');
        return;
    }

    // 预览图片
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('avatarPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 处理更新个人资料
async function handleUpdateProfile(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('username', document.getElementById('username').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('bio', document.getElementById('bio').value);

    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput.files.length > 0) {
        formData.append('avatar', avatarInput.files[0]);
    }

    try {
        const response = await fetchAPI('/users/me', {
            method: 'PATCH',
            headers: {
                // 不设置Content-Type，让浏览器自动设置
            },
            body: formData
        });

        currentUser = response.data.user;
        showToast('个人资料更新成功', 'success');

        // 更新显示
        document.getElementById('userDisplayName').textContent = currentUser.username;
        if (currentUser.avatar) {
            document.getElementById('userAvatar').src = currentUser.avatar;
        }
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 处理更新密码
async function handleUpdatePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // 验证密码
    if (newPassword !== confirmNewPassword) {
        showToast('两次输入的新密码不一致', 'danger');
        return;
    }

    // 验证密码强度
    if (newPassword.length < 8) {
        showToast('新密码长度至少为8位', 'danger');
        return;
    }

    try {
        await fetchAPI('/users/me/password', {
            method: 'PATCH',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        showToast('密码更新成功', 'success');

        // 清空表单
        document.getElementById('passwordForm').reset();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 加载上传历史
async function loadUploads(page = 1) {
    try {
        const response = await fetchAPI(`/products?createdBy=${currentUser._id}&page=${page}&limit=${pageSize}`);
        const { products, pagination } = response.data;

        // 渲染上传列表
        const tbody = document.getElementById('uploadsTableBody');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.spuCode}</td>
                <td>${formatDate(product.createdAt)}</td>
                <td><span class="badge bg-${product.status === 'active' ? 'success' : 'warning'}">
                    ${product.status === 'active' ? '已上架' : '未上架'}
                </span></td>
                <td>
                    <a href="/product-detail.html?id=${product._id}" 
                       class="btn btn-sm btn-outline-primary">
                        查看
                    </a>
                </td>
            </tr>
        `).join('');

        // 渲染分页
        renderPagination('uploadsPagination', pagination, loadUploads);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 加载下载记录
async function loadDownloads(page = 1) {
    try {
        const response = await fetchAPI(`/selections?userId=${currentUser._id}&status=completed&page=${page}&limit=${pageSize}`);
        const { selections, pagination } = response.data;

        // 渲染下载列表
        const tbody = document.getElementById('downloadsTableBody');
        tbody.innerHTML = selections.map(selection => `
            <tr>
                <td>${selection.productId.name}</td>
                <td>${selection.productId.spuCode}</td>
                <td>${formatDate(selection.lastDownloadAt || selection.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"
                            onclick="downloadAgain('${selection._id}')">
                        重新下载
                    </button>
                </td>
            </tr>
        `).join('');

        // 渲染分页
        renderPagination('downloadsPagination', pagination, loadDownloads);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 渲染分页
function renderPagination(elementId, pagination, callback) {
    const { page, pages, total } = pagination;
    const paginationElement = document.getElementById(elementId);
    const items = [];

    // 上一页
    items.push(`
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return ${callback.name}(${page - 1})">上一页</a>
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
                    <a class="page-link" href="#" onclick="return ${callback.name}(${i})">${i}</a>
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
            <a class="page-link" href="#" onclick="return ${callback.name}(${page + 1})">下一页</a>
        </li>
    `);

    paginationElement.innerHTML = items.join('');
}

// 重新下载
async function downloadAgain(selectionId) {
    try {
        // 生成下载链接
        const response = await fetchAPI(`/selections/${selectionId}/download`, {
            method: 'POST'
        });

        const { downloadUrl } = response.data;
        
        // 创建一个隐藏的链接并点击它来触发下载
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 添加密码强度检查事件监听
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('newPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }
}); 