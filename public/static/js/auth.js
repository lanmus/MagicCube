// 处理登录表单提交
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        // 保存token
        Auth.setToken(response.data.token);
        
        // 显示成功消息
        showToast('登录成功', 'success');

        // 跳转到首页
        setTimeout(() => {
            window.location.href = '/products.html';
        }, 1000);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 处理注册表单提交
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const email = document.getElementById('email').value;

    // 验证密码
    if (password !== confirmPassword) {
        showToast('两次输入的密码不一致', 'danger');
        return;
    }

    // 验证密码强度
    if (password.length < 8) {
        showToast('密码长度至少为8位', 'danger');
        return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('请输入有效的邮箱地址', 'danger');
        return;
    }

    try {
        const response = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                email
            })
        });

        // 显示成功消息
        showToast('注册成功，即将跳转到登录页面', 'success');

        // 跳转到登录页
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 处理忘记密码
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('请输入有效的邮箱地址', 'danger');
        return;
    }

    try {
        await fetchAPI('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });

        // 显示成功消息
        showToast('重置密码链接已发送到您的邮箱', 'success');

        // 禁用提交按钮
        document.querySelector('button[type="submit"]').disabled = true;
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 处理重置密码
async function handleResetPassword(event) {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 验证token
    if (!token) {
        showToast('无效的重置链接', 'danger');
        return;
    }

    // 验证密码
    if (password !== confirmPassword) {
        showToast('两次输入的密码不一致', 'danger');
        return;
    }

    // 验证密码强度
    if (password.length < 8) {
        showToast('密码长度至少为8位', 'danger');
        return;
    }

    try {
        await fetchAPI('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                token,
                password
            })
        });

        // 显示成功消息
        showToast('密码重置成功，即将跳转到登录页面', 'success');

        // 跳转到登录页
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// 密码强度检查
function checkPasswordStrength(password) {
    const strengthMeter = document.getElementById('passwordStrength');
    if (!strengthMeter) return;

    // 密码强度规则
    const rules = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    // 计算强度分数
    const score = Object.values(rules).filter(Boolean).length;

    // 更新强度提示
    let strength = '';
    let color = '';
    
    switch (score) {
        case 0:
        case 1:
            strength = '非常弱';
            color = 'danger';
            break;
        case 2:
            strength = '弱';
            color = 'warning';
            break;
        case 3:
            strength = '中等';
            color = 'info';
            break;
        case 4:
            strength = '强';
            color = 'primary';
            break;
        case 5:
            strength = '非常强';
            color = 'success';
            break;
    }

    strengthMeter.textContent = `密码强度: ${strength}`;
    strengthMeter.className = `text-${color} small`;
}

// 添加密码强度检查事件监听
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }
}); 