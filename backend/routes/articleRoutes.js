const express = require('express');
const router = express.Router();
const { 
  getArticles, 
  getArticle, 
  createArticle, 
  updateArticle, 
  deleteArticle 
} = require('../controllers/articleController');

// 获取所有文章
router.get('/', getArticles);

// 获取单个文章
router.get('/:id', getArticle);

// 创建文章
router.post('/', createArticle);

// 更新文章
router.put('/:id', updateArticle);

// 删除文章
router.delete('/:id', deleteArticle);

module.exports = router;