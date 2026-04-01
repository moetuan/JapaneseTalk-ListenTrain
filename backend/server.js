const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectDB, getPool } = require('./config/db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 连接数据库
connectDB().then(() => {
  // 启动服务器
  app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
  });
});

// 用户注册
app.post('/api/users/register', async (req, res) => {
  const { username, email, password } = req.body;
  const pool = getPool();
  
  try {
    // 检查用户是否已存在
    const [userExists] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 检查用户名是否已存在
    const [usernameExists] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (usernameExists.length > 0) {
      return res.status(400).json({ message: '该用户名已被使用' });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建新用户
    const id = Date.now().toString();
    await pool.execute(
      'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
      [id, username, email, hashedPassword]
    );

    res.status(201).json({
      _id: id,
      username,
      email,
      token: generateToken(id)
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  const pool = getPool();

  try {
    // 查找用户
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const user = users[0];
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin || false,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员生成一次性找回密码协助码
app.post('/api/admin/generate-reset-code', async (req, res) => {
  const { email } = req.body;
  const pool = getPool();

  try {
    // 检查用户是否存在
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 生成随机协助码
    const generateCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1小时过期

    // 插入协助码
    await pool.execute(
      'INSERT INTO password_reset_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)',
      [Date.now().toString(), email, code, expiresAt]
    );

    res.json({ message: '协助码生成成功', code });
  } catch (error) {
    console.error('生成协助码失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 使用协助码重置密码
app.post('/api/users/reset-password', async (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;
  const pool = getPool();

  try {
    // 验证密码是否一致
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: '两次输入的密码不一致' });
    }

    // 检查协助码是否有效
    const [codes] = await pool.execute(
      'SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND is_used = false AND expires_at > NOW()',
      [email, code]
    );

    if (codes.length === 0) {
      return res.status(400).json({ message: '无效的协助码或已过期' });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新密码
    await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // 标记协助码为已使用
    await pool.execute('UPDATE password_reset_codes SET is_used = true WHERE id = ?', [codes[0].id]);

    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取个人信息
app.get('/api/users/profile', async (req, res) => {
  // 这里简化处理，实际应该验证token
  const pool = getPool();
  
  try {
    const [users] = await pool.execute('SELECT id, username, email FROM users LIMIT 1');
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const user = users[0];
    res.json({
      _id: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有文章
app.get('/api/articles', async (req, res) => {
  const pool = getPool();
  
  try {
    const [articles] = await pool.execute('SELECT * FROM articles');
    
    // 转换文章格式
    const formattedArticles = articles.map(article => {
      try {
        const content = JSON.parse(article.content);
        const tags = article.tags ? article.tags.split(',') : [];
        return {
          _id: article.id,
          title: article.title,
          sentences: content.sentences,
          tags
        };
      } catch (error) {
        console.error('解析文章内容失败:', error);
        return null;
      }
    }).filter(Boolean);
    
    res.json(formattedArticles);
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个文章
app.get('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const pool = getPool();
  
  try {
    const [articles] = await pool.execute('SELECT * FROM articles WHERE id = ?', [id]);
    if (articles.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    const article = articles[0];
    try {
      const content = JSON.parse(article.content);
      const tags = article.tags ? article.tags.split(',') : [];
      res.json({
        _id: article.id,
        title: article.title,
        sentences: content.sentences,
        tags
      });
    } catch (error) {
      console.error('解析文章内容失败:', error);
      res.status(500).json({ message: '文章内容解析失败' });
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 初始化示例数据
app.post('/api/articles/init', async (req, res) => {
  const pool = getPool();
  
  try {
    // 检查是否已有文章
    const [existingArticles] = await pool.execute('SELECT * FROM articles');
    if (existingArticles.length > 0) {
      return res.json({ message: '示例数据已存在' });
    }
    
    // 示例文章数据
    const sampleArticles = [
      {
        id: '1',
        title: '第一课：初次见面',
        content: JSON.stringify({
          sentences: [
            { jp: 'はじめまして、私の名前は田中です。', cn: '初次见面，我的名字是田中。' },
            { jp: '今日はいい天気ですね。', cn: '今天天气真好啊。' },
            { jp: 'これから一緒に日本語を勉強しましょう！', cn: '接下来我们一起学习日语吧！' },
            { jp: 'よろしくお願いします。', cn: '请多关照。' }
          ]
        }),
        tags: '基础问候'
      },
      {
        id: '2',
        title: '第二课：在餐厅点餐',
        content: JSON.stringify({
          sentences: [
            { jp: 'すみません、メニューをお願いします。', cn: '对不起，请给我菜单。' },
            { jp: '何をおすすめしますか？', cn: '你推荐什么？' },
            { jp: '私はラーメンを食べたいです。', cn: '我想吃拉面。' },
            { jp: 'お会計をお願いします。', cn: '请结账。' }
          ]
        }),
        tags: '生活场景'
      }
    ];
    
    // 插入示例文章
    for (const article of sampleArticles) {
      await pool.execute(
        'INSERT INTO articles (id, title, content, tags) VALUES (?, ?, ?, ?)',
        [article.id, article.title, article.content, article.tags]
      );
    }
    
    res.json({ message: '示例数据初始化成功' });
  } catch (error) {
    console.error('初始化示例数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建文章（仅管理员）
app.post('/api/articles', async (req, res) => {
  const { title, sentences, tags } = req.body;
  const pool = getPool();

  try {
    // 生成文章ID
    const id = Date.now().toString();
    // 构建文章内容
    const content = JSON.stringify({ sentences });
    // 构建标签字符串
    const tagsString = tags ? tags.join(',') : '';

    // 插入文章
    await pool.execute(
      'INSERT INTO articles (id, title, content, tags) VALUES (?, ?, ?, ?)',
      [id, title, content, tagsString]
    );

    res.status(201).json({
      _id: id,
      title,
      sentences,
      tags
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 健康检查
app.get('/', (req, res) => {
  res.json({ message: '服务器运行正常' });
});