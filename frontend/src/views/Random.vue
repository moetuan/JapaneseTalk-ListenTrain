<template>
  <div class="page">
    <header class="page-header">
      <h2>随机一下</h2>
    </header>
    <div class="content">
      <div v-if="isLoading" class="loading">
        <p>正在随机选择文章...</p>
      </div>
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="getRandomArticle" class="retry-btn">重试</button>
      </div>
      <div v-else>
        <p>准备好接受随机日语对话挑战了吗？</p>
        <button @click="getRandomArticle" class="random-btn">随机一下</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoading = ref(false);
const error = ref('');

const getRandomArticle = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    console.log('开始获取文章列表...');
    // 获取所有文章
    const response = await fetch('http://localhost:5000/api/articles');
    console.log('响应状态:', response.status);
    if (!response.ok) {
      throw new Error('获取文章列表失败');
    }
    
    const articles = await response.json();
    console.log('获取到的文章列表:', articles);
    
    if (articles.length === 0) {
      throw new Error('暂无文章');
    }
    
    // 随机选择一篇文章
    const randomIndex = Math.floor(Math.random() * articles.length);
    const randomArticle = articles[randomIndex];
    console.log('随机选择的文章:', randomArticle);
    
    // 跳转到文章详情页
    console.log('准备跳转到:', `/article/${randomArticle._id}`);
    router.push(`/article/${randomArticle._id}`);
  } catch (err) {
    console.error('错误:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

// 组件加载时自动执行一次
onMounted(() => {
  getRandomArticle();
});
</script>

<style scoped>
.page-header {
  background-color: #fff;
  padding: 15px 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.page-header h2 { 
  margin: 0; 
  font-size: 20px; 
}

.content {
  padding: 20px;
  text-align: center;
  margin-top: 50px;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading {
  font-size: 16px;
  color: #666;
}

.error {
  color: #f44336;
  font-size: 16px;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #2196F3;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: #0b7dda;
}

.random-btn {
  margin-top: 30px;
  padding: 12px 30px;
  border: none;
  border-radius: 50px;
  background-color: #4CAF50;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.random-btn:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}
</style>