<template>
  <div class="reset-password-page">
    <header class="page-header">
      <h2>找回密码</h2>
    </header>

    <div class="reset-form">
      <div class="form-group">
        <label for="email">邮箱</label>
        <input 
          type="email" 
          id="email" 
          v-model="formData.email" 
          placeholder="请输入您的邮箱"
        />
      </div>

      <div class="form-group">
        <label for="code">协助码</label>
        <input 
          type="text" 
          id="code" 
          v-model="formData.code" 
          placeholder="请输入管理员提供的协助码"
        />
      </div>

      <div class="form-group">
        <label for="newPassword">新密码</label>
        <input 
          type="password" 
          id="newPassword" 
          v-model="formData.newPassword" 
          placeholder="请输入新密码"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">重复新密码</label>
        <input 
          type="password" 
          id="confirmPassword" 
          v-model="formData.confirmPassword" 
          placeholder="请再次输入新密码"
        />
      </div>

      <button class="reset-btn" @click="handleReset" :disabled="isLoading">
        {{ isLoading ? '重置中...' : '重置密码' }}
      </button>

      <p class="login-link">
        已有账号？<router-link to="/login">立即登录</router-link>
      </p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        {{ success }}
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
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})
const isLoading = ref(false)
const error = ref('')
const success = ref('')

const handleReset = async () => {
  // 简单验证
  if (!formData.value.email || !formData.value.code || !formData.value.newPassword || !formData.value.confirmPassword) {
    error.value = '请填写所有字段'
    return
  }

  if (formData.value.newPassword !== formData.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  isLoading.value = true
  error.value = ''
  success.value = ''

  try {
    await userService.resetPassword(formData.value)
    success.value = '密码重置成功，请登录'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err.message || '重置密码失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
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

.reset-form {
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

.reset-btn {
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

.reset-btn:hover {
  background-color: #45a049;
}

.reset-btn:disabled {
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

.success-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #e8f5e8;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}
</style>