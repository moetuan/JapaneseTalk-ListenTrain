const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/userController');
const protect = require('../middlewares/authMiddleware');

// 注册路由
router.post('/register', register);

// 登录路由
router.post('/login', login);

// 获取个人信息路由（需要认证）
router.get('/profile', protect, getProfile);

module.exports = router;