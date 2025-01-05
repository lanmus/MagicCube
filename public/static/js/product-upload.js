// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    checkAuthStatus();
    
    // 绑定表单提交事件
    document.getElementById('uploadForm').addEventListener('submit', handleSubmit);
});

// 添加模块
function addModule() {
    const template = document.getElementById('moduleTemplate');
    const moduleList = document.getElementById('moduleList');
    const clone = template.content.cloneNode(true);
    
    // 绑定图片上传事件
    const fileInput = clone.querySelector('input[type="file"]');
    fileInput.addEventListener('change', handleImagePreview);
    
    moduleList.appendChild(clone);
}

// 删除模块
function removeModule(button) {
    const moduleItem = button.closest('.module-item');
    moduleItem.remove();
}

// 处理图片预览
function handleImagePreview(event) {
    const files = event.target.files;
    const previewContainer = event.target.closest('.card-body').querySelector('.image-preview');
    previewContainer.innerHTML = '';

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.createElement('div');
            preview.className = 'col-md-3';
            preview.innerHTML = `
                <div class="card">
                    <img src="${e.target.result}" class="card-img-top" alt="${file.name}">
                    <div class="card-body">
                        <p class="card-text">
                            <small class="text-muted">${formatFileSize(file.size)}</small>
                        </p>
                    </div>
                </div>
            `;
            previewContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

// 添加表单验证
function validateForm() {
    const form = document.getElementById('uploadForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }

    const modules = document.querySelectorAll('.module-item');
    if (modules.length === 0) {
        alert('请至少添加一个模块');
        return false;
    }

    for (const module of modules) {
        const fileInput = module.querySelector('input[type="file"]');
        if (fileInput.files.length === 0) {
            alert('请为每个模块上传图片');
            return false;
        }
    }

    return true;
}

// 添加上传进度提示
function showProgress(message) {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'position-fixed top-50 start-50 translate-middle p-3 bg-white rounded shadow';
    progressDiv.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary mb-2" role="status"></div>
            <div>${message}</div>
        </div>
    `;
    document.body.appendChild(progressDiv);
    return progressDiv;
}

// 处理表单提交
async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    const progress = showProgress('正在上传商品...');
    
    try {
        // 1. 创建商品
        const productData = {
            name: event.target.name.value,
            spuCode: event.target.spuCode.value,
            gender: event.target.gender.value,
            ageRange: event.target.ageRange.value,
            scene: event.target.scene.value,
            style: event.target.style.value,
            designer3d: event.target.designer3d.value,
            designer2d: event.target.designer2d.value
        };

        const productResponse = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(productData)
        });

        if (!productResponse.ok) {
            throw new Error('创建商品失败');
        }

        const { productId } = await productResponse.json();

        // 2. 上传模块和图片
        const modules = Array.from(document.querySelectorAll('.module-item'));
        for (const moduleElement of modules) {
            const moduleData = {
                name: moduleElement.querySelector('[name="moduleName"]').value,
                moduleType: moduleElement.querySelector('[name="moduleType"]').value,
                subType: moduleElement.querySelector('[name="subType"]').value
            };

            // 创建模块
            const moduleResponse = await fetch(`/api/products/${productId}/modules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(moduleData)
            });

            if (!moduleResponse.ok) {
                throw new Error('创建模块失败');
            }

            const { moduleId } = await moduleResponse.json();

            // 上传图片
            const fileInput = moduleElement.querySelector('input[type="file"]');
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                Array.from(fileInput.files).forEach(file => {
                    formData.append('images', file);
                });

                const uploadResponse = await fetch(`/api/modules/${moduleId}/images`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (!uploadResponse.ok) {
                    throw new Error('上传图片失败');
                }
            }
        }

        alert('商品创建成功！');
        window.location.href = `/products/${productId}`;
    } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败，请稍后重试');
    } finally {
        progress.remove();
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 图片预处理函数
async function preprocessImage(file) {
    try {
        // 创建图片对象
        const img = await createImageBitmap(file);
        
        // 创建canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置最大尺寸
        const maxSize = 1920;
        let width = img.width;
        let height = img.height;
        
        // 等比例缩放
        if (width > maxSize || height > maxSize) {
            if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
            } else {
                width = (width / height) * maxSize;
                height = maxSize;
            }
        }
        
        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 添加水印
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Arial';
        ctx.fillText('Magic Cube', 20, height - 20);
        
        // 转换为Blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.85);
        });
        
        // 创建新的File对象
        return new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
    } catch (error) {
        console.error('图片预处理失败:', error);
        return file;
    }
}

// MD5计算函数
async function calculateMD5(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 修改文件上传处理
async function handleFileUpload(files, previewContainer) {
    const processedFiles = [];
    const fileHashes = new Set();
    
    for (const file of files) {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            showToast('只能上传图片文件', 'danger');
            continue;
        }
        
        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) {
            showToast('文件大小不能超过10MB', 'danger');
            continue;
        }
        
        // 预处理图片
        const processedFile = await preprocessImage(file);
        
        // 计算文件hash
        const hash = await calculateMD5(processedFile);
        
        // 检查是否重复
        if (fileHashes.has(hash)) {
            showToast(`文件 ${file.name} 已存在`, 'warning');
            continue;
        }
        
        fileHashes.add(hash);
        processedFiles.push({
            file: processedFile,
            hash: hash
        });
        
        // 预览图片
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'col-md-3 mb-3';
            preview.innerHTML = `
                <div class="card">
                    <img src="${e.target.result}" class="card-img-top" alt="${file.name}">
                    <div class="card-body p-2">
                        <p class="card-text small mb-0">${file.name}</p>
                        <p class="card-text small text-muted">${formatFileSize(file.size)}</p>
                    </div>
                </div>
            `;
            previewContainer.appendChild(preview);
        };
        reader.readAsDataURL(processedFile);
    }
    
    return processedFiles;
}

// 处理文件夹上传
async function handleFolderUpload() {
    try {
        const dirHandle = await window.showDirectoryPicker();
        const files = [];
        
        async function* getFilesRecursively(dirHandle, path = '') {
            for await (const entry of dirHandle.values()) {
                const newPath = path ? `${path}/${entry.name}` : entry.name;
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    if (file.type.startsWith('image/')) {
                        yield { file, path: newPath };
                    }
                } else if (entry.kind === 'directory') {
                    yield* getFilesRecursively(entry, newPath);
                }
            }
        }
        
        for await (const { file, path } of getFilesRecursively(dirHandle)) {
            files.push({ file, path });
        }
        
        // 处理文件
        const previewContainer = document.querySelector('.image-preview');
        await handleFileUpload(files.map(f => f.file), previewContainer);
        
        showToast(`成功加载 ${files.length} 个文件`, 'success');
    } catch (error) {
        console.error('文件夹上传失败:', error);
        showToast('文件夹上传失败', 'danger');
    }
}

// 批量重命名
async function batchRename() {
    const previews = document.querySelectorAll('.image-preview .card');
    if (previews.length === 0) {
        showToast('没有可重命名的文件', 'warning');
        return;
    }
    
    const prefix = prompt('请输入文件名前缀：');
    if (!prefix) return;
    
    previews.forEach((preview, index) => {
        const nameElement = preview.querySelector('.card-text');
        const oldName = nameElement.textContent;
        const ext = oldName.split('.').pop();
        const newName = `${prefix}_${String(index + 1).padStart(3, '0')}.${ext}`;
        nameElement.textContent = newName;
    });
    
    showToast('批量重命名完成', 'success');
}

// 批量分类
async function batchClassify() {
    const previews = document.querySelectorAll('.image-preview .card');
    if (previews.length === 0) {
        showToast('没有可分类的文件', 'warning');
        return;
    }
    
    // 创建分类选择器
    const categories = ['主图', 'SKU', '详情'];
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">批量分类</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">选择分类</label>
                        <select class="form-select" id="categorySelect">
                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" onclick="applyCategory()">应用</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    window.applyCategory = function() {
        const category = document.getElementById('categorySelect').value;
        const moduleSelect = document.querySelector('select[name="moduleType"]');
        moduleSelect.value = category.toLowerCase();
        modalInstance.hide();
        showToast(`已将选中文件分类为：${category}`, 'success');
    };
}

// 批量导出
async function batchExport() {
    const previews = document.querySelectorAll('.image-preview .card');
    if (previews.length === 0) {
        showToast('没有可导出的文件', 'warning');
        return;
    }
    
    // 创建导出配置选择器
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">导出配置</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">导出格式</label>
                        <select class="form-select" id="exportFormat">
                            <option value="original">保持原格式</option>
                            <option value="jpg">全部转为JPG</option>
                            <option value="png">全部转为PNG</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">导出质量</label>
                        <input type="range" class="form-range" id="exportQuality" min="0" max="100" value="85">
                        <div class="form-text">当前质量：<span id="qualityValue">85</span>%</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" onclick="startExport()">开始导出</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 更新质量显示
    const qualityInput = document.getElementById('exportQuality');
    const qualityValue = document.getElementById('qualityValue');
    qualityInput.addEventListener('input', () => {
        qualityValue.textContent = qualityInput.value;
    });
    
    window.startExport = async function() {
        const format = document.getElementById('exportFormat').value;
        const quality = document.getElementById('exportQuality').value / 100;
        
        // 处理每个文件
        const files = [];
        for (const preview of previews) {
            const img = preview.querySelector('img');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 创建图片对象
            const image = new Image();
            image.src = img.src;
            await new Promise(resolve => image.onload = resolve);
            
            // 绘制到canvas
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            
            // 转换格式
            const blob = await new Promise(resolve => {
                if (format === 'original') {
                    canvas.toBlob(resolve, img.type, quality);
                } else {
                    canvas.toBlob(resolve, `image/${format}`, quality);
                }
            });
            
            files.push(blob);
        }
        
        // 创建zip文件
        const zip = new JSZip();
        files.forEach((blob, index) => {
            const ext = format === 'original' ? 'jpg' : format;
            zip.file(`image_${String(index + 1).padStart(3, '0')}.${ext}`, blob);
        });
        
        // 下载zip
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'images.zip';
        link.click();
        
        modalInstance.hide();
        showToast('导出完成', 'success');
    };
}

// 版本控制功能
async function showVersionHistory() {
    try {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (!productId) {
            showToast('请先保存商品', 'warning');
            return;
        }
        
        // 获取版本历史
        const response = await fetchAPI(`/products/${productId}/versions`);
        const versions = response.data.versions;
        
        // 创建版本历史对话框
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">版本历史</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
                            ${versions.map(version => `
                                <div class="list-group-item">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">版本 ${version.version}</h6>
                                        <small>${formatDate(version.createdAt)}</small>
                                    </div>
                                    <p class="mb-1">${version.description || '无描述'}</p>
                                    <div class="btn-group btn-group-sm">
                                        <button type="button" class="btn btn-outline-primary" 
                                                onclick="compareVersion('${version._id}')">
                                            对比
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary"
                                                onclick="rollbackVersion('${version._id}')">
                                            回滚
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    } catch (error) {
        console.error('获取版本历史失败:', error);
        showToast('获取版本历史失败', 'danger');
    }
}

// 保存版本
async function saveVersion() {
    try {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (!productId) {
            showToast('请先保存商品', 'warning');
            return;
        }
        
        // 创建保存版本对话框
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">保存版本</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">版本描述</label>
                            <textarea class="form-control" id="versionDescription" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" onclick="confirmSaveVersion()">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        window.confirmSaveVersion = async function() {
            const description = document.getElementById('versionDescription').value;
            
            // 获取当前表单数据
            const formData = new FormData(document.getElementById('uploadForm'));
            
            // 保存版本
            await fetchAPI(`/products/${productId}/versions`, {
                method: 'POST',
                body: JSON.stringify({
                    description,
                    data: Object.fromEntries(formData)
                })
            });
            
            modalInstance.hide();
            showToast('版本保存成功', 'success');
        };
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    } catch (error) {
        console.error('保存版本失败:', error);
        showToast('保存版本失败', 'danger');
    }
}

// 对比版本
async function compareVersion(versionId) {
    try {
        const productId = new URLSearchParams(window.location.search).get('id');
        
        // 获取版本数据
        const response = await fetchAPI(`/products/${productId}/versions/${versionId}`);
        const version = response.data.version;
        
        // 创建对比对话框
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">版本对比</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>当前版本</h6>
                                <div class="current-version">
                                    <!-- 当前版本数据将通过JavaScript填充 -->
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>历史版本 (${formatDate(version.createdAt)})</h6>
                                <div class="old-version">
                                    <!-- 历史版本数据将通过JavaScript填充 -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        
        // 填充版本数据
        const currentData = Object.fromEntries(new FormData(document.getElementById('uploadForm')));
        const oldData = version.data;
        
        const currentContainer = modal.querySelector('.current-version');
        const oldContainer = modal.querySelector('.old-version');
        
        // 比较并显示差异
        Object.keys({ ...currentData, ...oldData }).forEach(key => {
            const currentValue = currentData[key];
            const oldValue = oldData[key];
            
            const isDifferent = currentValue !== oldValue;
            
            currentContainer.innerHTML += `
                <div class="mb-2 ${isDifferent ? 'text-danger' : ''}">
                    <strong>${key}:</strong> ${currentValue || '(空)'}
                </div>
            `;
            
            oldContainer.innerHTML += `
                <div class="mb-2 ${isDifferent ? 'text-danger' : ''}">
                    <strong>${key}:</strong> ${oldValue || '(空)'}
                </div>
            `;
        });
        
        modalInstance.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    } catch (error) {
        console.error('版本对比失败:', error);
        showToast('版本对比失败', 'danger');
    }
}

// 回滚版本
async function rollbackVersion(versionId) {
    try {
        const productId = new URLSearchParams(window.location.search).get('id');
        
        if (!confirm('确定要回滚到这个版本吗？当前未保存的修改将丢失。')) {
            return;
        }
        
        // 执行回滚
        const response = await fetchAPI(`/products/${productId}/versions/${versionId}/rollback`, {
            method: 'POST'
        });
        
        // 更新表单数据
        const formData = response.data.version.data;
        const form = document.getElementById('uploadForm');
        
        Object.entries(formData).forEach(([key, value]) => {
            const input = form.elements[key];
            if (input) {
                input.value = value;
            }
        });
        
        showToast('版本回滚成功', 'success');
        
        // 重新加载图片预览
        if (formData.images) {
            const previewContainer = document.querySelector('.image-preview');
            previewContainer.innerHTML = '';
            await handleFileUpload(formData.images, previewContainer);
        }
    } catch (error) {
        console.error('版本回滚失败:', error);
        showToast('版本回滚失败', 'danger');
    }
} 