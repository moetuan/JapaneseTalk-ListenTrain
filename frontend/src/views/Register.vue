<template>
  <div class="register-page">
    <header class="page-header">
      <h2>注册</h2>
    </header>

    <div class="register-form">
      <div class="form-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username" 
          v-model="formData.username" 
          placeholder="请输入用户名"
        />
      </div>

      <div class="form-group">
        <label for="email">邮箱</label>
        <input 
          type="email" 
          id="email" 
          v-model="formData.email" 
          placeholder="请输入邮箱"
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input 
          type="password" 
          id="password" 
          v-model="formData.password" 
          placeholder="请输入密码"
        />
      </div>

      <button class="register-btn" @click="handleRegister" :disabled="isLoading">
        {{ isLoading ? '注册中...' : '注册' }}
      </button>

      <p class="login-link">
        已有账号？<router-link to="/login">立即登录</router-link>
      </p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import userService from '../services/user'

const router = useRouter()
const formData = ref({
  username: '',
  email: '',
  password: ''
})
const isLoading = ref(false)
const error = ref('')

const handleRegister = async () => {
  // 简单验证
  if (!formData.value.username || !formData.value.email || !formData.value.password) {
    error.value = '请填写所有字段'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await userService.register(formData.value)
    // 注册成功后跳转到登录页面
    router.push('/login')
  } catch (err) {
    error.value = err.message || '注册失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 80px;
}

.page-header {
  background-color: #fff;
  padding: 15px 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  position: sticky;
  top: 0;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.register-form {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.register-btn {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.register-btn:hover {
  background-color: #45a049;
}

.register-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #4CAF50;
  text-decoration: none;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}
</style>