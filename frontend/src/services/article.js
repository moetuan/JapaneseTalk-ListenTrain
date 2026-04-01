import api from './api';

const articleService = {
  // 获取所有文章
  getArticles: async () => {
    return await api.get('/articles');
  },

  // 获取单个文章
  getArticle: async (id) => {
    return await api.get(`/articles/${id}`);
  },

  // 创建文章
  createArticle: async (articleData) => {
    return await api.post('/articles', articleData);
  },

  // 更新文章
  updateArticle: async (id, articleData) => {
    return await api.put(`/articles/${id}`, articleData);
  },

  // 删除文章
  deleteArticle: async (id) => {
    return await api.delete(`/articles/${id}`);
  },
};

export default articleService;