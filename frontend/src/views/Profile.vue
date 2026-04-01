<template>
  <div class="page">
    <header class="page-header">
      <h2>个人中心</h2>
    </header>
    <div class="content">
      <div v-if="!isLoggedIn">
        <div class="login-prompt">
          <p>请登录以查看个人信息</p>
          <div class="auth-buttons">
            <router-link to="/login" class="btn login-btn">登录</router-link>
            <router-link to="/register" class="btn register-btn">注册</router-link>
          </div>
        </div>
      </div>
      
      <div v-else>
        <div class="user-info">
          <h3>{{ user.username }}</h3>
          <p class="email">{{ user.email }}</p>
          <p v-if="user.is_admin" class="admin-badge">管理员</p>
        </div>
        
        <!-- 管理员功能 -->
        <div v-if="user.is_admin" class="admin-section">
          <h4>管理员功能</h4>
          
          <!-- 生成协助码 -->
          <div class="admin-form">
            <div class="form-group">
              <label for="reset-email">用户邮箱</label>
              <input 
                type="email" 
                id="reset-email" 
                v-model="resetEmail" 
                placeholder="请输入需要重置密码的用户邮箱"
              />
            </div>
            <button class="btn generate-code-btn" @click="handleGenerateCode" :disabled="isGenerating">
              {{ isGenerating ? '生成中...' : '生成协助码' }}
            </button>
            <div v-if="codeResult" class="code-result">
              <p>协助码：<strong>{{ codeResult }}</strong></p>
              <p class="code-hint">此协助码有效期为1小时，请尽快提供给用户</p>
            </div>
            <div v-if="codeError" class="error-message">
              {{ codeError }}
            </div>
          </div>
          
          <!-- 上传文章 -->
          <div class="upload-article-section">
            <h5>上传文章</h5>
            <div class="article-form">
              <div class="form-group">
                <label for="article-title">文章标题</label>
                <input 
                  type="text" 
                  id="article-title" 
                  v-model="articleForm.title" 
                  placeholder="请输入文章标题"
                />
              </div>
              <div class="form-group">
                <label for="article-content">文章内容</label>
                <textarea 
                  id="article-content" 
                  v-model="articleForm.content" 
                  placeholder="请粘贴文章内容，格式如下：\nA: 日语句子\nA: 中文翻译\n\nB: 日语句子\nB: 中文翻译" 
                  rows="10"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="article-tags">标签（用逗号分隔）</label>
                <input 
                  type="text" 
                  id="article-tags" 
                  v-model="articleForm.tags" 
                  placeholder="例如：日常场景,朋友对话"
                />
              </div>
              <button class="btn upload-article-btn" @click="handleUploadArticle" :disabled="isUploading">
                {{ isUploading ? '上传中...' : '上传文章' }}
              </button>
              <div v-if="uploadSuccess" class="success-message">
                {{ uploadSuccess }}
              </div>
              <div v-if="uploadError" class="error-message">
                {{ uploadError }}
              </div>
            </div>
          </div>
        </div>
        
        <button class="btn logout-btn" @click="handleLogout">登出</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import userService from '../services/user'

const router = useRouter()
const user = ref({})
const isLoggedIn = ref(false)

// 管理员功能相关
const resetEmail = ref('')
const isGenerating = ref(false)
const codeResult = ref('')
const codeError = ref('')

// 上传文章相关
const articleForm = ref({
  title: '',
  content: '',
  tags: ''
})
const isUploading = ref(false)
const uploadSuccess = ref('')
const uploadError = ref('')

// 检查用户登录状态
const checkLoginStatus = () => {
  isLoggedIn.value = userService.isLoggedIn()
  if (isLoggedIn.value) {
    user.value = userService.getCurrentUser()
  }
}

// 处理登出
const handleLogout = () => {
  userService.logout()
  isLoggedIn.value = false
  user.value = {}
  router.push('/')
}

// 生成找回密码协助码
const handleGenerateCode = async () => {
  if (!resetEmail.value) {
    codeError.value = '请输入用户邮箱'
    return
  }

  isGenerating.value = true
  codeError.value = ''
  codeResult.value = ''

  try {
    const response = await userService.generateResetCode(resetEmail.value)
    codeResult.value = response.code
  } catch (err) {
    codeError.value = err.message || '生成协助码失败'
  } finally {
    isGenerating.value = false
  }
}

// 解析文章内容
const parseArticleContent = (content) => {
  const lines = content.trim().split('\n')
  const sentences = []
  let currentJp = ''
  let currentCn = ''
  let jpFound = false
  let cnFound = false

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine === '') {
      // 遇到空行，检查是否有完整的句子对
      if (jpFound && cnFound) {
        sentences.push({ jp: currentJp, cn: currentCn })
        currentJp = ''
        currentCn = ''
        jpFound = false
        cnFound = false
      }
      continue
    }

    // 忽略场景设定等非对话内容
    if (trimmedLine.includes('场景设定') || trimmedLine.includes('重点练习')) {
      continue
    }

    // 检查是否是说话者行（A: 或 B:）
    const speakerMatch = trimmedLine.match(/^\s*([AB]):\s*(.+)$/)
    if (speakerMatch) {
      const [, speaker, text] = speakerMatch
      // 检查是否是日语句子（包含日语字符或片假名）
      if (/[\u3040-\u30ff\u3400-\u4dbf]/.test(text)) {
        if (jpFound && cnFound) {
          sentences.push({ jp: currentJp, cn: currentCn })
          currentJp = ''
          currentCn = ''
          jpFound = false
          cnFound = false
        }
        currentJp = text
        jpFound = true
      } else {
        // 中文翻译
        currentCn = text
        cnFound = true
      }
    } else {
      // 处理多行文本
      if (/[\u3040-\u30ff\u3400-\u4dbf]/.test(trimmedLine)) {
        currentJp += ' ' + trimmedLine
        jpFound = true
      } else {
        currentCn += ' ' + trimmedLine
        cnFound = true
      }
    }
  }

  // 添加最后一组句子
  if (jpFound && cnFound) {
    sentences.push({ jp: currentJp, cn: currentCn })
  }

  return sentences
}

// 上传文章
const handleUploadArticle = async () => {
  if (!articleForm.value.title || !articleForm.value.content) {
    uploadError.value = '请填写文章标题和内容'
    return
  }

  isUploading.value = true
  uploadError.value = ''
  uploadSuccess.value = ''

  try {
    // 解析文章内容
    const sentences = parseArticleContent(articleForm.value.content)
    if (sentences.length === 0) {
      uploadError.value = '无法解析文章内容，请检查格式'
      return
    }

    // 处理标签
    const tags = articleForm.value.tags
      ? articleForm.value.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : []

    // 调用 API 上传文章
    const response = await fetch('http://localhost:5000/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: articleForm.value.title,
        sentences,
        tags
      })
    })

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    if (!data._id) {
      throw new Error('上传失败: 服务器未返回文章ID')
    }

    uploadSuccess.value = '文章上传成功'
    // 清空表单
    articleForm.value.title = ''
    articleForm.value.content = ''
    articleForm.value.tags = ''
  } catch (err) {
    uploadError.value = err.message || '上传文章失败'
  } finally {
    isUploading.value = false
  }
}

// 组件挂载时检查登录状态
onMounted(() => {
  checkLoginStatus()
})
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
  color: #333;
}

.content {
  padding: 20px;
}

.login-prompt {
  text-align: center;
  padding: 40px 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.login-prompt p {
  margin-bottom: 20px;
  font-size: 16px;
  color: #666;
}

.auth-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.3s;
}

.login-btn {
  background-color: #4CAF50;
  color: white;
}

.login-btn:hover {
  background-color: #45a049;
}

.register-btn {
  background-color: #2196F3;
  color: white;
}

.register-btn:hover {
  background-color: #0b7dda;
}

.user-info {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  position: relative;
}

.user-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.user-info .email {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.user-info .admin-badge {
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin: 0;
}

.admin-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.admin-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.admin-form .form-group {
  margin: 0;
}

.admin-form .form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #333;
}

.admin-form .form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.generate-code-btn {
  background-color: #2196F3;
  color: white;
}

.generate-code-btn:hover {
  background-color: #0b7dda;
}

.code-result {
  background-color: #e8f5e8;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.code-result p {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #333;
}

.code-result .code-hint {
  font-size: 12px;
  color: #666;
  margin: 5px 0 0 0;
}

.code-result strong {
  font-size: 16px;
  color: #2e7d32;
}

.upload-article-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.upload-article-section h5 {
  margin: 0 0 15px 0;
  font-size: 15px;
  color: #333;
}

.article-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.article-form .form-group {
  margin: 0;
}

.article-form .form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #333;
}

.article-form .form-group input,
.article-form .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.article-form .form-group textarea {
  resize: vertical;
  min-height: 200px;
}

.upload-article-btn {
  background-color: #4CAF50;
  color: white;
}

.upload-article-btn:hover {
  background-color: #45a049;
}

.success-message {
  margin-top: 10px;
  padding: 10px;
  background-color: #e8f5e8;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.logout-btn {
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #d32f2f;
}
</style>