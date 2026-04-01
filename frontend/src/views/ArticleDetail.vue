<template>
  <div class="article-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">⬅ 返回</button>
      <h2>{{ articleData.title }}</h2>
      <div class="audio-controls">
        <button class="audio-btn" @click="togglePlay" :disabled="isLoading">
          {{ isPlaying ? '⏸ 暂停' : '▶ 朗读' }}
        </button>
        <button class="audio-btn" @click="toggleLoop" :disabled="!isPlaying || articleData.sentences.length === 0">
          {{ isLooping ? '🔄 循环中' : '🔄 循环' }}
        </button>
        <button class="audio-btn" @click="stopPlay" :disabled="!isPlaying">
          ⏹ 停止
        </button>
      </div>
      
      <!-- 右下角圆形悬浮球 -->
      <div class="floating-settings">
        <button class="floating-btn" @click="showSettings = !showSettings">
          ⚙️
        </button>
      </div>
      
      <!-- 居中弹窗 -->
      <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
        <div class="modal-content" @click.stop>
          <h3>朗读设置</h3>
          <div class="setting-item">
            <label for="speed">语速:</label>
            <input 
              type="range" 
              id="speed" 
              v-model.number="speechRate" 
              min="0.5" 
              max="2" 
              step="0.1"
            />
            <span>{{ speechRate.toFixed(1) }}x</span>
          </div>
          <div class="setting-item">
            <label for="voice">音色:</label>
            <select id="voice" v-model="selectedVoice">
              <option v-for="voice in availableVoices" :key="voice.name" :value="voice.name">
                {{ voice.name }}
              </option>
            </select>
          </div>
          <button class="close-btn" @click="showSettings = false">关闭</button>
        </div>
      </div>
    </header>

    <div class="article-content">
      <div v-if="isLoading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else>
        <p class="hint">💡 提示：点击每一句话可以查看或收起中文翻译哦！</p>

        <SentenceItem
            v-for="(item, index) in articleData.sentences"
            :key="index"
            :japanese="item.jp"
            :chinese="item.cn"
            :is-highlighted="currentSentenceIndex === index"
            @play-sentence="(text) => playSingleSentence(text)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import SentenceItem from '../components/Article/SentenceItem.vue'

const route = useRoute()
const articleData = ref({
  title: "",
  sentences: []
})
const isLoading = ref(false)
const error = ref('')

// 朗读相关变量
const isPlaying = ref(false)
const isLooping = ref(false)
const currentSentenceIndex = ref(-1)
const speechSynthesis = window.speechSynthesis
let currentUtterance = null
let playQueue = []

// 语速和音色设置
const speechRate = ref(1.0) // 默认语速调整为 1.0
const selectedVoice = ref('')
const availableVoices = ref([])
const showSettings = ref(false) // 控制设置面板的显示状态

// 加载文章详情
const loadArticle = async () => {
  const articleId = route.params.id
  console.log('加载文章 ID:', articleId)
  isLoading.value = true
  error.value = ''
  
  try {
    console.log('开始请求文章数据...')
    const response = await fetch(`http://localhost:5000/api/articles/${articleId}`)
    console.log('响应状态:', response.status)
    if (!response.ok) {
      throw new Error('获取文章失败')
    }
    const data = await response.json()
    console.log('获取到的文章数据:', data)
    articleData.value = data
  } catch (err) {
    console.error('加载文章失败:', err)
    error.value = err.message || '加载文章失败'
  } finally {
    isLoading.value = false
  }
}

// 切换播放/暂停
const togglePlay = () => {
  if (isPlaying.value) {
    speechSynthesis.pause()
    isPlaying.value = false
  } else {
    if (currentSentenceIndex.value === -1) {
      // 开始从头朗读
      startPlaying()
      // startPlaying 函数中已经设置了 isPlaying.value = true
    } else {
      // 恢复播放
      speechSynthesis.resume()
      isPlaying.value = true
    }
  }
}

// 停止播放
const stopPlay = () => {
  speechSynthesis.cancel()
  isPlaying.value = false
  isLooping.value = false
  currentSentenceIndex.value = -1
  playQueue = []
}

// 切换循环模式
const toggleLoop = () => {
  isLooping.value = !isLooping.value
  console.log('ArticleDetail: 循环模式', isLooping.value ? '开启' : '关闭')
}

// 获取可用的语音列表
const getAvailableVoices = () => {
  availableVoices.value = speechSynthesis.getVoices().filter(voice => {
    // 只显示日语语音
    return voice.lang.includes('ja')
  })
  
  // 如果有可用的语音，选择第一个作为默认值
  if (availableVoices.value.length > 0 && !selectedVoice.value) {
    selectedVoice.value = availableVoices.value[0].name
  }
}

// 播放单句
const playSingleSentence = (text) => {
  console.log('ArticleDetail: 接收到 play-sentence 事件，句子内容:', text)
  console.log('ArticleDetail: 当前语速:', speechRate.value)
  console.log('ArticleDetail: 当前音色:', selectedVoice.value)
  // 停止当前的播放
  speechSynthesis.cancel()
  
  // 创建朗读实例
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP' // 设置为日语
  utterance.rate = speechRate.value // 使用当前设置的语速
  utterance.pitch = 1 // 调整音调
  utterance.volume = 1 // 调整音量
  
  // 设置音色
  if (selectedVoice.value) {
    const voice = speechSynthesis.getVoices().find(v => v.name === selectedVoice.value)
    if (voice) {
      utterance.voice = voice
      console.log('ArticleDetail: 使用音色:', voice.name)
    } else {
      console.log('ArticleDetail: 未找到指定音色:', selectedVoice.value)
    }
  }
  
  // 开始朗读
  console.log('ArticleDetail: 开始朗读...')
  speechSynthesis.speak(utterance)
  
  // 监听朗读事件
  utterance.onstart = () => {
    console.log('ArticleDetail: 朗读开始')
  }
  
  utterance.onend = () => {
    console.log('ArticleDetail: 朗读结束')
  }
  
  utterance.onerror = (event) => {
    console.error('ArticleDetail: 朗读错误:', event)
  }
}

// 开始朗读
const startPlaying = () => {
  // 清空之前的队列
  speechSynthesis.cancel()
  playQueue = []
  currentSentenceIndex.value = -1
  isPlaying.value = true

  // 为每句话创建朗读实例
  articleData.value.sentences.forEach((sentence, index) => {
    const utterance = new SpeechSynthesisUtterance(sentence.jp)
    utterance.lang = 'ja-JP' // 设置为日语
    utterance.rate = speechRate.value // 使用当前设置的语速
    utterance.pitch = 1 // 调整音调
    utterance.volume = 1 // 调整音量
    
    // 设置音色
    if (selectedVoice.value) {
      const voice = speechSynthesis.getVoices().find(v => v.name === selectedVoice.value)
      if (voice) {
        utterance.voice = voice
      }
    }

    // 当这句话开始朗读时
    utterance.onstart = () => {
      currentSentenceIndex.value = index
    }

    // 当这句话朗读结束时
    utterance.onend = () => {
      if (index < articleData.value.sentences.length - 1) {
        // 继续朗读下一句
        speechSynthesis.speak(playQueue[index + 1])
      } else {
        // 全部朗读完毕
        if (isLooping.value) {
          // 如果开启了循环，重新开始朗读第一句
          console.log('ArticleDetail: 循环朗读，重新开始')
          speechSynthesis.speak(playQueue[0])
        } else {
          // 否则停止播放
          isPlaying.value = false
          currentSentenceIndex.value = -1
        }
      }
    }

    playQueue.push(utterance)
  })

  // 开始朗读第一句
  if (playQueue.length > 0) {
    speechSynthesis.speak(playQueue[0])
  } else {
    isPlaying.value = false
  }
}

// 组件挂载时加载文章详情
onMounted(() => {
  loadArticle()
  
  // 获取可用语音列表
  getAvailableVoices()
  
  // 监听语音列表变化
  speechSynthesis.onvoiceschanged = getAvailableVoices
})

// 组件卸载时停止播放
onUnmounted(() => {
  speechSynthesis.cancel()
  // 移除事件监听
  speechSynthesis.onvoiceschanged = null
})
</script>

<style scoped>
.article-page {
  /* 给文章详情页一个白色背景，覆盖掉底部的导航栏空间，让你专注于阅读 */
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 80px;
}

.page-header {
  background-color: #fff;
  padding: 15px 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  flex-wrap: wrap;
  gap: 10px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #4CAF50;
  margin-right: 15px;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-controls {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  align-items: center;
}

.audio-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #2196F3;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.audio-btn:hover {
  background-color: #0b7dda;
}

.audio-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 右下角圆形悬浮球 */
.floating-settings {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 9999;
}

.floating-btn {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background-color: #2196F3;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-btn:hover {
  background-color: #0b7dda;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
}

/* 模态遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 模态内容 */
.modal-content {
  background-color: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  min-width: 300px;
  max-width: 400px;
  width: 90%;
  animation: slideIn 0.3s ease-out;
}

/* 滑入动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 30px;
}

.setting-item label {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  min-width: 40px;
}

.setting-item input[type="range"] {
  flex: 1;
  min-width: 120px;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  outline: none;
  transition: all 0.3s;
}

.setting-item input[type="range"]:hover {
  background: #e0e0e0;
}

.setting-item input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #2196F3;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
}

.setting-item input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 6px rgba(33, 150, 243, 0.4);
}

.setting-item input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #2196F3;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
}

.setting-item input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 6px rgba(33, 150, 243, 0.4);
}

.setting-item select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.setting-item select:hover {
  border-color: #2196F3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
}

.setting-item select:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

/* 美化下拉选项 */
.setting-item select option {
  padding: 10px;
  background-color: white;
  color: #333;
  font-size: 14px;
}

.setting-item select option:hover {
  background-color: #f0f8ff;
  color: #2196F3;
}

.setting-item select option:checked {
  background-color: #e3f2fd;
  color: #1976D2;
}

.setting-item span {
  font-size: 14px;
  color: #666;
  min-width: 40px;
  text-align: right;
}

/* 关闭按钮 */
.close-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background-color: #f0f0f0;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: #e0e0e0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .audio-controls {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .floating-btn {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .modal-content {
    min-width: 280px;
    max-width: 90%;
    padding: 20px;
  }
}

.article-content {
  padding: 15px;
}

.hint {
  font-size: 12px;
  color: #888;
  text-align: center;
  margin-bottom: 15px;
}
</style>