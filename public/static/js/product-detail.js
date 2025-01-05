// 全局变量
let productId = null;
let currentSelection = null;
let currentModule = null;
let currentImageIndex = 0;
let moduleImages = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 从URL获取商品ID
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id');
    
    if (!productId) {
        showToast('商品ID不能为空', 'danger');
        window.location.href = '/products.html';
        return;
    }

    // 加载商品详情
    await loadProductDetail();
});

// 加载商品详情
async function loadProductDetail() {
    try {
        const response = await fetchAPI(`/products/${productId}`);
        const product = response.data.product;

        // 更新页面标题
        document.title = `${product.name} - Magic Cube`;

        // 渲染商品基本信息
        renderProductInfo(product);

        // 渲染模块导航
        renderModuleNav(product.modules);

        // 渲染第一个模块
        if (product.modules.length > 0) {
            selectModule(product.modules[0]._id);
        }

        // 检查选择状态
        await checkSelectionStatus();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 渲染商品基本信息
function renderProductInfo(product) {
    document.getElementById('productName').textContent = product.name;
    document.getElementById('spuCode').textContent = product.spuCode;
    document.getElementById('gender').textContent = product.gender;
    document.getElementById('ageRange').textContent = product.ageRange;
    document.getElementById('scene').textContent = product.scene;
    document.getElementById('style').textContent = product.style;
    document.getElementById('designers').textContent = product.designers.join(', ');
}

// 渲染模块导航
function renderModuleNav(modules) {
    const nav = document.getElementById('moduleNav');
    nav.innerHTML = modules.map((module, index) => `
        <li class="nav-item">
            <a class="nav-link ${index === 0 ? 'active' : ''}" 
               href="#" 
               onclick="selectModule('${module._id}')">
                ${module.name}
            </a>
        </li>
    `).join('');
}

// 选择模块
async function selectModule(moduleId) {
    try {
        const response = await fetchAPI(`/modules/${moduleId}`);
        const module = response.data.module;
        
        // 更新当前模块
        currentModule = module;
        moduleImages = module.materials;
        currentImageIndex = 0;
        
        // 更新导航状态
        document.querySelectorAll('#moduleNav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick').includes(moduleId)) {
                link.classList.add('active');
            }
        });
        
        // 渲染缩略图
        renderThumbnails();
        
        // 更新主预览图
        updateMainPreview();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 渲染缩略图
function renderThumbnails() {
    const container = document.getElementById('thumbnailList');
    container.innerHTML = moduleImages.slice(0, 6).map((image, index) => `
        <div class="col-4">
            <div class="card ${index === currentImageIndex ? 'border-primary' : ''}" 
                 onclick="selectImage(${index})">
                <img src="${image.url}" 
                     class="card-img-top" 
                     alt="${image.filename}"
                     style="height: 80px; object-fit: cover;">
            </div>
        </div>
    `).join('');
    
    // 如果有更多图片，显示提示
    if (moduleImages.length > 6) {
        container.innerHTML += `
            <div class="col-12 text-center mt-2">
                <small class="text-muted">还有 ${moduleImages.length - 6} 张图片</small>
            </div>
        `;
    }
}

// 选择图片
function selectImage(index) {
    currentImageIndex = index;
    updateMainPreview();
    renderThumbnails();
}

// 更新主预览图
function updateMainPreview() {
    const mainImg = document.querySelector('#mainPreview img');
    if (moduleImages.length > 0) {
        const image = moduleImages[currentImageIndex];
        mainImg.src = image.url;
        mainImg.alt = image.filename;
    }
}

// 上一张图片
function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateMainPreview();
        renderThumbnails();
    }
}

// 下一张图片
function nextImage() {
    if (currentImageIndex < moduleImages.length - 1) {
        currentImageIndex++;
        updateMainPreview();
        renderThumbnails();
    }
}

// 检查选择状态
async function checkSelectionStatus() {
    try {
        const response = await fetchAPI(`/selections?productId=${productId}&status=draft`);
        const selections = response.data.selections;

        if (selections.length > 0) {
            // 有进行中的选择
            currentSelection = selections[0];
            document.getElementById('startSelectionBtn').style.display = 'none';
            document.getElementById('completeSelectionBtn').style.display = 'block';
            document.getElementById('downloadBtn').style.display = 'none';
            
            // 更新选择状态提示
            updateSelectionStatus('进行中', 'info');
        } else {
            // 检查是否有已完成的选择
            const completedResponse = await fetchAPI(`/selections?productId=${productId}&status=completed`);
            const completedSelections = completedResponse.data.selections;

            if (completedSelections.length > 0) {
                // 有已完成的选择
                currentSelection = completedSelections[0];
                document.getElementById('startSelectionBtn').style.display = 'none';
                document.getElementById('completeSelectionBtn').style.display = 'none';
                document.getElementById('downloadBtn').style.display = 'block';
                
                // 更新选择状态提示
                updateSelectionStatus('已完成', 'success');
            } else {
                // 没有选择记录
                document.getElementById('startSelectionBtn').style.display = 'block';
                document.getElementById('completeSelectionBtn').style.display = 'none';
                document.getElementById('downloadBtn').style.display = 'none';
            }
        }

        // 重新渲染模块列表以反映选择状态
        if (currentSelection) {
            const productResponse = await fetchAPI(`/products/${productId}`);
            const product = productResponse.data.product;
            
            // 将选择信息添加到模块中
            product.modules = product.modules.map(module => {
                const selection = currentSelection.selections.find(s => s.moduleId === module._id);
                if (selection) {
                    module.selectedMaterial = selection.materialId;
                }
                return module;
            });

            renderModules(product.modules);
        }
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 更新选择状态提示
function updateSelectionStatus(status, type) {
    const statusElement = document.getElementById('selectionStatus');
    statusElement.className = `alert alert-${type}`;
    statusElement.style.display = 'block';
    statusElement.textContent = `选择状态：${status}`;
}

// 开始选择
async function startSelection() {
    try {
        const response = await fetchAPI(`/products/${productId}/selections`, {
            method: 'POST'
        });
        
        currentSelection = response.data.selection;
        showToast('开始选择素材', 'success');
        
        // 重新加载商品详情以显示选择界面
        await loadProductDetail();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 选择素材
async function selectMaterial(moduleId, materialId) {
    try {
        const response = await fetchAPI(`/selections/${currentSelection._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ moduleId, materialId })
        });

        currentSelection = response.data.selection;
        showToast('素材选择已更新', 'success');
        
        // 重新加载商品详情以更新选择状态
        await loadProductDetail();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 完成选择
async function completeSelection() {
    try {
        const response = await fetchAPI(`/selections/${currentSelection._id}/complete`, {
            method: 'POST'
        });

        currentSelection = response.data.selection;
        showToast('选择已完成', 'success');
        
        // 重新加载商品详情以更新界面状态
        await loadProductDetail();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 下载素材
async function downloadMaterials() {
    try {
        // 生成下载链接
        const response = await fetchAPI(`/selections/${currentSelection._id}/download`, {
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