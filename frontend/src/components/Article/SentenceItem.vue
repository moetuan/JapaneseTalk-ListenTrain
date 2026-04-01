<template>
  <div class="sentence-box" :class="{ 'highlighted': isHighlighted }">
    <div class="japanese-text" @click="handleJapaneseClick">
      {{ japanese }}
    </div>

    <div class="chinese-text" v-show="isTranslatedVisible" @click="handleChineseClick">
      {{ chinese }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 接收父组件（文章详情页）传过来的日文和中文数据
const props = defineProps({
  japanese: String,
  chinese: String,
  isHighlighted: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['play-sentence'])

// 定义一个响应式变量，默认不显示翻译 (false)
const isTranslatedVisible = ref(false)

// 处理日语句子点击事件
const handleJapaneseClick = () => {
  console.log('SentenceItem: 点击日语句子')
  console.log('SentenceItem: 日语句子:', props.japanese)
  // 展开翻译
  isTranslatedVisible.value = true
  // 触发播放句子的事件
  console.log('SentenceItem: 触发 play-sentence 事件')
  emit('play-sentence', props.japanese)
}

// 处理中文翻译点击事件
const handleChineseClick = (event) => {
  console.log('SentenceItem: 点击中文翻译')
  // 阻止事件冒泡
  event.stopPropagation()
  // 折叠翻译
  isTranslatedVisible.value = false
}
</script>

<style scoped>
.sentence-box {
  padding: 15px;
  margin-bottom: 10px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: background-color 0.2s;
}

.sentence-box.highlighted {
  background-color: #e3f2fd; /* 浅蓝色背景 */
  border-left: 4px solid #2196F3; /* 左侧蓝色边框 */
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2); /* 轻微的蓝色阴影 */
}

.japanese-text {
  font-size: 16px;
  color: #333;
  line-height: 1.5;
  cursor: pointer; /* 鼠标放上去会变成小手，提示可点击 */
  transition: color 0.2s;
}

.japanese-text:hover {
  color: #0071e3; /* 鼠标悬停时变色 */
}

.japanese-text:active {
  background-color: #f0f0f0; /* 点击时的反馈效果 */
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
}

.chinese-text {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee; /* 用虚线和日文隔开 */
  font-size: 14px;
  color: #4CAF50; /* 用绿色突出显示中文翻译 */
  line-height: 1.4;
  cursor: pointer; /* 鼠标放上去会变成小手，提示可点击 */
  transition: color 0.2s;
}

.chinese-text:hover {
  color: #388e3c; /* 鼠标悬停时变色 */
}

.chinese-text:active {
  background-color: #f1f8e9; /* 点击时的反馈效果 */
}
</style>