<template>
  <div class="page">
    <header class="page-header">
      <h2>每日文章</h2>
    </header>

    <div class="content">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载文章中...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="loadArticles">重试</button>
      </div>
      
      <div v-else-if="articles.length === 0" class="empty-container">
        <div class="empty-icon">📭</div>
        <p class="empty-message">暂无文章</p>
      </div>
      
      <div v-else>
        <div 
          v-for="article in articles" 
          :key="article._id" 
          class="article-card" 
          @click="goToArticle(article._id)"
        >
          <h3>{{ article.title }}</h3>
          <p class="preview">{{ article.sentences[0]?.jp || '' }}</p>
          <div class="tags">
            <span 
              v-for="tag in article.tags" 
              :key="tag" 
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import articleService from '../services/article'

// 获取路由实例，用于执行页面跳转
const router = useRouter()
const articles = ref([])
const isLoading = ref(false)
const error = ref('')

// 跳转到文章详情页的方法
const goToArticle = (articleId) => {
  router.push(`/article/${articleId}`)
}

// 加载文章列表
const loadArticles = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const data = await articleService.getArticles()
    articles.value = data
  } catch (err) {
    error.value = err.message || '加载文章失败'
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时加载文章
onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.page-header {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 20px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  position: sticky;
  top: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.02em;
}

.content {
  padding: 20px;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
}

/* 文章卡片的样式 */
.article-card {
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.article-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.article-card:active {
  transform: scale(0.98); /* 点击时会有微微缩小的按压效果 */
}

.article-card h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.01em;
}

.preview {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #86868b;
  line-height: 1.5;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tags .tag {
  background-color: #f0f0f0;
  color: #6e6e73;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.3s ease;
}

.tags .tag:hover {
  background-color: #e0e0e0;
  color: #1d1d1f;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #0071e3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #86868b;
  font-size: 15px;
  font-weight: 400;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-message {
  color: #ff3b30;
  font-size: 15px;
  margin-bottom: 24px;
  line-height: 1.5;
  max-width: 300px;
}

.retry-btn {
  background-color: #0071e3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 980px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.retry-btn:hover {
  background-color: #0077ed;
  transform: scale(1.05);
}

.retry-btn:active {
  transform: scale(0.98);
}

/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-message {
  color: #86868b;
  font-size: 15px;
  font-weight: 400;
  max-width: 300px;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .page-header {
    padding: 16px 16px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .content {
    padding: 16px;
  }
  
  .article-card {
    padding: 16px;
    margin-bottom: 20px;
    border-radius: 12px;
  }
  
  .article-card h3 {
    font-size: 16px;
  }
  
  .preview {
    font-size: 14px;
  }
}
</style>