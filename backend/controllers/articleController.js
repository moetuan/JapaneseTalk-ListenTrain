const Article = require('../models/Article');

// 获取所有文章
exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find({});
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个文章
exports.getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建文章
exports.createArticle = async (req, res) => {
  const { title, sentences, tags } = req.body;

  try {
    const article = await Article.create({
      title,
      sentences,
      tags,
    });
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新文章
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除文章
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    await article.remove();
    res.json({ message: '文章已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};