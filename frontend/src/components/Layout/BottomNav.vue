<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" active-class="active">
      <span class="icon">📚</span>
      <span>文章</span>
    </router-link>
    <router-link to="/random" class="nav-item" active-class="active">
      <span class="icon">🎲</span>
      <span>随机一下</span>
    </router-link>
    <router-link to="/profile" class="nav-item" active-class="active">
      <span class="icon">👤</span>
      <span>个人</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #86868b;
  font-size: 12px;
  font-weight: 400;
  transition: all 0.3s ease;
  padding: 8px 0;
  min-width: 80px;
}

.nav-item .icon {
  font-size: 24px;
  margin-bottom: 4px;
  transition: transform 0.3s ease;
}

/* 点击激活后的样式 */
.nav-item.active {
  color: #0071e3;
}

.nav-item.active .icon {
  transform: scale(1.1);
}

.nav-item:hover {
  color: #1d1d1f;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .nav-item {
    min-width: 70px;
  }
  
  .nav-item .icon {
    font-size: 22px;
  }
  
  .nav-item span {
    font-size: 11px;
  }
}
</style>