// 建议创建统一的导航组件
const navComponent = {
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <!-- 统一的导航结构 -->
    </nav>
  `
}; 

// 统一的认证状态检查
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  return true;
} 

// 统一的数据加载状态管理
async function loadPageData(pageId) {
  try {
    showLoading();
    const data = await fetchPageData(pageId);
    updateUI(data);
  } catch (error) {
    showError(error);
  } finally {
    hideLoading();
  }
} 