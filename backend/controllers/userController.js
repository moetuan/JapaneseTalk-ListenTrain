const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 用户注册
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 检查用户是否已存在
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 检查用户名是否已存在
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: '该用户名已被使用' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: '创建用户失败' });
    }
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 用户登录
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 查找用户
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: '邮箱或密码错误' });
    }
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户信息
exports.getProfile = async (req, res) => {
  const { _id, username, email } = req.user;
  res.json({ _id, username, email });
};