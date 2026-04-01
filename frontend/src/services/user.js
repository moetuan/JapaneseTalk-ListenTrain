import api from './api';

const userService = {
  // 注册
  register: async (userData) => {
    return await api.post('/users/register', userData);
  },

  // 登录
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    // 存储令牌到本地存储
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        _id: response._id,
        username: response.username,
        email: response.email,
        is_admin: response.is_admin || false,
      }));
    }
    return response;
  },

  // 生成找回密码协助码
  generateResetCode: async (email) => {
    return await api.post('/admin/generate-reset-code', { email });
  },

  // 重置密码
  resetPassword: async (resetData) => {
    return await api.post('/users/reset-password', resetData);
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 获取当前用户信息
  getProfile: async () => {
    return await api.get('/users/profile');
  },

  // 检查用户是否已登录
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // 获取当前用户
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default userService;